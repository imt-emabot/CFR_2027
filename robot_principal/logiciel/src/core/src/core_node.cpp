#include "core/core_node.hpp"

#include <rclcpp_components/register_node_macro.hpp>

namespace core
{

CoreNode::CoreNode(const rclcpp::NodeOptions & options)
: Node("core", options)
{
  RCLCPP_INFO(get_logger(), "Core node started");
}

}  // namespace core

RCLCPP_COMPONENTS_REGISTER_NODE(core::CoreNode)