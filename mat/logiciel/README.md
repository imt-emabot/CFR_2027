# Logiciel — mât

Raspberry Pi 5. N'est jamais un participant DDS et n'écrit jamais sur le bus CAN (CDC
mât, section 6.4) : ce n'est pas un espace de travail ROS 2, mais deux processus
indépendants (section 9.1) :

| Processus | Priorité |
|---|---|
| `pami-server` | Vitale |
| `vision` | Secondaire, peut mourir |

Un plantage de `vision` ne doit jamais faire tomber `pami-server` (section 6.3).
