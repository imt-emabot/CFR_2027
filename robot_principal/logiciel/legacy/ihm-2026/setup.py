from glob import glob
from setuptools import setup

package_name = 'robot_ihm'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/static', glob('static/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='emabot',
    maintainer_email='emabot@example.com',
    description='IHM Web du robot coupe.',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'robot_ihm_node = robot_ihm.robot_ihm_node:main',
        ],
    },
)
