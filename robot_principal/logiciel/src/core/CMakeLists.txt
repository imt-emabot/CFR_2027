cmake_minimum_required(VERSION 3.10)
project(core)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_components REQUIRED)

add_library(core_component SHARED src/core_node.cpp)
target_compile_features(core_component PUBLIC cxx_std_17)
target_include_directories(core_component PUBLIC include)
target_link_libraries(core_component
  rclcpp::rclcpp
  rclcpp_components::component
)

rclcpp_components_register_nodes(core_component "core::CoreNode")

install(TARGETS core_component
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

ament_export_dependencies(rclcpp rclcpp_components)
ament_package()