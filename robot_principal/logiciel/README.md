# Logiciel — robot principal

Espace de travail ROS 2 (workspace colcon) du robot principal.

Environnement cible (CDC logiciel, section 12) : Raspberry Pi 5, Ubuntu Server 24.04 LTS
arm64, ROS 2 Jazzy Jalisco.

Découpage en processus (CDC logiciel, section 4.4), chacun un paquet :

| Paquet | Redémarrage en match |
|---|---|
| `core` | Jamais |
| `strategy` | Autorisé, repli sur séquence forcée pendant l'absence |
| `nav` | Autorisé |
| `perception` | Autorisé |
| `tooling` | Tué au coup de tirette |

`simulateur` n'est pas un processus embarqué : c'est le pont hors match entre
l'enregistrement et un simulateur (section 19).

`core` est en C++ : rclpy ne supporte pas les composants C++, et un processus n'a qu'un
seul langage (CDC logiciel, section 4.3). Le langage des autres paquets n'est pas encore
tranché.

Le détail de chaque paquet est dans son propre `README.md`.
