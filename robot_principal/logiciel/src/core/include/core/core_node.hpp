#ifndef CORE__CORE_NODE_HPP_
#define CORE__CORE_NODE_HPP_

#include <rclcpp/rclcpp.hpp>

namespace core
{

class CoreNode : public rclcpp::Node
{
public:
  explicit CoreNode(const rclcpp::NodeOptions & options = rclcpp::NodeOptions());
};

}  // namespace core

#endif  // CORE__CORE_NODE_HPP_