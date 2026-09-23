import rclpy
from rclpy.node import Node


class StrategyNode(Node):
    def __init__(self):
        super().__init__('strategy')


def main(args=None):
    rclpy.init(args=args)
    node = StrategyNode()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()