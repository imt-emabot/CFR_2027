import rclpy
from rclpy.node import Node


class ToolingNode(Node):
    def __init__(self):
        super().__init__('tooling')


def main(args=None):
    rclpy.init(args=args)
    node = ToolingNode()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()