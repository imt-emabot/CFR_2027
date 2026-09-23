# Logiciel — robot principal

Espace de travail ROS 2 (workspace colcon) du robot principal.

Environnement courant : Ubuntu 26.04 arm64, ROS 2 Lyrical Luth. La cible matérielle reste
le Raspberry Pi 5 ; le CDC logiciel conserve encore Jazzy comme choix proposé à confirmer.

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

## Construction

Depuis ce dossier, après avoir installé et sourcé ROS 2 Jazzy :

```bash
source /opt/ros/lyrical/setup.bash
colcon build --symlink-install
source install/setup.bash
```

Les artefacts `build/`, `install/` et `log/` sont locaux au workspace et ne sont pas
versionnés. Le premier bring-up se fera avec les nœuds squelettes ; Nav2, les pilotes et
les interfaces métier seront ajoutés dans leurs packages respectifs quand leurs contrats
seront figés.
