# Packages ROS 2

Les packages du workspace colcon vivent sous `src/`. Les README des dossiers voisins
documentent le rôle et les décisions de conception de chaque processus ; ils ne sont pas
recopiés dans les packages.

Packages prévus par le CDC logiciel :

- `core` : noyau de match C++ composable, sans redémarrage en match.
- `strategy` : moteur de stratégie, avec repli pendant un redémarrage.
- `nav` : navigation et planification.
- `perception` : caméra et passerelle applicative vers le mât.
- `tooling` : enregistrement, télémétrie et visualisation.

Le simulateur reste hors du périmètre embarqué et sera ajouté séparément sous
`robot_principal/logiciel/simulateur/`.