import rclpy
from rclpy.node import Node


class NavNode(Node):
    def __init__(self):
        super().__init__('nav')


def main(args=None):
    rclpy.init(args=args)
    node = NavNode()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()