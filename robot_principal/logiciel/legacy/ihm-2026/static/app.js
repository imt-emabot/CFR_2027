'use strict';

// ── État global ────────────────────────────────────────────────────────────
const state = {
  odom:       { x: 0, y: 0, theta: 0, stamp: 0 },
  power:      { voltage: 0, current: 0, bau: false, relay_5v: false, relay_12v: false, relay_24v: false },
  nav:        { state: 'IDLE', dist_mm: 0, wp_progress: '0/0' },
  strategy:   { state: 'IDLE' },
  perception: 'NO_ODOM',
  trajectory: [],
  system:     { temp_c: 0, mem_pct: 0, load: 0 },
  can_log:    [],
};

let wsConnected     = false;
let selectedStrategy = '';
let _lastCanLogLen  = 0;
let _arenaImg       = null;
let _arenaImgLoaded = false;
window.strategyWaypoints = [];
window.strategyTeamColor  = '#4488ff';

// ── Arena image préchargement ─────────────────────────────────────────────
(function preloadArena() {
  const img = new Image();
  img.onload = () => { _arenaImg = img; _arenaImgLoaded = true; drawArena(); };
  img.onerror = () => { _arenaImgLoaded = false; };
  img.src = '/static/arena.png';
})();

// ── WebSocket ──────────────────────────────────────────────────────────────
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}/ws`);

  ws.onopen = () => {
    wsConnected = true;
    setDot('dot-ws', 'green');
  };

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      Object.assign(state, data);
      updateUI();
    } catch {}
  };

  ws.onclose = () => {
    wsConnected = false;
    setDot('dot-ws', 'red');
    setTimeout(connectWS, 2000);
  };

  ws.onerror = () => ws.close();
}

function setDot(id, cls) {
  const d = document.getElementById(id);
  if (d) d.className = 'dot' + (cls ? ' ' + cls : '');
}

// ── Horloge ────────────────────────────────────────────────────────────────
setInterval(() => {
  setText('clock', new Date().toLocaleTimeString('fr-FR', { hour12: false }));
}, 1000);

// ── Mise à jour UI ─────────────────────────────────────────────────────────
function updateUI() {
  const { x, y, theta } = state.odom;
  const thetaDeg = (theta * 180 / Math.PI).toFixed(1);

  // Header pills
  setText('hdr-nav-state', state.nav.state);
  const stratRaw = state.strategy.state;
  setText('hdr-strat-state', stratRaw.startsWith('RUNNING') ? 'EN COURS' : stratRaw);

  // BAU
  const bau = state.power.bau;
  setDot('dot-bau', bau ? 'red' : 'green');
  const bauEl = document.getElementById('bau-indicator');
  if (bauEl) {
    bauEl.textContent = bau ? '⚠ BAU : ACTIF !' : '◉ BAU : OK';
    bauEl.className   = bau ? 'bau-alert' : 'bau-ok';
  }

  // Nav badge
  const navBadge = document.getElementById('nav-badge');
  if (navBadge) {
    navBadge.textContent = state.nav.state;
    navBadge.className = 'badge nav-' + state.nav.state.toLowerCase();
  }

  // Pose
  setText('pose-display', `x:${x.toFixed(3)}  y:${y.toFixed(3)}  θ:${thetaDeg}°`);

  // Alimentation
  setText('voltage', state.power.voltage.toFixed(1));
  setText('current', state.power.current.toFixed(2));
  updateRelayBtn('5v',  state.power.relay_5v);
  updateRelayBtn('12v', state.power.relay_12v);
  updateRelayBtn('24v', state.power.relay_24v);

  // Mission
  const stratState = state.strategy.state;
  setText('mission-state', stratState);

  // Système
  const temp = state.system?.temp_c ?? 0;
  const mem  = state.system?.mem_pct ?? 0;
  const load = state.system?.load ?? 0;

  const tempStr = temp > 0 ? temp.toFixed(1) + '°C' : '--.-°C';
  setText('hdr-temp',     tempStr);
  setText('sys-temp-big', tempStr);
  setText('bar-temp-lbl', temp > 0 ? temp.toFixed(1) + '°C' : '--');
  setText('bar-mem-lbl',  mem + '%');
  setText('bar-load-lbl', load.toFixed(2));

  setBarWidth('bar-temp', Math.min(100, (temp / 85) * 100));
  setBarWidth('bar-mem',  mem);
  setBarWidth('bar-load', Math.min(100, load * 25));

  setText('sys-x',     x.toFixed(3) + ' m');
  setText('sys-y',     y.toFixed(3) + ' m');
  setText('sys-theta', thetaDeg + '°');
  setText('sys-perc',  state.perception);

  // CAN log — uniquement si l'onglet est visible
  const canPage = document.getElementById('page-can');
  if (canPage && canPage.classList.contains('active')) {
    updateCanLog(state.can_log || []);
  }

  // Canvas (seulement si navigation actif)
  const navPage = document.getElementById('page-navigation');
  if (navPage && navPage.classList.contains('active')) {
    drawArena();
  }

  // Mode match
  if (matchState.active) {
    if (matchState.phase === 'ready') {
      updateMatchReadyUI();
    } else if (matchState.phase === 'running') {
      const prox    = state.proximity ?? 0;
      const distM   = state.nav?.lidar_min_danger_m;
      const hasObstacle = (distM !== null && distM !== undefined && distM < 0.50);
      const showLogo = matchState.logoMode && !hasObstacle;

      const canvas = document.getElementById('match-arena-canvas');
      const logo   = document.getElementById('match-logo');
      if (canvas) canvas.style.display = showLogo ? 'none' : 'block';
      if (logo)   logo.style.display   = showLogo ? 'block' : 'none';

      if (!showLogo) drawMatchArena();

      const bar = document.getElementById('mr-proximity-bar');
      if (bar) {
        bar.style.width = Math.round(prox * 100) + '%';
        bar.style.background = prox > 0.7 ? '#ff4455' : prox > 0.4 ? '#ffaa00' : '#33cc77';
      }
    }
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setBarWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
}

function updateRelayBtn(name, on) {
  const btn = document.getElementById(`relay-btn-${name}`);
  const lbl = document.getElementById(`relay-lbl-${name}`);
  if (btn) {
    btn.className = 'relay-big-btn ' + (on ? 'relay-on' : 'relay-off');
  }
  if (lbl) lbl.textContent = on ? 'ON' : 'OFF';
}

// ── Onglets ────────────────────────────────────────────────────────────────
function switchTab(btn) {
  const tab = btn.dataset.tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const page = document.getElementById('page-' + tab);
  if (page) page.classList.add('active');
  const canCloseBtn = document.getElementById('can-close-btn');
  if (canCloseBtn) canCloseBtn.style.display = tab === 'can' ? 'flex' : 'none';
  if (tab === 'navigation') {
    setTimeout(resizeCanvas, 20);
  }
  if (tab === 'can') {
    // reset tracker pour afficher le log complet à l'entrée dans l'onglet
    _lastCanLogLen = 0;
    updateCanLog(state.can_log || []);
  }
  if (tab === 'camera') {
    // resize l'overlay et démarre le poll si le flux tourne
    setTimeout(drawArucoOverlay, 50);
    if (cameraState.streaming) startArucoPoll();
  } else {
    // pas la peine de poller en arrière-plan
    stopArucoPoll();
  }
}

// ── Canvas Arena ───────────────────────────────────────────────────────────
const ARENA_W = 3.0;
const ARENA_H = 2.0;

function drawArena() {
  const canvas = document.getElementById('arena-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  if (W === 0 || H === 0) return;

  // Fond
  ctx.fillStyle = '#09091a';
  ctx.fillRect(0, 0, W, H);

  const scale = Math.min(W / ARENA_W, H / ARENA_H) * 0.92;
  const ox = (W - ARENA_W * scale) / 2;
  const oy = (H - ARENA_H * scale) / 2;

  // Image de fond si disponible
  if (_arenaImgLoaded && _arenaImg) {
    ctx.drawImage(_arenaImg, ox, oy, ARENA_W * scale, ARENA_H * scale);
  } else {
    // Grille 0.5 m
    ctx.strokeStyle = '#161630';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= ARENA_W; gx += 0.5) {
      ctx.beginPath();
      ctx.moveTo(ox + gx * scale, oy);
      ctx.lineTo(ox + gx * scale, oy + ARENA_H * scale);
      ctx.stroke();
    }
    for (let gy = 0; gy <= ARENA_H; gy += 0.5) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + gy * scale);
      ctx.lineTo(ox + ARENA_W * scale, oy + gy * scale);
      ctx.stroke();
    }
    // Bordure arène
    ctx.strokeStyle = '#ff4455';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, ARENA_W * scale, ARENA_H * scale);
    // Labels axes
    ctx.fillStyle = '#363660';
    ctx.font = '10px Consolas';
    ctx.textAlign = 'center';
    for (let gx = 0; gx <= ARENA_W; gx += 0.5) {
      ctx.fillText(gx.toFixed(1), ox + gx * scale, oy + ARENA_H * scale + 13);
    }
    ctx.textAlign = 'right';
    for (let gy = 0; gy <= ARENA_H; gy += 0.5) {
      ctx.fillText(gy.toFixed(1), ox - 4, oy + (ARENA_H - gy) * scale + 4);
    }
    ctx.textAlign = 'left';
  }

  // Waypoints de la stratégie chargée
  const wps = window.strategyWaypoints || [];
  const wCol = window.strategyTeamColor || '#4488ff';
  wps.forEach((wp, i) => {
    if (wp.x == null || wp.y == null) return;
    const px = ox + wp.x * scale;
    const py = oy + (ARENA_H - wp.y) * scale;
    ctx.fillStyle = wCol;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, px, py + 3);
    ctx.textAlign = 'left';
  });

  // Trajectoire réelle
  if (state.trajectory.length > 1) {
    ctx.strokeStyle = 'rgba(68,136,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.trajectory.forEach((pt, i) => {
      const px = ox + pt[0] * scale;
      const py = oy + (ARENA_H - pt[1]) * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  // Robot (triangle vert)
  const rx  = ox + state.odom.x * scale;
  const ry  = oy + (ARENA_H - state.odom.y) * scale;
  const rth = -state.odom.theta;
  const rs  = Math.max(10, scale * 0.07);
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(rth);
  ctx.fillStyle   = '#33cc77';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(rs * 1.2, 0);
  ctx.lineTo(-rs * 0.7, rs * 0.6);
  ctx.lineTo(-rs * 0.3, 0);
  ctx.lineTo(-rs * 0.7, -rs * 0.6);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function resizeCanvas() {
  const canvas = document.getElementById('arena-canvas');
  if (!canvas) return;
  const page = document.getElementById('page-navigation');
  if (!page) return;
  canvas.width  = page.clientWidth;
  canvas.height = page.clientHeight;
  drawArena();
}

window.addEventListener('resize', () => {
  const navPage = document.getElementById('page-navigation');
  if (navPage && navPage.classList.contains('active')) resizeCanvas();
});

// ── Navigation ─────────────────────────────────────────────────────────────
function clearTrajectory() {
  api('/api/nav/trajectory/clear', {});
  state.trajectory = [];
  drawArena();
}

// ── Relais ─────────────────────────────────────────────────────────────────
async function toggleRelay(name) {
  const current = state.power[`relay_${name}`];
  const next = !current;
  const res = await api(`/api/relay/${name}`, { state: next });
}

// ── Stratégie mission ──────────────────────────────────────────────────────
async function loadStrategyList() {
  try {
    const list = await fetch('/api/strategy/list').then(r => r.json());
    const el   = document.getElementById('strategy-list');
    if (!el) return;
    if (!list || list.length === 0) {
      el.innerHTML = '<div style="padding:10px;color:var(--text-dim);font-size:11px">Aucun fichier strategy_*.json dans /config</div>';
      return;
    }
    el.innerHTML = list.map((s, i) =>
      `<div class="strat-item${i === 0 ? ' selected' : ''}" onclick="selectStrategy('${s.file}', this)">
        <div>
          <div class="strat-name">${s.name}</div>
          <div class="strat-file">${s.file}</div>
        </div>
      </div>`
    ).join('');
    if (list.length > 0 && !selectedStrategy) {
      selectedStrategy = list[0].file;
      selectStrategy(list[0].file, el.querySelector('.strat-item'));
    }
  } catch {}
}

async function selectStrategy(filename, el) {
  selectedStrategy = filename;
  document.querySelectorAll('.strat-item').forEach(e => e.classList.remove('selected'));
  if (el) el.classList.add('selected');
  try {
    const data = await fetch(`/api/strategy/detail?file=${encodeURIComponent(filename)}`).then(r => r.json());
    renderStrategyDetail(data);
  } catch {
    renderStrategyDetail({});
  }
}

function renderStrategyDetail(data) {
  const emptyEl   = document.getElementById('strat-detail-empty');
  const contentEl = document.getElementById('strat-detail-content');
  const nameEl    = document.getElementById('strat-detail-name');
  const teamBadge = document.getElementById('strat-team-badge');
  const wpListEl  = document.getElementById('strat-waypoints-list');

  if (!data || Object.keys(data).length === 0) {
    if (emptyEl)   emptyEl.style.display = '';
    if (contentEl) contentEl.style.display = 'none';
    if (teamBadge) teamBadge.style.display = 'none';
    return;
  }

  if (emptyEl)   emptyEl.style.display = 'none';
  if (contentEl) contentEl.style.display = 'flex';

  if (nameEl) nameEl.textContent = data.name || '—';

  const team = (data.team || '').toLowerCase();
  if (teamBadge) {
    teamBadge.style.display = '';
    if (team === 'blue' || team === 'bleu') {
      teamBadge.textContent = 'BLEU';
      teamBadge.style.background = 'rgba(68,136,255,0.2)';
      teamBadge.style.color = '#4488ff';
      teamBadge.style.borderColor = '#4488ff';
      window.strategyTeamColor = '#4488ff';
    } else if (team === 'yellow' || team === 'jaune') {
      teamBadge.textContent = 'JAUNE';
      teamBadge.style.background = 'rgba(255,170,0,0.2)';
      teamBadge.style.color = '#ffaa00';
      teamBadge.style.borderColor = '#ffaa00';
      window.strategyTeamColor = '#ffaa00';
    } else {
      teamBadge.style.display = 'none';
      window.strategyTeamColor = '#4488ff';
    }
  }

  const waypoints = data.waypoints || data.actions || [];
  window.strategyWaypoints = waypoints.filter(w => w.x != null && w.y != null);

  if (wpListEl) {
    wpListEl.innerHTML = waypoints.map((wp, i) => {
      const coord = wp.x != null ? `x=${wp.x.toFixed(2)} y=${wp.y != null ? wp.y.toFixed(2) : '?'}` : '';
      const thetaDeg = wp.theta != null ? (wp.theta * 180 / Math.PI).toFixed(1) : null;
      const theta = thetaDeg != null ? ` θ=${thetaDeg}°` : '';
      const action = wp.action ? `<span style="color:var(--orange);margin-left:4px">[${wp.action}]</span>` : '';
      return `<div class="wp-item">
        <span class="wp-num">${i + 1}</span>
        <span class="wp-data">${coord}${theta}${action ? '' : ''}</span>
        ${action}
      </div>`;
    }).join('');
  }

  drawArena();
}

function startMission() {
  if (!selectedStrategy) return;
  api('/api/strategy/start', { name: selectedStrategy });
}

function stopMission() {
  api('/api/strategy/stop', {});
}

// ── Calage mural ──────────────────────────────────────────────────────────
function calage(team) {
  api('/api/calage/' + team, {});
}

// ── Tests moteur (nouvelle API) ───────────────────────────────────────────
async function motorStop() {
  await api('/api/nav/cancel', {});
}

async function motorPushWall(pwm = 40, duration = 1.0) {
  await api('/api/motor/command', { cmd: `push_wall ${pwm} ${duration}` });
}

async function motorSetPose(x, y, thetaDeg) {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  await api('/api/motor/command', { cmd: `set_pose ${x} ${y} ${thetaRad}` });
}

async function motorForward(distM = 0.5, vLin = 0.2) {
  const { x, y, theta } = state.odom;
  const x2 = x + distM * Math.cos(theta);
  const y2 = y + distM * Math.sin(theta);
  await api('/api/motor/command', { cmd: `wp_add ${x2.toFixed(4)} ${y2.toFixed(4)} ${theta.toFixed(4)} ${vLin}` });
}

async function motorRotate(deg = 90, vLin = 0.15) {
  const { x, y, theta } = state.odom;
  const th2 = theta + (deg * Math.PI) / 180;
  await api('/api/motor/command', { cmd: `wp_add ${x.toFixed(4)} ${y.toFixed(4)} ${th2.toFixed(4)} ${vLin}` });
}

// ── Coefficients moteur ───────────────────────────────────────────────────
async function openCoeffPopup() {
  await loadCoefficients();
  const modal = document.getElementById('coeff-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeCoeffPopup() {
  const modal = document.getElementById('coeff-modal');
  if (modal) modal.classList.add('hidden');
}

const COEFF_FIELDS = [
  ['vel_kp', 25.0], ['vel_ki', 8.0], ['vel_i_limit', 5.0],
  ['max_wheel_speed_mps', 0.80],
  ['hold_zero_kp_x', 2.2], ['hold_zero_kp_y', 6.0], ['hold_zero_kp_theta', 3.5],
  ['hold_zero_max_linear_mps', 0.35], ['hold_zero_max_angular_radps', 3.5],
  ['hold_zero_pos_tol_m', 0.01], ['hold_zero_theta_tol_rad', 0.03],
  ['goto_phase1_angle_thresh_rad', 0.100], ['goto_phase2_dist_thresh_m', 0.050],
  ['goto_arrived_dist_m', 0.020], ['goto_arrived_angle_rad', 0.050],
  ['goto_phase1_rot_kp', 0.8], ['goto_phase2_linear_kp', 0.5],
  ['goto_phase2_angular_kp', 1.5], ['goto_max_linear_mps', 0.40],
  ['goto_max_angular_half', 0.20],
  ['max_deceleration_mps2', 0.30],
];

async function loadCoefficients() {
  try {
    const data = await fetch('/api/motor/coefficients').then(r => r.json());
    for (const [key, def] of COEFF_FIELDS) {
      const el = document.getElementById('coeff-' + key);
      if (el) el.value = data[key] ?? def;
    }
  } catch {}
}

async function saveCoefficients() {
  const body = {};
  for (const [key, def] of COEFF_FIELDS) {
    const el = document.getElementById('coeff-' + key);
    body[key] = el ? (parseFloat(el.value) || def) : def;
  }
  await api('/api/motor/coefficients', body);
  closeCoeffPopup();
}

function resetCoeffDefaults() {
  for (const [key, def] of COEFF_FIELDS) {
    const el = document.getElementById('coeff-' + key);
    if (el) el.value = def;
  }
}

// ── Bras presets ───────────────────────────────────────────────────────────
function armPreset(name) {
  api('/api/arm/preset', { name });
}

// ── Contrôle servos ────────────────────────────────────────────────────────
const SERVO_DEFS = [
  { channel: 0, label: 'Thermomètre', min: 0,  max: 100 },
  { channel: 1, label: 'Bras droit',  min: 20, max: 140 },
  { channel: 2, label: 'Coulisseau',  min: 0,  max: 85  },
  { channel: 3, label: 'Bras gauche', min: 0,  max: 140 },
];

let _servoChannel  = 0;
let _servoAngles   = {};   // {channel: last_angle}
let _servoDebounce = null;

function openServoPopup() {
  const tabs = document.getElementById('servo-tabs');
  if (tabs && !tabs.children.length) {
    SERVO_DEFS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'servo-tab';
      btn.textContent = s.label;
      btn.id = 'servo-tab-' + s.channel;
      btn.onclick = () => selectServo(s.channel);
      tabs.appendChild(btn);
    });
  }
  selectServo(_servoChannel);
  document.getElementById('servo-modal').classList.remove('hidden');
}

function closeServoPopup() {
  document.getElementById('servo-modal').classList.add('hidden');
}

function selectServo(channel) {
  _servoChannel = channel;
  const def = SERVO_DEFS.find(s => s.channel === channel);
  if (!def) return;

  SERVO_DEFS.forEach(s => {
    const tab = document.getElementById('servo-tab-' + s.channel);
    if (tab) tab.classList.toggle('active', s.channel === channel);
  });

  const angle = _servoAngles[channel] ?? Math.round((def.min + def.max) / 2);
  const slider = document.getElementById('servo-slider');
  const manual = document.getElementById('servo-manual-input');
  if (slider) { slider.min = def.min; slider.max = def.max; slider.value = angle; }
  if (manual) { manual.min = def.min; manual.max = def.max; manual.value = angle; }
  setText('servo-angle-val', angle + '°');
  setText('servo-min-lbl', def.min + '°');
  setText('servo-max-lbl', def.max + '°');
}

function onServoSlider(val) {
  const angle = parseInt(val);
  _servoAngles[_servoChannel] = angle;
  setText('servo-angle-val', angle + '°');
  const manual = document.getElementById('servo-manual-input');
  if (manual) manual.value = angle;
  clearTimeout(_servoDebounce);
  _servoDebounce = setTimeout(() => api('/api/arm/servo_single', { channel: _servoChannel, angle }), 50);
}

function onServoManualInput(val) {
  const def = SERVO_DEFS.find(s => s.channel === _servoChannel);
  if (!def) return;
  const angle = Math.max(def.min, Math.min(def.max, parseInt(val) || 0));
  _servoAngles[_servoChannel] = angle;
  const slider = document.getElementById('servo-slider');
  if (slider) slider.value = angle;
  setText('servo-angle-val', angle + '°');
  api('/api/arm/servo_single', { channel: _servoChannel, angle });
}

// ── Convoyeur & Ascenseur ──────────────────────────────────────────────────
function sendConveyor(dir) {
  api('/api/actuator/conveyor', { direction: dir });
}

function onElevator(val) {
  const pct = parseInt(val);
  setText('elev-val', pct + ' %');
  api('/api/actuator/elevator', { position: pct });
}

function setElevator(val) {
  const el = document.getElementById('elevator');
  if (el) { el.value = val; onElevator(val); }
}

// ── Log CAN ────────────────────────────────────────────────────────────────
function clearCanLog() {
  const box = document.getElementById('can-log-box');
  if (box) box.innerHTML = '';
  _lastCanLogLen = 0;
}

function updateCanLog(entries) {
  if (!entries || entries.length === 0) return;
  const box = document.getElementById('can-log-box');
  if (!box) return;

  // Ne traiter que les nouvelles entrées
  const newEntries = entries.slice(_lastCanLogLen);
  if (newEntries.length === 0) return;
  _lastCanLogLen = entries.length;

  newEntries.forEach(e => {
    const frame = document.createElement('div');
    frame.className = 'can-frame';
    const dirCls = e.dir === 'TX' ? 'can-tx' : 'can-rx';
    frame.innerHTML =
      `<span class="can-ts">[${e.ts}]</span>` +
      `<span class="${dirCls}">${e.dir}</span>` +
      `<span class="can-id">${e.id}</span>` +
      `<span class="can-cmd">${e.cmd}</span>` +
      `<span class="can-desc">${e.desc}</span>`;
    box.appendChild(frame);
  });

  // Limiter à 200 lignes affichées
  while (box.children.length > 200) box.removeChild(box.firstChild);

  // Auto-scroll
  box.scrollTop = box.scrollHeight;
}

// ── CAN Send UI ────────────────────────────────────────────────────────────
const CAN_COMMANDS = {
  nucleo_mot: {
    CMD_STOP: {
      fields: [],
      send: () => api('/api/motor/command', { cmd: 'stop' }),
    },
    CMD_WP_ADD: {
      fields: [
        { id: 'wa-x', label: 'X (m)', type: 'number', step: '0.01', default: '0' },
        { id: 'wa-y', label: 'Y (m)', type: 'number', step: '0.01', default: '0' },
        { id: 'wa-t', label: 'θ (deg)', type: 'number', step: '5', default: '0' },
        { id: 'wa-v', label: 'Vitesse lin (m/s)', type: 'number', step: '0.05', default: '0.20' },
      ],
      send: () => api('/api/motor/command', { cmd: `wp_add ${fv('wa-x')} ${fv('wa-y')} ${(fv('wa-t') * Math.PI / 180).toFixed(4)} ${fv('wa-v')}` }),
    },
    CMD_PUSH_WALL: {
      fields: [
        { id: 'pw-pwm', label: 'PWM (%)', type: 'number', min: '-100', max: '100', default: '40' },
        { id: 'pw-dur', label: 'Duree (s)', type: 'number', step: '0.1', default: '1.0' },
      ],
      send: () => api('/api/motor/command', { cmd: `push_wall ${fv('pw-pwm')} ${fv('pw-dur')}` }),
    },
    CMD_SET_POSE: {
      fields: [
        { id: 'sp-x', label: 'X (m)', type: 'number', step: '0.01', default: '0' },
        { id: 'sp-y', label: 'Y (m)', type: 'number', step: '0.01', default: '0' },
        { id: 'sp-t', label: 'θ (deg)', type: 'number', step: '5', default: '0' },
      ],
      send: () => api('/api/motor/command', { cmd: `set_pose ${fv('sp-x')} ${fv('sp-y')} ${(fv('sp-t') * Math.PI / 180).toFixed(4)}` }),
    },
  },
  nucleo_power: {
    RELAY_5V_ON:  { fields: [], send: () => api('/api/relay/5v',  { state: true }) },
    RELAY_5V_OFF: { fields: [], send: () => api('/api/relay/5v',  { state: false }) },
    RELAY_12V_ON: { fields: [], send: () => api('/api/relay/12v', { state: true }) },
    RELAY_12V_OFF:{ fields: [], send: () => api('/api/relay/12v', { state: false }) },
    RELAY_24V_ON: { fields: [], send: () => api('/api/relay/24v', { state: true }) },
    RELAY_24V_OFF:{ fields: [], send: () => api('/api/relay/24v', { state: false }) },
  },
  nucleo_arm: {
    CMD_SERVO: {
      fields: [
        { id: 'as-s1', label: 'S1 (°)', type: 'number', min: '0', max: '180', default: '90' },
        { id: 'as-s2', label: 'S2 (°)', type: 'number', min: '0', max: '180', default: '90' },
        { id: 'as-s3', label: 'S3 (°)', type: 'number', min: '0', max: '180', default: '90' },
      ],
      send: () => api('/api/arm/servo', { angles: [fv('as-s1'), fv('as-s2'), fv('as-s3')] }),
    },
    CMD_STEPPER: {
      fields: [
        { id: 'as-steps', label: 'Pas (+ avance, - recule)', type: 'number', step: '10', default: '0' },
      ],
      send: () => api('/api/arm/stepper', { steps: parseInt(document.getElementById('as-steps')?.value) || 0 }),
    },
  },
  nucleo_act: {
    CMD_CONVEYOR: {
      fields: [
        { id: 'ac-dir', label: 'Direction (-1 recul, 0 stop, 1 avance)', type: 'number', min: '-1', max: '1', default: '0' },
      ],
      send: () => api('/api/actuator/conveyor', { direction: parseInt(document.getElementById('ac-dir')?.value) || 0 }),
    },
    CMD_ELEVATOR: {
      fields: [
        { id: 'ac-pos', label: 'Position (0-100 %)', type: 'number', min: '0', max: '100', default: '0' },
      ],
      send: () => api('/api/actuator/elevator', { position: parseInt(document.getElementById('ac-pos')?.value) || 0 }),
    },
  },
};

function fv(id) {
  return parseFloat(document.getElementById(id)?.value) || 0;
}

function buildCanSendUI() {
  const board = document.getElementById('can-board')?.value || 'nucleo_mot';
  const cmdSel = document.getElementById('can-cmd');
  const paramsEl = document.getElementById('can-params');
  if (!cmdSel || !paramsEl) return;

  const cmds = CAN_COMMANDS[board] || {};
  const keys = Object.keys(cmds);
  cmdSel.innerHTML = keys.map(k => `<option value="${k}">${k}</option>`).join('');

  function renderFields() {
    const cmd = cmdSel.value;
    const def = cmds[cmd];
    if (!def) { paramsEl.innerHTML = ''; return; }
    paramsEl.innerHTML = def.fields.map(f =>
      `<div style="display:flex;flex-direction:column;gap:3px">
        <label style="font-size:11px;color:var(--text-dim)">${f.label}</label>
        <input id="${f.id}" type="${f.type}"
          ${f.step ? `step="${f.step}"` : ''}
          ${f.min  ? `min="${f.min}"` : ''}
          ${f.max  ? `max="${f.max}"` : ''}
          value="${f.default || '0'}">
      </div>`
    ).join('');
  }

  cmdSel.onchange = renderFields;
  renderFields();
}

async function sendCanCommand() {
  const board = document.getElementById('can-board')?.value || 'nucleo_mot';
  const cmd   = document.getElementById('can-cmd')?.value;
  const def = CAN_COMMANDS[board]?.[cmd];
  if (def && def.send) {
    await def.send();
  }
}

// ── API helper ─────────────────────────────────────────────────────────────
async function api(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ── Mode Match ─────────────────────────────────────────────────────────────
const MATCH_DURATION_S = 100;

const matchState = {
  active:            false,
  phase:             'ready',      // 'ready' | 'running'
  startTime:         null,
  stratName:         '',
  trajStartIdx:      0,
  timerInterval:     null,
  tiretteWaitPhase:  'waitInsert', // 'waitInsert' | 'waitRemove' | 'started'
  logoMode:          false,        // true = afficher le logo au lieu de la map
  logoTimeout:       null,
};

function enterMatchMode() {
  if (!selectedStrategy) {
    alert('Sélectionnez d\'abord une stratégie dans la liste.');
    return;
  }
  matchState.active       = true;
  matchState.phase        = 'ready';
  matchState.stratName    = document.getElementById('strat-detail-name')?.textContent || selectedStrategy;
  // Initialiser la phase tirette : si elle est déjà en place → attendre le retrait
  const tirNow = state.tirette?.inserted;
  matchState.tiretteWaitPhase = (tirNow === true) ? 'waitRemove' : 'waitInsert';

  setText('match-strat-name', matchState.stratName);
  setText('mr-strat-name',    matchState.stratName);

  // Copier le badge équipe
  const src = document.getElementById('strat-team-badge');
  ['match-team-badge', 'mr-team-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (src && src.style.display !== 'none') {
      el.textContent = src.textContent;
      el.style.cssText = src.style.cssText;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });

  document.getElementById('match-overlay')?.classList.remove('hidden');
  document.getElementById('match-phase-ready')?.classList.remove('hidden');
  document.getElementById('match-phase-running')?.classList.add('hidden');
  updateMatchReadyUI();
}

function exitMatchMode() {
  if (matchState.timerInterval) {
    clearInterval(matchState.timerInterval);
    matchState.timerInterval = null;
  }
  if (matchState.logoTimeout) {
    clearTimeout(matchState.logoTimeout);
    matchState.logoTimeout = null;
  }
  matchState.active    = false;
  matchState.phase     = 'ready';
  matchState.logoMode  = false;
  document.getElementById('match-logo')?.classList.add('hidden');
  document.getElementById('match-arena-canvas')?.classList.remove('hidden');
  document.getElementById('match-overlay')?.classList.add('hidden');
}

function onMatchStart() {
  matchState.phase        = 'running';
  matchState.startTime    = Date.now();
  matchState.trajStartIdx = state.trajectory.length;

  api('/api/strategy/start', { name: selectedStrategy });

  document.getElementById('match-phase-ready')?.classList.add('hidden');
  document.getElementById('match-phase-running')?.classList.remove('hidden');

  setTimeout(resizeMatchCanvas, 30);

  matchState.logoMode   = false;
  matchState.logoTimeout = setTimeout(() => { matchState.logoMode = true; }, 10000);

  updateMatchTimer();
  matchState.timerInterval = setInterval(updateMatchTimer, 1000);
}

function updateMatchTimer() {
  const elapsed   = matchState.startTime ? (Date.now() - matchState.startTime) / 1000 : 0;
  const remaining = Math.max(0, MATCH_DURATION_S - elapsed);
  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  const timerEl = document.getElementById('match-timer');
  if (timerEl) {
    timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    timerEl.style.color = remaining <= 15 ? '#ff4455' : remaining <= 30 ? '#ffaa00' : '#33cc77';
  }
  if (remaining <= 0 && matchState.timerInterval) {
    clearInterval(matchState.timerInterval);
    matchState.timerInterval = null;
  }
}

function updateMatchReadyUI() {
  const s = state;
  const { x, y, theta } = s.odom;
  setText('mc-pose', `x:${x.toFixed(3)}  y:${y.toFixed(3)}  θ:${(theta * 180 / Math.PI).toFixed(1)}°`);

  const bauOk = !s.power.bau;
  _setMC('mc-bau', bauOk, bauOk ? 'OK' : 'ACTIF !');

  const tirette = s.tirette?.inserted ?? null;
  // Machine d'état : waitInsert → waitRemove → started
  if (matchState.tiretteWaitPhase === 'waitInsert') {
    if (tirette === true) {
      matchState.tiretteWaitPhase = 'waitRemove';
      _setMC('mc-tirette', true, 'EN PLACE ✓');
    } else if (tirette === false) {
      _setMCWarn('mc-tirette', 'INSÉRER !');
    } else {
      _setMCWarn('mc-tirette', '?');
    }
  } else if (matchState.tiretteWaitPhase === 'waitRemove') {
    if (tirette === false && matchState.phase === 'ready') {
      matchState.tiretteWaitPhase = 'started';
      onMatchStart();
      return;
    }
    // Tirette retirée physiquement avant d'entrer en phase match → retour waitInsert
    if (tirette === null) {
      _setMCWarn('mc-tirette', '?');
    } else {
      _setMC('mc-tirette', true, 'EN PLACE ✓');
    }
  }

  const lidarOk = s.perception === 'LIDAR_OK';
  _setMC('mc-lidar', lidarOk, lidarOk ? 'OK' : (s.perception || '?'));

  const r5 = s.power.relay_5v, r12 = s.power.relay_12v, r24 = s.power.relay_24v;
  const relayOk  = r5;
  const relayStr = `${r5?'5V✓':'5V✗'} ${r12?'12V✓':'12V✗'} ${r24?'24V✓':'24V✗'}`;
  _setMC('mc-relay', relayOk, relayStr);

  const boards = s.boards || {};
  _setMC('mc-mot',   boards.mot   ?? false, (boards.mot   ?? false) ? 'OK' : 'HORS LIGNE');
  _setMC('mc-power', boards.power ?? false, (boards.power ?? false) ? 'OK' : 'HORS LIGNE');

  const tirOk  = matchState.tiretteWaitPhase === 'waitRemove';
  const allOk  = bauOk && tirOk && relayOk;
  const banner = document.getElementById('match-waiting-banner');
  if (banner) banner.className = 'match-waiting-banner ' + (allOk ? 'mwb-ok' : 'mwb-warn');
  setText('match-waiting-text', allOk ? '✓ PRÊT — EN ATTENTE DU DÉPART' : '⚠ VÉRIFICATIONS INCOMPLÈTES');
  setText('match-waiting-sub',  allOk
    ? 'Tirez la tirette pour démarrer le match'
    : 'Certaines vérifications ont échoué — tirez la tirette ou démarrez manuellement');

  const forceBtn = document.getElementById('match-force-btn');
  if (forceBtn) forceBtn.classList.toggle('hidden', allOk);
}

function _setMC(id, ok, text) {
  const card = document.getElementById(id);
  const val  = document.getElementById(id + '-val');
  if (card) card.className = 'match-status-card ' + (ok ? 'mc-ok' : 'mc-err');
  if (val)  val.textContent = text;
}

function _setMCWarn(id, text) {
  const card = document.getElementById(id);
  const val  = document.getElementById(id + '-val');
  if (card) card.className = 'match-status-card mc-warn';
  if (val)  val.textContent = text;
}

// ── Arena canvas Mode Match ─────────────────────────────────────────────────
function drawMatchArena() {
  const canvas = document.getElementById('match-arena-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  if (W === 0 || H === 0) return;

  ctx.fillStyle = '#09091a';
  ctx.fillRect(0, 0, W, H);

  const scale = Math.min(W / ARENA_W, H / ARENA_H) * 0.95;
  const ox = (W - ARENA_W * scale) / 2;
  const oy = (H - ARENA_H * scale) / 2;

  if (_arenaImgLoaded && _arenaImg) {
    ctx.drawImage(_arenaImg, ox, oy, ARENA_W * scale, ARENA_H * scale);
  } else {
    ctx.strokeStyle = '#161630';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= ARENA_W; gx += 0.5) {
      ctx.beginPath(); ctx.moveTo(ox + gx * scale, oy); ctx.lineTo(ox + gx * scale, oy + ARENA_H * scale); ctx.stroke();
    }
    for (let gy = 0; gy <= ARENA_H; gy += 0.5) {
      ctx.beginPath(); ctx.moveTo(ox, oy + gy * scale); ctx.lineTo(ox + ARENA_W * scale, oy + gy * scale); ctx.stroke();
    }
    ctx.strokeStyle = '#ff4455'; ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, ARENA_W * scale, ARENA_H * scale);
  }

  // Trajectoire depuis le départ du match uniquement
  const traj = state.trajectory.slice(matchState.trajStartIdx);
  if (traj.length > 1) {
    ctx.strokeStyle = 'rgba(80,220,160,0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    traj.forEach((pt, i) => {
      const px = ox + pt[0] * scale;
      const py = oy + (ARENA_H - pt[1]) * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  // Obstacles lidar (points en coordonnées monde)
  const obstacles = state.obstacles || [];
  if (obstacles.length > 0) {
    ctx.fillStyle   = 'rgba(255,60,60,0.55)';
    ctx.strokeStyle = '#ff3c3c';
    ctx.lineWidth   = 1.5;
    obstacles.forEach(obs => {
      if (obs.length < 2) return;
      const px = ox + obs[0] * scale;
      const py = oy + (ARENA_H - obs[1]) * scale;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  }

  // Robot (triangle vert)
  const rx  = ox + state.odom.x * scale;
  const ry  = oy + (ARENA_H - state.odom.y) * scale;
  const rth = -state.odom.theta;
  const rs  = Math.max(12, scale * 0.08);
  ctx.save();
  ctx.translate(rx, ry); ctx.rotate(rth);
  ctx.fillStyle = '#33cc77'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rs * 1.2, 0); ctx.lineTo(-rs * 0.7, rs * 0.6);
  ctx.lineTo(-rs * 0.3, 0); ctx.lineTo(-rs * 0.7, -rs * 0.6);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function resizeMatchCanvas() {
  const canvas = document.getElementById('match-arena-canvas');
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  || window.innerWidth;
  canvas.height = canvas.offsetHeight || (window.innerHeight - 50);
  drawMatchArena();
}

window.addEventListener('resize', () => {
  if (matchState.active && matchState.phase === 'running') resizeMatchCanvas();
});

// ── Démarrage direct (sans tirette, pour tests) ─────────────────────────────
function matchManualStart() {
  if (matchState.active && matchState.phase === 'ready') onMatchStart();
}

// ── Caméra + ArUco ─────────────────────────────────────────────────────────
const cameraState = {
  streaming: false,
  overlayOn: true,
  pollTimer: null,
  imgW: 0, imgH: 0,
  lastTags: [],
};

function toggleCameraStream() {
  const img = document.getElementById('camera-stream');
  const empty = document.getElementById('camera-empty');
  const lbl = document.getElementById('cam-toggle-lbl');
  if (!img) return;

  if (cameraState.streaming) {
    img.src = '';
    img.style.display = 'none';
    if (empty) empty.style.display = '';
    cameraState.streaming = false;
    lbl.textContent = '▶ Activer le flux';
    stopArucoPoll();
  } else {
    // Cache-buster pour relancer le multipart
    img.src = '/api/camera/stream?t=' + Date.now();
    img.style.display = '';
    if (empty) empty.style.display = 'none';
    cameraState.streaming = true;
    lbl.textContent = '■ Arrêter le flux';
    img.onload = () => {
      cameraState.imgW = img.naturalWidth || img.clientWidth;
      cameraState.imgH = img.naturalHeight || img.clientHeight;
    };
    startArucoPoll();
  }
}

function toggleArOverlay() {
  cameraState.overlayOn = !cameraState.overlayOn;
  const lbl = document.getElementById('cam-overlay-lbl');
  if (lbl) lbl.textContent = cameraState.overlayOn
    ? '◉ Overlay AR : ON' : '◯ Overlay AR : OFF';
  drawArucoOverlay();
}

function startArucoPoll() {
  if (cameraState.pollTimer) return;
  const tick = async () => {
    try {
      const data = await fetch('/api/aruco/tags').then(r => r.json());
      cameraState.lastTags = data.tags || [];
      renderArucoList(cameraState.lastTags);
      drawArucoOverlay();
      const fpsEl = document.getElementById('cam-fps');
      const cam = state.camera || {};
      if (fpsEl) fpsEl.textContent = (cam.fps ?? 0).toFixed(1) + ' fps';
    } catch {}
  };
  tick();
  cameraState.pollTimer = setInterval(tick, 200);
}

function stopArucoPoll() {
  if (cameraState.pollTimer) {
    clearInterval(cameraState.pollTimer);
    cameraState.pollTimer = null;
  }
}

function renderArucoList(tags) {
  const el = document.getElementById('aruco-list');
  const count = document.getElementById('aruco-count');
  if (count) count.textContent = tags.length;
  if (!el) return;
  if (!tags || tags.length === 0) {
    el.innerHTML = '<div style="padding:12px;color:var(--text-dim);font-size:11px">Aucun tag détecté</div>';
    return;
  }
  el.innerHTML = tags.map((t, i) => {
    const dist = t.distance != null ? (t.distance * 100).toFixed(0) + ' cm'
                                    : t.size.toFixed(0) + ' px (≈)';
    const colors = ['#33cc77', '#88cc33', '#ccaa33', '#cc7733', '#cc4444'];
    const col = colors[Math.min(i, colors.length - 1)];
    return `<div class="strat-item" style="border-left:3px solid ${col}">
      <div>
        <div class="strat-name">#${i + 1} — ID ${t.id}</div>
        <div class="strat-file mono">${dist}</div>
      </div>
    </div>`;
  }).join('');
}

function drawArucoOverlay() {
  const canvas = document.getElementById('camera-overlay');
  const img = document.getElementById('camera-stream');
  if (!canvas || !img) return;
  // Synchronise les dim du canvas avec l'image affichée (en pixels écran)
  const rect = img.getBoundingClientRect();
  canvas.width = Math.max(1, rect.width);
  canvas.height = Math.max(1, rect.height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!cameraState.overlayOn) return;

  const tags = cameraState.lastTags || [];
  if (!tags.length || !img.naturalWidth) return;
  // Conversion coords image natives → coords écran
  const sx = canvas.width / img.naturalWidth;
  const sy = canvas.height / img.naturalHeight;

  // Réticule centre image (assistance visée)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // Liaisons centre → tags pour mettre en valeur le plus proche
  tags.forEach((t, i) => {
    const cx = (t.center[0] || 0) * sx;
    const cy = (t.center[1] || 0) * sy;
    const isClosest = (i === 0);
    ctx.strokeStyle = isClosest ? '#33cc77' : 'rgba(120,180,255,0.55)';
    ctx.lineWidth = isClosest ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    // Cible
    ctx.beginPath();
    ctx.arc(cx, cy, isClosest ? 14 : 9, 0, Math.PI * 2);
    ctx.strokeStyle = isClosest ? '#33cc77' : '#88c0ff';
    ctx.lineWidth = isClosest ? 3 : 2;
    ctx.stroke();

    // Étiquette rang + ID
    ctx.fillStyle = isClosest ? 'rgba(51,204,119,0.85)' : 'rgba(40,40,60,0.85)';
    const txt = `#${i + 1}  ID${t.id}`;
    ctx.font = isClosest ? 'bold 13px Consolas' : '12px Consolas';
    const w = ctx.measureText(txt).width + 10;
    ctx.fillRect(cx + 18, cy - 9, w, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, cx + 23, cy + 4);
  });
}

window.addEventListener('resize', () => {
  const camPage = document.getElementById('page-camera');
  if (camPage && camPage.classList.contains('active')) drawArucoOverlay();
});

// ── Init ───────────────────────────────────────────────────────────────────
connectWS();
loadStrategyList();
setInterval(loadStrategyList, 15000);
buildCanSendUI();

requestAnimationFrame(() => {
  const navPage = document.getElementById('page-navigation');
  if (navPage && navPage.classList.contains('active')) resizeCanvas();
});
