#!/usr/bin/env python3
"""
IHM Web du robot de coupe.
Nœud ROS2 + serveur FastAPI tournant dans un thread dédié.
Accessible sur http://<IP>:8080 (local kiosk Pi ou PC distant).
"""

import json
import math
import os
import threading
import time
from pathlib import Path

import rclpy
from geometry_msgs.msg import Pose2D
from nav_msgs.msg import Odometry
from rclpy.executors import MultiThreadedExecutor
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from std_msgs.msg import Bool, Empty, Float32, Float32MultiArray, Int8, String, UInt8, UInt8MultiArray
from std_srvs.srv import SetBool

try:
    import uvicorn
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.responses import HTMLResponse
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
    _FASTAPI_OK = True
except ImportError:
    _FASTAPI_OK = False


MAX_TRAJ_PTS = 500

# Résolution du répertoire static : d'abord via le share ROS2 (install normal),
# puis via le chemin source résolu (symlink-install dev).
try:
    from ament_index_python.packages import get_package_share_directory as _gpsd
    STATIC_DIR = Path(_gpsd('robot_ihm')) / 'static'
except Exception:
    STATIC_DIR = Path(__file__).resolve().parent.parent / 'static'


# ═══════════════════════════════════════════════════════════════════════════════
#  État partagé (thread-safe)
# ═══════════════════════════════════════════════════════════════════════════════

class RobotState:
    def __init__(self):
        self._lock = threading.Lock()
        self._data = {
            'odom':       {'x': 0.0, 'y': 0.0, 'theta': 0.0, 'stamp': 0.0},
            'power':      {'voltage': 0.0, 'current': 0.0, 'bau': False,
                           'relay_5v': False, 'relay_12v': False, 'relay_24v': False},
            'nav':        {'state': 'IDLE', 'dist_mm': 0, 'wp_progress': '0/0'},
            'strategy':   {'state': 'IDLE'},
            'perception': 'NO_ODOM',
            'trajectory': [],
            'system':     {'temp_c': 0.0, 'mem_pct': 0, 'load': 0.0},
            'tirette':    {'inserted': None},   # None=inconnu, True=en place, False=retirée
            'obstacles':  [],                   # [[wx, wy], ...] en coordonnées monde
            'proximity':  0.0,                  # 0=libre, 1=obstacle très proche
        }
        self._prev = (0.0, 0.0)
        self._can_log = []
        self._can_log_lock = threading.Lock()
        self._board_seen = {'mot': 0.0, 'power': 0.0, 'lidar': 0.0}
        self._board_lock = threading.Lock()

    def add_can_log(self, direction, can_id, cmd, desc):
        ts = time.strftime('%H:%M:%S') + '.{:03d}'.format(int(time.time() * 1000) % 1000)
        entry = {'ts': ts, 'dir': direction, 'id': can_id, 'cmd': cmd, 'desc': desc}
        with self._can_log_lock:
            self._can_log.append(entry)
            if len(self._can_log) > 200:
                self._can_log.pop(0)

    def update(self, key, value):
        with self._lock:
            self._data[key] = value

    def update_odom(self, x, y, theta):
        with self._lock:
            dx = x - self._prev[0]
            dy = y - self._prev[1]
            if dx * dx + dy * dy > 4e-4:   # Nouveau point tous les ~20 mm
                self._data['trajectory'].append([round(x, 3), round(y, 3)])
                if len(self._data['trajectory']) > MAX_TRAJ_PTS:
                    self._data['trajectory'].pop(0)
                self._prev = (x, y)
            self._data['odom'].update({
                'x': round(x, 4), 'y': round(y, 4),
                'theta': round(theta, 4), 'stamp': time.time(),
            })

    def update_board_seen(self, name: str):
        with self._board_lock:
            self._board_seen[name] = time.time()

    def snapshot(self):
        with self._lock:
            data = json.loads(json.dumps(self._data))
        with self._can_log_lock:
            data['can_log'] = list(self._can_log[-50:])
        with self._board_lock:
            now = time.time()
            data['boards'] = {k: (now - v) < 5.0 for k, v in self._board_seen.items()}
        return data

    def clear_trajectory(self):
        with self._lock:
            self._data['trajectory'].clear()
            self._prev = (self._data['odom']['x'], self._data['odom']['y'])


