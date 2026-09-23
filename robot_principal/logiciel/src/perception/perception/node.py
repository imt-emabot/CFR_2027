import rclpy
from rclpy.node import Node


class PerceptionNode(Node):
    def __init__(self):
        super().__init__('perception')


def main(args=None):
    rclpy.init(args=args)
    node = PerceptionNode()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()