# ═══════════════════════════════════════════════════════════════════════════════
#  Nœud ROS2
# ═══════════════════════════════════════════════════════════════════════════════

class RobotIHMNode(Node):

    def __init__(self, state: RobotState):
        super().__init__('robot_ihm')
        self.state = state

        self.declare_parameter('port',         8080)
        self.declare_parameter('strategy_dir', '/config')
        self._last_nav_state = ''

        # Subscriptions
        self.create_subscription(Odometry,         '/odom',                  self._odom_cb,       10)
        self.create_subscription(Float32MultiArray, '/power_status',          self._power_cb,      10)
        self.create_subscription(Bool,             '/power/emergency_stop',   self._bau_cb,        10)
        self.create_subscription(String,           '/motors/nav_status',      self._nav_cb,        10)
        self.create_subscription(String,           '/strategy/state',         self._strategy_cb,   10)
        self.create_subscription(String,           '/perception/health',      self._perception_cb, 10)
        self.create_subscription(UInt8MultiArray,  '/power/relay_state',      self._relay_state_cb, 10)
        self.create_subscription(Bool,             '/sensors/jack',           self._tirette_cb,     10)
        self.create_subscription(Float32,          '/obstacle/proximity',     self._proximity_cb,   10)
        self.create_subscription(LaserScan,        '/scan',                   self._scan_cb,        10)

        # Publishers
        self._goto_pub        = self.create_publisher(Pose2D,           '/nav/goto_target',  10)
        self._cancel_pub      = self.create_publisher(Empty,            '/nav/cancel',       10)
        self._motor_cmd_pub   = self.create_publisher(String,           '/motors/command',   10)
        self._conv_pub        = self.create_publisher(Int8,             '/conveyor/cmd',     10)
        self._elev_pub     = self.create_publisher(Int8,            '/elevator/cmd',     10)
        self._servo_pub    = self.create_publisher(Float32MultiArray, '/arm/servo_cmd',  10)
        self._stepper_pub  = self.create_publisher(Float32MultiArray, '/arm/stepper_cmd',10)
        self._strat_pub    = self.create_publisher(String,          '/strategy/command', 10)
        self._tuning_pub   = self.create_publisher(Float32MultiArray, '/motors/coeff_set', 10)

        # Clients services relais
        self._relay_clients = {
            '5v':  self.create_client(SetBool, '/relay/relay_5v'),
            '12v': self.create_client(SetBool, '/relay/relay_12v'),
            '24v': self.create_client(SetBool, '/relay/relay_24v'),
        }

        self.create_timer(3.0, self._system_cb)
        self.get_logger().info('robot_ihm nœud ROS2 démarré')

    # ── Callbacks ROS2 ────────────────────────────────────────────────────────

    def _odom_cb(self, msg: Odometry):
        x = msg.pose.pose.position.x
        y = msg.pose.pose.position.y
        q = msg.pose.pose.orientation
        theta = math.atan2(2 * (q.w * q.z + q.x * q.y),
                           1 - 2 * (q.y * q.y + q.z * q.z))
        self.state.update_odom(x, y, theta)
        self.state.update_board_seen('mot')

    def _power_cb(self, msg: Float32MultiArray):
        d = msg.data
        if len(d) >= 5:
            p = self.state.snapshot()['power']
            p.update({'voltage': round(float(d[0]), 2), 'current': round(float(d[1]), 2),
                      'relay_5v': bool(d[2]), 'relay_12v': bool(d[3]), 'relay_24v': bool(d[4])})
            self.state.update('power', p)
        self.state.update_board_seen('power')

    def _relay_state_cb(self, msg: UInt8MultiArray):
        if len(msg.data) < 3:
            return
        p = self.state.snapshot()['power']
        p['relay_5v']  = bool(msg.data[0])
        p['relay_12v'] = bool(msg.data[1])
        p['relay_24v'] = bool(msg.data[2])
        self.state.update('power', p)
        self.state.update_board_seen('power')

    def _bau_cb(self, msg: Bool):
        p = self.state.snapshot()['power']
        prev = bool(p.get('bau', False))
        p['bau'] = msg.data
        self.state.update('power', p)
        self.state.update_board_seen('power')
        if bool(msg.data) != prev:
            self.state.add_can_log('RX', '0x022', 'ESTOP', f'active={bool(msg.data)}')

    def _nav_cb(self, msg: String):
        # Format (new): STATE:waypoints_remaining
        parts = msg.data.split(':')
        nav = {'state': parts[0], 'dist_mm': 0, 'wp_progress': '0'}
        if len(parts) >= 2:
            try:
                remaining = int(parts[1])
            except ValueError:
                remaining = 0
            nav['wp_progress'] = str(remaining)
            nav['dist_mm'] = remaining
        self.state.update('nav', nav)
        self.state.update_board_seen('mot')
        if parts[0] != self._last_nav_state:
            self._last_nav_state = parts[0]
            self.state.add_can_log('RX', '0x010', 'MSG_STATUS',
                                   f'{parts[0]} remaining={nav["wp_progress"]}')

    def _strategy_cb(self, msg: String):
        self.state.update('strategy', {'state': msg.data})

    def _perception_cb(self, msg: String):
        self.state.update('perception', msg.data)
        self.state.update_board_seen('lidar')

    def _tirette_cb(self, msg: Bool):
        # pull_up=True: data=False→en place (GND), data=True→retirée (circuit ouvert)
        inserted = not bool(msg.data)
        self.state.update('tirette', {'inserted': inserted})

    def _proximity_cb(self, msg: Float32):
        self.state.update('proximity', float(msg.data))

    def _scan_cb(self, msg: LaserScan):
        snap = self.state.snapshot()
        rx  = snap['odom']['x']
        ry  = snap['odom']['y']
        rth = snap['odom']['theta']
        max_dist = 1.5
        obstacles = []
        n = len(msg.ranges)
        if n == 0:
            return
        step = max(1, n // 60)
        for i in range(0, n, step):
            r = msg.ranges[i]
            if not (msg.range_min <= r <= min(msg.range_max, max_dist)):
                continue
            angle = msg.angle_min + i * msg.angle_increment
            wx = rx + r * math.cos(rth + angle)
            wy = ry + r * math.sin(rth + angle)
            if 0.0 <= wx <= 3.0 and 0.0 <= wy <= 2.0:
                obstacles.append([round(wx, 2), round(wy, 2)])
        self.state.update('obstacles', obstacles)
        self.state.update_board_seen('lidar')

    # ── API ROS2 (appelée depuis thread pool FastAPI) ─────────────────────────

    def call_relay(self, name: str, on: bool) -> bool:
        client = self._relay_clients.get(name)
        if not client or not client.wait_for_service(timeout_sec=1.0):
            return False
        req = SetBool.Request()
        req.data = on
        future = client.call_async(req)
        rclpy.spin_until_future_complete(self, future, timeout_sec=3.0)
        return future.done() and future.result().success

    def pub_goto(self, x: float, y: float, theta_deg: float):
        msg = Pose2D()
        msg.x     = float(x)
        msg.y     = float(y)
        msg.theta = float(theta_deg) * math.pi / 180.0
        self._goto_pub.publish(msg)
        self.state.add_can_log('TX', '0x011', 'CMD_WP_ADD',
                               f'goto_target x={int(x*1000)}mm y={int(y*1000)}mm th={theta_deg:.0f}deg')

    def pub_motor_cmd(self, cmd: str):
        msg = String()
        msg.data = cmd
        self._motor_cmd_pub.publish(msg)

    def pub_move_line(self, dist_mm: int, speed_cm_s: int):
        s = self.state.snapshot()['odom']
        x, y, th = s['x'], s['y'], s['theta']
        dist_m = float(dist_mm) / 1000.0
        v_lin_mps = max(0.0, float(speed_cm_s) / 100.0)
        x2 = x + dist_m * math.cos(th)
        y2 = y + dist_m * math.sin(th)
        self.pub_motor_cmd(f'wp_add {x2:.4f} {y2:.4f} {th:.4f} {v_lin_mps:.3f}')
        self.state.add_can_log('TX', '0x011', 'CMD_WP_ADD',
                               f'x={x2:.3f} y={y2:.3f} th={th:.3f} v={v_lin_mps:.2f}')

    def pub_rotate_angle(self, angle_deg_x10: int, speed_deg_s: int):
        s = self.state.snapshot()['odom']
        x, y, th = s['x'], s['y'], s['theta']
        delta_rad = (float(angle_deg_x10) / 10.0) * math.pi / 180.0
        th2 = th + delta_rad
        v_lin_mps = 0.15
        self.pub_motor_cmd(f'wp_add {x:.4f} {y:.4f} {th2:.4f} {v_lin_mps:.3f}')
        self.state.add_can_log('TX', '0x011', 'CMD_WP_ADD',
                               f'rot th={th2:.3f} v={v_lin_mps:.2f}')

    def pub_cancel(self):
        self._cancel_pub.publish(Empty())
        self.state.add_can_log('TX', '0x011', 'CMD_STOP', 'navigation stop')

    def pub_arm_servo(self, angles):
        msg = Float32MultiArray()
        msg.data = [float(a) for a in angles]
        self._servo_pub.publish(msg)

    def pub_arm_stepper(self, steps: int):
        msg = Float32MultiArray()
        msg.data = [float(steps)]
        self._stepper_pub.publish(msg)

    def pub_conveyor(self, direction: int):
        msg = Int8()
        msg.data = int(direction)
        self._conv_pub.publish(msg)

    def pub_elevator(self, pos: int):
        msg = Int8()
        msg.data = int(max(0, min(100, pos)))
        self._elev_pub.publish(msg)

    def pub_strategy_cmd(self, cmd: str, name: str = ''):
        msg = String()
        msg.data = f'{cmd}:{name}' if name else cmd
        self._strat_pub.publish(msg)

    def pub_motor_test(self, test: str):
        s = self.state.snapshot()['odom']
        x, y, th = s['x'], s['y'], s['theta']
        if test == 'stop':
            self.pub_motor_cmd('stop')
        elif test == 'push_wall':
            self.pub_motor_cmd('push_wall 40 1.0')
        elif test == 'set_pose_zero':
            self.pub_motor_cmd('set_pose 0 0 0')
        elif test == 'forward_0_5m':
            x2 = x + 0.5 * math.cos(th)
            y2 = y + 0.5 * math.sin(th)
            self.pub_motor_cmd(f'wp_add {x2:.4f} {y2:.4f} {th:.4f} 0.20')
        elif test == 'turn_left_90':
            self.pub_motor_cmd(f'wp_add {x:.4f} {y:.4f} {th + math.pi / 2:.4f} 0.15')
        elif test == 'turn_right_90':
            self.pub_motor_cmd(f'wp_add {x:.4f} {y:.4f} {th - math.pi / 2:.4f} 0.15')

    def get_strategy_detail(self, filename: str) -> dict:
        d = Path(self.get_parameter('strategy_dir').value) / filename
        if not d.exists():
            return {}
        try:
            return json.loads(d.read_text())
        except Exception:
            return {}

    # CoeffId enum values from driver
    _COEFF_IDS = {
        'vel_kp': 0x01, 'vel_ki': 0x02, 'vel_i_limit': 0x03,
        'max_wheel_speed_mps': 0x04,
        'hold_zero_kp_x': 0x10, 'hold_zero_kp_y': 0x11, 'hold_zero_kp_theta': 0x12,
        'hold_zero_max_linear_mps': 0x13, 'hold_zero_max_angular_radps': 0x14,
        'hold_zero_pos_tol_m': 0x15, 'hold_zero_theta_tol_rad': 0x16,
        'goto_phase1_angle_thresh_rad': 0x20, 'goto_phase2_dist_thresh_m': 0x21,
        'goto_arrived_dist_m': 0x22, 'goto_arrived_angle_rad': 0x23,
        'goto_phase1_rot_kp': 0x24, 'goto_phase2_linear_kp': 0x25,
        'goto_phase2_angular_kp': 0x26, 'goto_max_linear_mps': 0x27,
        'goto_max_angular_half': 0x28, 'max_deceleration_mps2': 0x29,
    }
    _COEFF_DEFAULTS = {
        'vel_kp': 25.0, 'vel_ki': 8.0, 'vel_i_limit': 5.0,
        'max_wheel_speed_mps': 0.80,
        'hold_zero_kp_x': 2.2, 'hold_zero_kp_y': 6.0, 'hold_zero_kp_theta': 3.5,
        'hold_zero_max_linear_mps': 0.35, 'hold_zero_max_angular_radps': 3.5,
        'hold_zero_pos_tol_m': 0.01, 'hold_zero_theta_tol_rad': 0.03,
        'goto_phase1_angle_thresh_rad': 0.100, 'goto_phase2_dist_thresh_m': 0.050,
        'goto_arrived_dist_m': 0.020, 'goto_arrived_angle_rad': 0.050,
        'goto_phase1_rot_kp': 0.8, 'goto_phase2_linear_kp': 0.5,
        'goto_phase2_angular_kp': 1.5, 'goto_max_linear_mps': 0.40,
        'goto_max_angular_half': 0.20, 'max_deceleration_mps2': 0.30,
    }

    def get_motor_coefficients(self) -> dict:
        cfg = Path('/config/motor_coefficients.json')
        if cfg.exists():
            try:
                saved = json.loads(cfg.read_text())
                return {**self._COEFF_DEFAULTS, **saved}
            except Exception:
                pass
        return dict(self._COEFF_DEFAULTS)

    def set_motor_coefficients(self, coefs: dict) -> bool:
        try:
            merged = {**self._COEFF_DEFAULTS, **{k: float(v) for k, v in coefs.items() if k in self._COEFF_DEFAULTS}}
            Path('/config/motor_coefficients.json').write_text(json.dumps(merged, indent=2))
            # Publish all coefficients as [id0, val0, id1, val1, ...] pairs
            payload = []
            for key, val in merged.items():
                coeff_id = self._COEFF_IDS.get(key)
                if coeff_id is not None:
                    payload.extend([float(coeff_id), float(val)])
                    self.state.add_can_log('TX', '0x011', 'CMD_TUNING_SET',
                                           f'{key}=0x{coeff_id:02X} val={val:.4g}')
            msg = Float32MultiArray()
            msg.data = payload
            self._tuning_pub.publish(msg)
            return True
        except Exception as e:
            self.get_logger().error(f'Coeff save error: {e}')
            return False

    def _system_cb(self):
        try:
            with open('/sys/class/thermal/thermal_zone0/temp') as f:
                temp = int(f.read().strip()) / 1000.0
        except Exception:
            temp = 0.0
        try:
            with open('/proc/meminfo') as f:
                lines = f.read().split('\n')
            mem = {}
            for line in lines:
                parts = line.split()
                if len(parts) >= 2 and parts[0] in ('MemTotal:', 'MemAvailable:'):
                    mem[parts[0]] = int(parts[1])
            mem_pct = int(100 * (1 - mem.get('MemAvailable:', 1) / max(mem.get('MemTotal:', 1), 1)))
        except Exception:
            mem_pct = 0
        try:
            with open('/proc/loadavg') as f:
                load = float(f.read().split()[0])
        except Exception:
            load = 0.0
        self.state.update('system', {'temp_c': round(temp, 1), 'mem_pct': mem_pct, 'load': round(load, 2)})

    def get_strategy_list(self):
        d = Path(self.get_parameter('strategy_dir').value)
        if not d.exists():
            return []
        result = []
        for f in sorted(d.glob('strategy_*.json')):
            try:
                data = json.loads(f.read_text())
                result.append({'file': f.name, 'name': data.get('name', f.stem)})
            except Exception:
                pass
        return result


# ═══════════════════════════════════════════════════════════════════════════════
#  Serveur FastAPI
# ═══════════════════════════════════════════════════════════════════════════════

def build_app(ros_node: RobotIHMNode, state: RobotState) -> 'FastAPI':
    import asyncio
    import concurrent.futures

    app = FastAPI(title='Robot IHM')
    _pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)

    # ── WebSocket broadcast ───────────────────────────────────────────────────

    _ws_clients: set = set()
    _ws_lock = threading.Lock()

    @app.websocket('/ws')
    async def websocket_endpoint(ws: WebSocket):
        await ws.accept()
        with _ws_lock:
            _ws_clients.add(ws)
        try:
            while True:
                await ws.receive_text()  # Garder la connexion vivante
        except WebSocketDisconnect:
            pass
        finally:
            with _ws_lock:
                _ws_clients.discard(ws)

    async def _broadcast_loop():
        while True:
            snap = state.snapshot()
            dead = set()
            with _ws_lock:
                clients = set(_ws_clients)
            for ws in clients:
                try:
                    await ws.send_json(snap)
                except Exception:
                    dead.add(ws)
            with _ws_lock:
                _ws_clients.difference_update(dead)
            await asyncio.sleep(0.1)

    @app.on_event('startup')
    async def _startup():
        asyncio.create_task(_broadcast_loop())

    # ── Modèles Pydantic ──────────────────────────────────────────────────────

    class GotoReq(BaseModel):
        x: float
        y: float
        theta: float = 0.0

    class RelayReq(BaseModel):
        state: bool

    class ServoReq(BaseModel):
        angles: list

    class StepperReq(BaseModel):
        steps: int

    class ConveyorReq(BaseModel):
        direction: int  # -1, 0, 1

    class ElevatorReq(BaseModel):
        position: int   # 0-100

    class StrategyReq(BaseModel):
        name: str = ''

    class LogReq(BaseModel):
        message: str
        level: str = 'INFO'

    # ── Endpoints REST ────────────────────────────────────────────────────────

    @app.get('/')
    async def root():
        index = STATIC_DIR / 'index.html'
        return HTMLResponse(index.read_text())

    @app.get('/api/state')
    async def get_state():
        return state.snapshot()

    @app.post('/api/nav/goto')
    async def goto(req: GotoReq):
        ros_node.pub_goto(req.x, req.y, req.theta)
        return {'ok': True}

    @app.post('/api/nav/cancel')
    async def cancel():
        ros_node.pub_cancel()
        return {'ok': True}

    @app.post('/api/nav/trajectory/clear')
    async def clear_traj():
        state.clear_trajectory()
        return {'ok': True}

    @app.post('/api/relay/{name}')
    async def relay(name: str, req: RelayReq):
        loop = asyncio.get_event_loop()
        ok = await loop.run_in_executor(_pool, ros_node.call_relay, name, req.state)
        return {'ok': ok}

    @app.post('/api/arm/servo')
    async def arm_servo(req: ServoReq):
        ros_node.pub_arm_servo(req.angles)
        return {'ok': True}

    @app.post('/api/arm/stepper')
    async def arm_stepper(req: StepperReq):
        ros_node.pub_arm_stepper(req.steps)
        return {'ok': True}

    @app.post('/api/actuator/conveyor')
    async def conveyor(req: ConveyorReq):
        ros_node.pub_conveyor(req.direction)
        return {'ok': True}

    @app.post('/api/actuator/elevator')
    async def elevator(req: ElevatorReq):
        ros_node.pub_elevator(req.position)
        return {'ok': True}

    @app.get('/api/strategy/list')
    async def strategy_list():
        return ros_node.get_strategy_list()

    @app.post('/api/strategy/start')
    async def strategy_start(req: StrategyReq):
        ros_node.pub_strategy_cmd('start', req.name)
        return {'ok': True}

    @app.post('/api/strategy/stop')
    async def strategy_stop():
        ros_node.pub_strategy_cmd('stop')
        return {'ok': True}

    # ── Nouvelles routes ──────────────────────────────────────────────────────

    class MotorTestReq(BaseModel):
        test: str

    class MoveLineReq(BaseModel):
        dist_mm: int
        speed_cm_s: int = 10

    class RotateAngleReq(BaseModel):
        angle_deg_x10: int
        speed_deg_s: int = 30

    class MotorCmdReq(BaseModel):
        cmd: str

    class CoeffReq(BaseModel):
        vel_kp: float = 25.0
        vel_ki: float = 8.0
        vel_i_limit: float = 5.0
        max_wheel_speed_mps: float = 0.80
        hold_zero_kp_x: float = 2.2
        hold_zero_kp_y: float = 6.0
        hold_zero_kp_theta: float = 3.5
        hold_zero_max_linear_mps: float = 0.35
        hold_zero_max_angular_radps: float = 3.5
        hold_zero_pos_tol_m: float = 0.01
        hold_zero_theta_tol_rad: float = 0.03
        goto_phase1_angle_thresh_rad: float = 0.100
        goto_phase2_dist_thresh_m: float = 0.050
        goto_arrived_dist_m: float = 0.020
        goto_arrived_angle_rad: float = 0.050
        goto_phase1_rot_kp: float = 0.8
        goto_phase2_linear_kp: float = 0.5
        goto_phase2_angular_kp: float = 1.5
        goto_max_linear_mps: float = 0.40
        goto_max_angular_half: float = 0.20
        max_deceleration_mps2: float = 0.30

    @app.get('/api/strategy/detail')
    async def strategy_detail(file: str = ''):
        return ros_node.get_strategy_detail(file) if file else {}

    # ── Éditeur de stratégies ─────────────────────────────────────────────────

    @app.get('/strategy-editor')
    async def strategy_editor_page():
        p = STATIC_DIR / 'strategy_editor.html'
        return HTMLResponse(p.read_text() if p.exists() else '<h1>strategy_editor.html introuvable</h1>')

    class StrategySaveReq(BaseModel):
        file:        str  = ''
        name:        str
        team:        str  = ''
        description: str  = ''
        version:     int  = 1
        waypoints:   list = []

    class StrategyDuplicateReq(BaseModel):
        src_file: str
        new_name: str = ''

    @app.post('/api/strategy/save')
    async def strategy_save(req: StrategySaveReq):
        import re as _re
        d = Path(ros_node.get_parameter('strategy_dir').value)
        d.mkdir(parents=True, exist_ok=True)
        fname = req.file
        if not fname:
            safe  = _re.sub(r'[^\w]', '_', req.name.lower())[:28] or 'strategy'
            fname = f'strategy_{safe}.json'
            n = 1
            while (d / fname).exists():
                fname = f'strategy_{safe}_{n}.json'
                n += 1
        # Safety: forbid path traversal
        if '..' in fname or '/' in fname or '\\' in fname:
            return {'ok': False, 'error': 'invalid filename'}
        data = {
            'name':        req.name,
            'team':        req.team,
            'version':     req.version,
            'description': req.description,
            'waypoints':   req.waypoints,
        }
        (d / fname).write_text(json.dumps(data, indent=2, ensure_ascii=False))
        return {'ok': True, 'file': fname}

    @app.delete('/api/strategy/delete')
    async def strategy_delete(file: str = ''):
        if not file or '..' in file or '/' in file or '\\' in file:
            return {'ok': False, 'error': 'invalid'}
        d = Path(ros_node.get_parameter('strategy_dir').value)
        p = d / file
        if not p.exists():
            return {'ok': False, 'error': 'not found'}
        p.unlink()
        return {'ok': True}

    @app.post('/api/strategy/duplicate')
    async def strategy_duplicate(req: StrategyDuplicateReq):
        import re as _re
        d   = Path(ros_node.get_parameter('strategy_dir').value)
        src = d / req.src_file
        if not src.exists():
            return {'ok': False, 'error': 'not found'}
        data = json.loads(src.read_text())
        data['name'] = req.new_name or (data.get('name', 'Copie') + ' (copie)')
        safe  = _re.sub(r'[^\w]', '_', data['name'].lower())[:28] or 'copy'
        fname = f'strategy_{safe}.json'
        n = 1
        while (d / fname).exists():
            fname = f'strategy_{safe}_{n}.json'
            n += 1
        (d / fname).write_text(json.dumps(data, indent=2, ensure_ascii=False))
        return {'ok': True, 'file': fname}

    @app.post('/api/motor/move_line')
    async def motor_move_line(req: MoveLineReq):
        ros_node.pub_move_line(req.dist_mm, req.speed_cm_s)
        return {'ok': True}

    @app.post('/api/motor/rotate_angle')#
    async def motor_rotate_angle(req: RotateAngleReq):
        ros_node.pub_rotate_angle(req.angle_deg_x10, req.speed_deg_s)
        return {'ok': True}

    @app.post('/api/motor/command')
    async def motor_command(req: MotorCmdReq):
        ros_node.pub_motor_cmd(req.cmd)
        return {'ok': True}

    @app.post('/api/motor/test')
    async def motor_test(req: MotorTestReq):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_pool, ros_node.pub_motor_test, req.test)
        return {'ok': True}

    @app.get('/api/motor/coefficients')
    async def get_coeff():
        return ros_node.get_motor_coefficients()

    @app.post('/api/motor/coefficients')
    async def set_coeff(req: CoeffReq):
        ok = ros_node.set_motor_coefficients(req.model_dump())
        return {'ok': ok}

    # Fichiers statiques (CSS, JS)
    if STATIC_DIR.exists():
        app.mount('/static', StaticFiles(directory=str(STATIC_DIR), follow_symlink=True), name='static')

    return app


# ═══════════════════════════════════════════════════════════════════════════════
#  Point d'entrée
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    if not _FASTAPI_OK:
        print('[robot_ihm] ERREUR: fastapi/uvicorn non installés. '
              'Lancer: pip install fastapi uvicorn')
        return

    rclpy.init()
    state    = RobotState()
    ros_node = RobotIHMNode(state)
    port     = int(ros_node.get_parameter('port').value)

    # Spin ROS2 dans un thread daemon
    executor = MultiThreadedExecutor()
    executor.add_node(ros_node)
    spin_thread = threading.Thread(target=executor.spin, daemon=True)
    spin_thread.start()

    ros_node.get_logger().info(f'IHM disponible sur http://0.0.0.0:{port}')

    app = build_app(ros_node, state)
    uvicorn.run(app, host='0.0.0.0', port=port, log_level='warning')

    executor.shutdown()
    ros_node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
