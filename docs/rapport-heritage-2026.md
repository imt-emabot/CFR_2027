---
title: "Héritage logiciel 2026 — comparaison et état de reprise"
subtitle: "Coupe de France de Robotique 2027 — pièce d'entrée de la section 15 du CDC logiciel"
date: "19 septembre 2026"
lang: fr
---

# Objet

Ce document remplit la grille de comparaison appelée par la section 15 du cahier des
charges logiciel, et en tire l'état de ce qui reste, de ce qui est à refaire et de la
manière de le refaire. Il n'est pas un cahier des charges : il n'introduit aucune exigence
et n'en modifie aucune. Les renvois se font par identifiant.

# 1. Ce qui a été lu, et ce qui ne l'a pas été

Source : la sauvegarde de la Raspberry Pi de l'édition 2026.

| Élément | Nature | Lu |
|---|---|---|
| `robot_tempo/` | Système hors-ROS qui a joué la compétition | Intégralement, code et interface |
| `robot/ros2_ws/src/` | Onze nœuds ROS 2 Jazzy, jamais utilisés en match | Structure, lanceur, pilote moteurs, nœud navigation |
| `robot/` | Image Docker, `docker-compose.yml`, configuration | Oui |
| `Documents/canwatch/` | Visualiseur de trames CAN en conteneur | Survolé |
| `camera_ros-in-docker-rpi5/` | Tentative de pilote caméra en conteneur | Survolé |
| `backups/` | Archives de conteneur du 27 avril 2026 | Non ouvertes, non nécessaires |
| `CFR_AsservissementMoteur/` | Firmware de la carte moteurs, Nucleo F303K8 sous mbed, 2 334 lignes de C++ | Intégralement |
| `Carte alimentation/CFR_Carte_Alimentation/` | Firmware de la carte alimentation, même cible, 463 lignes | Intégralement |

Restent hors d'atteinte : le firmware de la carte bras et de la carte actionneurs (seul
subsiste un binaire `.esp32.bin` sans source), les schémas électroniques, et tout
enregistrement de match. Ce dernier point n'est pas un oubli d'archivage : rien dans le
logiciel 2026 n'écrivait quoi que ce soit sur le disque. C'est la première conséquence
concrète de l'absence des exigences LOG-EXJ-01 à LOG-EXJ-07.

Une exception, et c'est la seule donnée mesurée que l'édition 2026 nous laisse :
`robot_tempo/logs/candump-2026-05-13_224314.log`, 106 585 trames horodatées couvrant
2 140 secondes, produites par `candump` et non par le programme. Dépouillé, ce relevé donne
49,8 trames par seconde en moyenne et 53 au maximum sur une fenêtre d'une seconde, réparties
en 85 143 trames d'odométrie et d'état venant de la carte moteurs, 21 396 trames du bouton
d'arrêt d'urgence, et seulement 46 trames descendantes. Rapporté aux 3 800 trames par
seconde de saturation retenues en 8.1 du CDC, le bus tournait à environ 1,3 % de sa
capacité. C'est une confirmation mesurée de LOG-EXP-04 en configuration 2026 ; ce n'est
pas une prévision pour 2027, où la file de waypoints à 5–10 Hz et le mât changent la
donne. Le relevé montre aussi un robot quasiment immobile sur ces trente-cinq minutes,
donc il ne dit rien des régimes de mouvement.

Une vingtaine de fichiers à la racine de la sauvegarde (`app.js`, `index.html`,
`nucleo_mot_driver_node.py`, `strategy_B.json`, `robot.urdf.xml`…) font zéro octet. Ce sont
des résidus de copie, pas du code perdu : les versions réelles existent sous `robot_tempo/`
et `robot/ros2_ws/src/`. Un seul fichier utile est vide,
`robot_tempo/strategies/strategy_jaunef.json`.

# 2. L'héritage n'est pas une base, c'en est deux

C'est le fait qui commande tout le reste, et la grille de la section 15 ne le dit pas encore.

La branche ROS 2 (`robot/ros2_ws`) compte 3 856 lignes de Python réparties en douze nœuds,
dont onze sont lancés par défaut, en autant de processus, par `robot_phase3.launch.py`
dans un conteneur Docker privilégié.
Elle n'a jamais joué un match. Elle contient par ailleurs des absences qu'il faut noter,
parce qu'elles changent la lecture de la grille : **Nav2 n'y est jamais instancié** — les
paquets sont installés dans l'image, aucun fichier de configuration, aucune carte, aucun
lancement ; et le nœud `robot_navigation` n'est pas un navigateur mais un exécuteur de
mission qui relaie des waypoints. De même, le pilote lidar, le filtre de scan et le nœud `obstacle_guard` sont commentés
dans le lanceur, sous un commentaire explicite : « NOEUDS COMMENTÉS POUR FIXER LE CRASH
LOOP ». La branche ROS a donc fini sa vie sans évitement du tout, et la boucle de
redémarrage y avait déjà été constatée et contournée par suppression, pas par correction.
Autrement dit, le robot 2026 n'a jamais eu de navigation au sens du CDC, ni dans la
branche qui a joué ni dans celle qui n'a pas joué.

La branche hors-ROS (`robot_tempo`) compte 3 506 lignes de Python et 4 454 lignes
d'interface web. C'est elle qui a joué. Elle tourne dans un processus unique multithread :
liaison CAN, garde-fou lidar, actionneurs, détecteur ArUco, tirette, exécuteur de stratégie
et serveur web partagent le même espace mémoire et le même sort.

Conséquence pour la section 4.3 du CDC, qui acte le regroupement de nœuds dans moins de
processus : le système qui a réellement joué était déjà à un processus. Le passage de
quinze processus à cinq n'est donc pas une réduction par rapport à ce qui a marché, c'est
une augmentation par rapport à lui et une réduction par rapport à ce qui a échoué. Cela ne
remet pas en cause le choix — la branche à un processus n'avait ni navigation, ni caméra
en ROS, ni outillage — mais cela le prive de l'argument « on est déjà passé par là ».

# 3. Ce que font réellement les deux cartes STM32

Les deux firmwares sont des projets PlatformIO visant la même cible, une Nucleo-32 F303K8
sous mbed, et partagent une bibliothèque `CanStm32` recopiée de l'un à l'autre. Ils
répondent à trois lignes de la grille que le premier examen laissait ouvertes, et ils en
contredisent une quatrième.

**Carte moteurs.** Boucle de commande à 100 Hz dans la boucle principale, télémétrie à
20 Hz, deux trames par période — ce qui donne les 39,8 trames par seconde relevées au
`candump`. L'asservissement est un profil trapézoïdal plus un PI de vitesse par roue, avec
correction de cap proportionnelle en ligne droite. Une file de seize points existe déjà
dans `Navigator`, mais chaque point est exécuté en trois phases successives : rotation vers
la cible, ligne droite, rotation finale. Le robot ne décrit donc aucune courbe, et il
s'arrête entre chaque phase.

**Codeurs.** Quatre `InterruptIn` mbed, sur front montant et descendant des voies A et B des
deux roues, avec décodage en quadrature logiciel. À 2 048 points par tour et 24,75 mm de
rayon, un point vaut 0,076 mm ; à 0,8 m/s cela fait de l'ordre de 21 000 interruptions par
seconde pour les deux roues. Le chiffre est calculé, pas mesuré. C'est la justification
directe du passage au comptage matériel sur timer acté au CDC : ce n'est pas une préférence
d'architecture, c'est une charge d'interruption qui croît avec la vitesse au moment précis
où la boucle a le plus besoin d'être régulière.

**Horodatage.** La trame `MSG_ODOM` transporte six octets, x, y et θ, et rien d'autre.
Aucun compteur, aucune date. Le mécanisme de LOG-EXP-03 est donc entièrement à construire,
des deux côtés du bus.

**Minuterie de fin de match, chien de garde, version, code de défaut.** Aucun des quatre
n'existe dans l'un ou l'autre firmware. Une recherche sur `watchdog`, `timeout` et leurs
variantes ne retourne rien. Si la Raspberry Pi se tait en plein mouvement, la carte moteurs
termine sa file puis reste en `HOLD` ; si elle se tait pendant une ligne droite, la ligne va
à son terme. Rien ne s'arrête à cent secondes, nulle part.

**Carte alimentation.** C'est la découverte qui corrige la grille initiale. L'appel
`sendPowerStatusFrame()` est en commentaire dans la boucle principale, et
`ENABLE_ANALOG_SENSING` vaut 0, si bien que la fonction retournerait zéro volt et zéro
ampère si elle était appelée. Le relevé `candump` le confirme sans ambiguïté : sur 106 585
trames, l'identifiant 0x020 n'apparaît pas une seule fois. **L'affichage de batterie de
l'IHM, porté au crédit de l'existant dans la grille d'origine, n'a jamais rien affiché
d'autre que zéro pendant la compétition.** Ce qui fonctionnait sur cette carte, et qui
fonctionnait bien, c'est autre chose : le bouton d'arrêt d'urgence, diffusé toutes les
100 ms — 21 396 trames relevées, soit exactement 10 Hz — avec envoi immédiat sur
changement d'état et verrouillage continu des relais tant qu'il est enfoncé.

**Coupure à l'arrêt d'urgence : conforme, vérifié sur la carte.** Le code coupe les trois
relais, 5 V compris, quand l'arrêt d'urgence est actif. La lecture seule du firmware
laissait craindre une contradiction avec LOG-EXS-08. Vérification faite sur le matériel :
les rails de commande 5 V ne passent pas par un relais et ne sont donc pas coupés, ce que
F.4.c tolère explicitement. L'exigence est tenue. Ce qui reste absent, c'est l'autre moitié
de LOG-EXS-07 : aucune détection de défaut électrique caractérisé n'existe, la seule cause
de coupure est l'appui sur le bouton.

**Ce que le relevé de bus dit de la base de temps.** Les périodes d'émission mesurées contre
l'horloge de la Pi : la trame d'odométrie sort toutes les 50,063 ms médianes pour 50 ms
nominales, celle du bouton d'arrêt d'urgence toutes les 100,046 ms pour 100 ms. Soit
+1 260 ppm et +460 ppm. Ces chiffres ne permettent pas de conclure sur le quartz : ils
mélangent trois effets — la source d'horloge, le dépassement de période propre au mécanisme
logiciel de chaque carte, qui n'est pas le même sur les deux, et la datation à la réception
côté Pi. Un quartz à 30 ppm et soixante microsecondes de dépassement par période donnent la
même lecture.

Ce qu'ils établissent en revanche : **les deux cartes ne sont déjà pas d'accord sur ce
qu'est une seconde, à environ 800 ppm près, vues depuis la Pi.** Sur cent secondes de match
cela fait quatre-vingts millisecondes d'écart entre elles, soit huit fois le budget que le
CDC juge acceptable en 7.3. La question n'est donc pas seulement « HSE ou HSI » : même avec
un quartz, l'estimation continue du décalage reste nécessaire.

# 4. La grille de la section 15, remplie

La colonne « Existant » décrit ce qui est vérifié dans le code lu, pas ce qui était prévu.

| Axe | Existant | Cible | Reprendre / Refaire |
|---|---|---|---|
| IHM tactile | Serveur FastAPI sur la Pi, page web servie en kiosque Chromium plein écran. Six onglets (Système, Navigation, Stratégie, Actionneurs, Caméra, CAN), un mode Match plein écran, un éditeur de stratégie. 4 454 lignes de front, 455 de serveur. L'affichage de batterie était alimenté par une trame que la carte alimentation n'émettait pas | Idem + onglets calibration et état système | Reprendre |
| Structure des processus | Un processus Python multithread pour ce qui a joué ; onze processus ROS en conteneur pour ce qui n'a pas joué | Trois couches, noyau composé en un processus C++ | Refaire, en conservant le découpage fonctionnel du processus unique |
| Protocole CAN | Maison. Six opcodes descendants, deux montants, quatre cartes. Décrit en quatre exemplaires divergents : `robot/config/can_protocol.py`, `robot_tempo/config.py`, l'énumération de `RosBridge.h` dans le firmware, et `WAYPOINT_NAVIGATION_PROTOCOL.md` | Maison + registre DBC + passerelle ROS | Reprendre la sémantique, refaire la source |
| Plan d'ID CAN | Identifiants fixes 0x010 à 0x042, un couple par carte, sans champ ni structure | Découpage en champs | Refaire |
| Interface carte moteurs | Une file de seize points existe côté firmware, mais la Pi n'en envoie qu'un à la fois et attend `STATUS_DONE`. Chaque point est exécuté en rotation, ligne droite, rotation : le robot s'arrête entre les phases et ne décrit aucune courbe. Ni numéro de séquence, ni remplacement, ni `PAUSE`/`RESUME` | File de waypoints remplaçable | Refaire la poursuite, garder la structure de file |
| Acquisition codeurs | A/B décodé en quadrature logicielle, par interruption sur les quatre fronts. De l'ordre de 21 000 interruptions par seconde à 0,8 m/s, calculé | A/B sur timer, module SPI | Refaire |
| Horodatage odométrie | Daté à la réception par la Pi. La trame `MSG_ODOM` transporte six octets, x, y et θ, et rien d'autre. Vérifié des deux côtés du bus | Compteur STM32 + estimation continue du décalage | Refaire |
| Minuterie de fin de match | Aucune, nulle part, et cette fois les deux firmwares le confirment. Le décompte des 100 s existe uniquement dans le navigateur (`app.js`), en affichage : à zéro il éteint son propre minuteur et n'envoie rien | Côté firmware, avec rangement préalable | Refaire |
| Recalage initial | Séquence de contact mural écrite puis mise en commentaire. Il ne subsiste qu'un `SET_POSE` à l'aveugle sur des coordonnées figées | Pendant les 3 min de préparation | Refaire ; la séquence commentée reste un point de départ utile |
| Mode d'exécution | Unique. Trois drapeaux de ligne de commande (`--no-lidar`, `--no-camera`, `--no-tirette`) | Essai et match officiel | Refaire |
| Navigation | Aucune. Suivi séquentiel d'une liste de waypoints, un à la fois | Nav2, planificateur seul | Refaire |
| Évitement | Arrêt et reprise sur cône lidar dépendant du mouvement, marge proportionnelle à la vitesse, hystérésis, filtrage par les bordures de table | Contournement, réflexe lidar en couche 1 | Reprendre la géométrie, refaire la décision |
| Localisation | Odométrie intégrée sur la carte moteurs, entraxe 318 mm, plus `SET_POSE` déclenché à la main et appliqué sans filtre | Odométrie + contact + mât | Reprendre, compléter |
| Stratégie | Fichier JSON de waypoints ordonnés, plus un registre d'actions nommées en Python avec décorateur d'enregistrement | Moteur générique + configuration | Reprendre le registre et le format de fichier, refaire le moteur |
| Gestion des journaux | Aucune. La sortie console part dans `/tmp/robot_server.log` sans quota ni rotation. Le programme n'écrit rien d'autre sur le disque | Quotas, tmpfs | Refaire |
| Politique de redémarrage | Aucune côté hors-ROS : le processus tombe, tout tombe. Côté Docker, `restart: on-failure:5` sans temporisation | Temporisation croissante, par processus | Refaire |
| Simulation | Aucune. Les « modes SIM » du code ne simulent rien : ils journalisent la commande quand une bibliothèque est absente | Cinématique maison | Refaire |
| Tests | `test_config.py`, qui vérifie que les imports passent. Aucun essai de dégradation | Dix essais dont six de dégradation | Refaire |
| Chien de garde des cartes | Aucun. Sur silence de la Pi, la carte moteurs termine sa file puis reste en maintien | Freinage sur silence prolongé, 300 ms | Refaire |
| Télémétrie d'alimentation | Émission en commentaire, acquisition analogique désactivée à la compilation. Zéro trame 0x020 sur 106 585 relevées | Tension, courant, défaut par carte | Refaire |

Les deux derniers axes ne figuraient pas dans la grille d'origine. Ils y sont ajoutés parce
que la lecture des firmwares les a fait apparaître, et qu'ils portent chacun une exigence de
la partie I — LOG-EXS-06 et LOG-EXE-02.

Deux lignes de la grille initiale étaient pré-remplies avec une hypothèse que la lecture
confirme à moitié. La gestion des journaux était bien défaillante, et plus qu'on ne le
supposait : elle est inexistante côté programme. L'IHM reste le morceau à reprendre, mais
l'énoncé « batterie, sorties, carte live, sélecteur stratégie, actions unitaires, logs » de
la grille d'origine décrit des écrans, pas des fonctions qui marchaient : la batterie
affichait zéro, et les logs ne survivaient pas à l'extinction.

# 5. Inventaire de réutilisation, fichier par fichier

Volumes mesurés par `wc -l`. La colonne « verdict » répond à la seule question utile :
qu'est-ce qui coûte plus cher à réécrire qu'à reprendre.

| Élément | Lignes | Verdict | Motif |
|---|---|---|---|
| `ihm/static/*` (app.js, index.html, style.css, strategy_editor.html) | 4 454 | Reprendre | Éprouvé en compétition, indépendant du langage du noyau, couplage au protocole confiné |
| `web.py` — 31 points d'entrée HTTP, une WebSocket, diffusion à 10 Hz | 455 | Reprendre le contrat, réécrire le corps | Le contrat d'API est ce que le front consomme ; le corps appelle directement les objets Python du noyau |
| `strategies/*.json` + format | 8 fichiers | Reprendre le format, jeter le contenu | Le contenu est le règlement 2026 |
| `actions.py` — registre nommé, décorateur, contexte, sommeil interruptible | 290 | Reprendre le motif de conception | C'est exactement la séparation code / donnée du principe P1, déjà écrite |
| `lidar_guard.py` — cônes par mouvement, marge de vitesse, hystérésis, filtre table | 237 | Reprendre la géométrie | Correspond à LOG-EXP-01 et au filtrage acté en 9.1 du CDC. La décision (arrêt) est à remplacer par `PAUSE`/`RESUME` |
| `can_link.py` — encodage des six opcodes, classification du mouvement | 320 | Reprendre la sémantique | Le format de trame change, les grandeurs et les bornes restent |
| `power_link.py` — BAU anti-rebond, relais, télémétrie | 181 | Reprendre la logique | L'anti-rebond à deux échantillons et le rejet des valeurs hors 0/1 sont du vécu |
| `aruco_detector.py` — Picamera2, détection, overlay MJPEG | 435 | Reprendre si la caméra embarquée est conservée | Dépend de la question ouverte 9.2 du CDC |
| `actuators.py` — PCA9685 et moteur pas à pas depuis la Pi | 241 | Ne pas reprendre | Les actionneurs passent sur les cartes refaites 2027 |
| `strategy_runner.py` | 649 | Ne pas reprendre l'exécuteur, reprendre le vocabulaire | Boucle bloquante par waypoint, incompatible avec la file remplaçable |
| `state.py` — état partagé verrouillé, journal CAN en anneau | 114 | Sans objet | Remplacé par le graphe ROS |
| `robot/config/can_protocol.py` | 54 | Point de départ du registre DBC | C'est la nomenclature réelle des quatre cartes |
| `Documents/canwatch/` | 134 | Reprendre comme outil de stand | Un visualiseur CAN qui marche est un gain de temps pendant le bring-up |
| `robot/ros2_ws/src/**` | 3 856 | Ne pas reprendre | Jamais éprouvé, et le noyau passe en C++. Intérêt documentaire : les interfaces des quatre cartes y sont écrites deux fois |
| Firmware moteurs — `MotionController` (profil trapézoïdal, PI de vitesse, correction de cap) | 370 | Reprendre | C'est le cœur qui a fait rouler le robot. Les gains sont ceux d'une machine réelle, pas d'un calcul |
| Firmware moteurs — `Navigator` (file de 16, enchaînement des phases) | 323 | Reprendre la file, refaire l'exécution | La structure de file est le point de départ ; le tourne-avance-tourne est ce qu'il faut remplacer |
| Firmware moteurs — `Encodeur` | 493 | Ne pas reprendre | Décodage logiciel par interruption, remplacé par du comptage matériel |
| Firmware moteurs — `RosBridge`, `CanStm32` | 304 | Reprendre la sémantique | Le format de trame change avec le registre DBC |
| Firmware alimentation — gestion du bouton d'arrêt d'urgence | ~60 | Reprendre | Anti-rebond, envoi immédiat sur flanc, diffusion à 10 Hz, verrouillage continu des relais. Éprouvé |
| Firmware alimentation — séquence de démarrage échelonnée 5 V, 12 V, 24 V | ~40 | Reprendre | Simple et utile |
| Firmware alimentation — télémétrie | 53 | Reprendre le squelette | Jamais activée, donc jamais validée |

Total réutilisable en l'état ou à peu de frais : de l'ordre de 5 500 lignes sur les 10 757
du système qui a joué, firmwares compris, dont 4 454 pour la seule interface. Le reste est du code dont on
reprend l'intention, pas le texte.

# 6. Ce que l'héritage tient et ne tient pas, au regard des exigences

Lecture : « couvert » signifie qu'un mécanisme existe et a fonctionné ; « partiel » qu'il
existe et ne suffit pas ; « absent » qu'aucun code ne s'y rapporte.

| Exigences | État de l'héritage | Remarque |
|---|---|---|
| LOG-EXR-01, LOG-EXR-02, LOG-EXP-05 (arrêt à 100 s, rangement) | Absent | Aucun décompte hors du navigateur. En 2026 l'arrêt en fin de match reposait sur l'opérateur ou sur l'épuisement de la liste de waypoints |
| LOG-EXR-03, LOG-EXR-04 (évitement en état de marche, non désactivable) | Partiel | Le garde-fou lidar fonctionne, mais il s'arrête au lieu de contourner, et `--no-lidar` est atteignable en ligne de commande |
| LOG-EXR-05 (aucun mouvement entre préparation et tirette) | Partiel | Rien ne bouge tant que la stratégie n'est pas lancée, mais `arm_strategy()` commande les servos à l'armement, ce qui est un mouvement d'actionneur après la préparation |
| LOG-EXR-11 (départ par la tirette seule) | Partiel | Deux chemins mènent au départ : le flanc GPIO côté serveur et un appel `/api/strategy/start` émis par le navigateur en mode Match. Le second est un départ logiciel |
| LOG-EXF-01, LOG-EXF-04 (position, recalage) | Partiel | Odométrie seule ; le recalage par contact est écrit puis désactivé |
| LOG-EXF-02, LOG-EXF-03, LOG-EXF-05 (précision, contournement, révision du choix) | Absent | Pas de planificateur, pas de moteur de décision |
| LOG-EXF-06 (actions en donnée) | Couvert dans l'esprit | Le registre d'actions et le JSON de waypoints réalisent la séparation, sans les champs de la section 11.3 |
| LOG-EXF-07 (séquence scriptée sélectionnable) | Couvert | C'est le seul mode qui existait, et le sélecteur de l'IHM est en place |
| LOG-EXF-08 à LOG-EXF-11 (PAMI, pose extérieure) | Absent | Hors périmètre 2026 |
| LOG-EXF-12 (mesure des paramètres physiques) | Absent | L'IHM expose des coefficients moteur, sans campagne de mesure |
| LOG-EXF-13 (commande unitaire des actionneurs) | Couvert | Onglet Actionneurs, onglet CAN, points d'entrée `/api/arm/*` et `/api/motor/*` |
| LOG-EXS-01, P6 (rien ne bloque le départ) | Couvert par accident | Aucun contrôle de précondition n'existe, donc aucun ne bloque |
| LOG-EXS-02 (perte de la navigation) | Sans objet | Il n'y avait pas de navigation à perdre |
| LOG-EXS-03 (perte du Wi-Fi) | Non tenu | Le mode Match démarre depuis le navigateur ; perdre le navigateur pendant la préparation supprime ce chemin de départ |
| LOG-EXS-04 (arrêt indépendant du calculateur) | Absent | Confirmé dans les deux firmwares : aucune échéance, aucun `MATCH_T0` |
| LOG-EXS-05 (freinage indépendant de la navigation) | Couvert par construction | Le garde-fou et l'exécuteur sont dans le même processus, ce qui tient l'exigence et crée le risque inverse |
| LOG-EXS-06 (freinage sur silence de la Pi) | Absent | Aucun chien de garde dans le firmware moteurs. Sur silence, la file en cours va à son terme et le robot reste en maintien |
| LOG-EXS-08 (rails du calculateur et du bus de commande jamais coupés) | Couvert | Vérifié sur la carte : les rails de commande 5 V ne passent pas par un relais. La coupure des trois relais à l'arrêt d'urgence ne les atteint pas |
| LOG-EXS-07 (seule l'alimentation interrompt, sur défaut caractérisé) | Partiel | La carte alimentation est bien la seule à pouvoir interrompre, mais elle ne le fait que sur appui du bouton : aucune détection de défaut électrique n'existe |
| LOG-EXS-09, LOG-EXS-10 (saturation du stockage, redémarrages) | Absent, et c'est la cause de l'incident | Aucun quota, aucune rotation, aucune temporisation |
| LOG-EXS-11 (remontée de défaut des cartes) | Partiel | Seul le BAU remonte, et il remonte bien : diffusion à 10 Hz plus envoi immédiat sur changement. La télémétrie d'alimentation n'est pas émise, et il n'existe ni code de défaut ni journalisation |
| LOG-EXS-12 (rejet d'une pose extérieure incohérente) | Absent | `SET_POSE` est appliqué sans aucun filtre |
| LOG-EXP-01 (distance de freinage calculée) | Partiel | La marge dépend de la vitesse commandée, pas de la décélération mesurée, et la vitesse est celle commandée, pas la réelle |
| LOG-EXP-03 (écart d'horodatage borné et mesuré) | Absent | Datation à la réception, jamais mesurée |
| LOG-EXP-07 (perte de trame détectable) | Absent | Aucun compteur de séquence, ni côté Pi ni côté cartes |
| LOG-EXE-01 (préparation en trois minutes) | Non mesuré | Aucune procédure écrite en 2026 |
| LOG-EXE-02 (état des cartes sur une vue unique) | Partiel, et trompeur | Un indicateur de présence par carte, à cinq secondes, sans version ni dernier défaut. La carte alimentation n'émettant pas de télémétrie, son indicateur ne s'allumait que par les trames de BAU et de relais |
| LOG-EXE-03 (journal exploitable après coup) | Absent | Le journal CAN vit en mémoire, cinquante lignes visibles, deux cents conservées |
| LOG-EXE-04, LOG-EXE-07 (pas d'ordinateur extérieur, usable au stand) | Couvert | C'est le point fort de cette IHM : écran tactile, kiosque, tout en local |
| LOG-EXE-05 (deux configurations visibles et journalisées) | Absent | Mode unique |
| LOG-EXE-06 (incohérence de version signalée) | Absent | Aucune trame `HELLO`, aucune version remontée |
| LOG-EXD-01 (réinstallation à l'identique) | Partiel et instable | Deux voies concurrentes, image Docker d'un côté, environnement virtuel Python de l'autre, `requirements.txt` sans versions figées |
| LOG-EXD-02 (source unique pour les échanges) | Non tenu | La description des trames existe en quatre copies divergentes, et l'une des divergences est active (voir les défauts d'unités ci-après) |
| LOG-EXD-05 (paramètres hors du code) | Non tenu | `config.py` est du code ; les angles de servo et les timings sont en dur dans `actions.py` |
| LOG-EXJ-01 à LOG-EXJ-15 (enregistrement, rejeu, capitalisation) | Absent | Aucune écriture. Les matchs 2026 sont définitivement perdus |

# 7. Défauts relevés dans le code repris

Ils sont listés parce qu'ils voyageront avec le code si on ne les traite pas à la reprise.
Chacun est localisé.

**Le départ du match a deux chemins concurrents.** `tirette.py` appelle
`runner.on_tirette_pulled()` sur le flanc GPIO, et `app.js` appelle `/api/strategy/start`
quand sa propre machine d'état de mode Match voit la tirette partir. Le second gagne quand
le navigateur est ouvert, le premier quand il ne l'est pas, et le perdant est ignoré parce
que `_running` est déjà vrai. En 2027 le départ doit avoir un seul chemin, celui du GPIO.

**Le sens de lecture de la tirette : levé.** Mesure faite au multimètre : le contact est
**ouvert quand la tirette est insérée** et fermé quand elle est retirée. Avec `pull_up=True`,
tirette insérée donne un niveau haut, donc `is_pressed` faux, donc `inserted = True` ; tirette
retirée donne l'inverse, et le flanc déclenche bien `on_pulled`. **Le code est juste, c'est
son en-tête qui décrit le câblage à l'envers.** À corriger dans le commentaire, pas dans la
logique — et à consigner, parce que c'est exactement le genre d'écart qui fait reprendre un
code correct pour le « réparer ».

**La séquence de calage est morte.** Dans `strategy_runner._run_calage`, les trois étapes
de contact mural sont en commentaire. Ce qui subsiste est un `SET_POSE` sur des
coordonnées figées, immédiatement suivi d'un `send_stop()`. Autrement dit, en fin de
saison 2026, le recalage consistait à déclarer une position sans la mesurer. La séquence
commentée reste la meilleure base pour la procédure de préparation (17.11).

**L'action `release_element` ne retourne rien**, donc `False` pour l'appelant. Elle est
aussi enregistrée comme alias de `arm_release`, ce qui fait que l'alias ne fait pas la même
chose que la fonction du même nom.

**L'exécuteur est bloquant par waypoint.** `_goto_waypoint` attend `STATUS_DONE` avec un
délai de garde de 60 s, en boucle de 100 ms. Rien ne peut réviser l'objectif pendant ce
temps, ce qui rend structurellement impossibles LOG-EXF-03 et LOG-EXF-05. C'est le point
qui justifie la file remplaçable de la section 4.2, indépendamment de Nav2.

**Le délai de garde de 60 s par waypoint dépasse la durée du match.** Un waypoint qui
échoue consomme les 100 s sans que rien ne se passe.

**Les unités de `CMD_TURN_ADD` ne concordent pas entre la Pi et la carte.** La Pi encode
l'angle en milliradians et la vitesse en centimètres par seconde
(`struct.pack('<BhB', CMD_TURN_ADD, theta_rad*1000, v*100)`). Le firmware relit le même
champ comme des **degrés** et la vitesse comme des **degrés par seconde**
(`angleDeg * pi/180`). Une demande de quatre-vingt-dix degrés part à 1 571 et arrive à
1 571 degrés, soit vingt-sept radians. La commande est donc inutilisable telle quelle, ce
qui explique sans doute qu'elle ne serve nulle part dans une stratégie enregistrée : les
seuls appels sont la séquence de calage, mise en commentaire, et un bouton de l'IHM. C'est
la démonstration par l'exemple de LOG-EXD-02 : quatre descriptions du même bus, et celle
qui compte est celle que personne n'a relue.

**Les traces de mise au point bloquent la boucle d'asservissement.** `debugEnabled_` vaut
`true` par défaut et n'est jamais remis à faux. En ligne droite et en rotation, un `printf`
d'environ cent cinquante caractères part toutes les dix périodes sur une liaison série non
tamponnée à 115 200 bauds, soit de l'ordre de treize millisecondes d'écriture bloquante —
davantage que la période de dix millisecondes de la boucle elle-même. Le calcul est
arithmétique, pas mesuré ; il suffit à dire que la boucle rate sa cadence une fois tous les
dixièmes de seconde, pendant les phases où elle est justement en train d'asservir.

**L'odométrie est écrite deux fois.** La classe `Encodeur` porte ses propres `x`, `y`,
`theta`, un rayon de 22 et un entraxe de 88 qui ne correspondent à rien de la configuration
réelle (24,75 mm et 318 mm), et sa méthode `odometrie()` n'est jamais appelée. Seule
l'intégration de `MotionController` est vivante. Code mort, mais code mort qui ressemble à
la vérité.

**La bibliothèque `CanStm32` est dupliquée entre les deux firmwares**, avec des interfaces
déjà légèrement différentes. À la troisième carte, la divergence est certaine.

**`docs/RAPPORT_FINAL.md` est faux.** Il affirme un débit lidar de 256 000 bauds quand la
configuration dit 460 800, des servos sur GPIO 17/27/22 quand ils sont sur un PCA9685 en
I²C, et des angles de préréglage qui ne sont plus ceux de `config.py`. Les huit documents
de `robot_tempo/docs/` datent d'états intermédiaires et décrivent un système qui n'existe
plus. Ne pas s'en servir comme source.

**Le dépôt `robot_tempo` est désynchronisé.** Les six commits s'arrêtent avant la
compétition et l'arbre de travail diffère de `HEAD` sur soixante fichiers. Ce qui a joué
n'est pas ce qui est commité. À figer avant toute reprise.

# 8. Ce qui reste, ordonné

Les charges sont estimées, non mesurées. Elles supposent une personne connaissant déjà le
code, et n'incluent ni la mise au point sur table ni les firmwares.

| Rang | Travail | Nature | Charge estimée |
|---|---|---|---|
| 1 | Figer l'héritage : `robot_tempo` commité le 19 septembre 2026. Reste à faire de même pour les deux firmwares et à les étiqueter ensemble | Reprise | Fait pour la Pi, 1 h pour les cartes |
| 1 bis | Lire les registres d'horloge au démarrage des deux cartes, ST-LINK débranché | Mesure | 10 min, déjà au jalon « immédiat » |
| 1 ter | Décider si les cartes 2027 reçoivent un quartz — deux pastilles et trente centimes, à arbitrer avant routage | Décision | Bloque le routage |
| 2 | Registre DBC des quatre cartes à partir de `can_protocol.py`, plus plan d'identifiants par champs | Neuf, LOG-EXD-02 | 1 à 2 j |
| 3 | Quotas de journaux, `RestartSec` croissant, tmpfs, sur les cinq unités systemd | Neuf, LOG-EXS-09 et LOG-EXS-10 | 2 h de configuration, 1 j avec l'essai V3 |
| 4 | Décision sur l'IHM, puis extraction de la couche `/api/*` en contrat stable | Reprise | 1 j pour la décision, 3 à 5 j pour l'extraction |
| 5 | Passerelle CAN en C++, minuterie de fin de match et chien de garde dans les firmwares | Neuf, LOG-EXR-01 et LOG-EXS-06 | 3 à 5 j par carte, sur une base mbed déjà en place |
| 6 | Enregistrement de match, format et écriture | Neuf, LOG-EXJ-01 à LOG-EXJ-07 | 3 à 5 j |
| 7 | File de waypoints remplaçable, côté Pi et côté carte | Neuf, refonte de l'exécuteur | 1 à 2 semaines côté Pi |
| 8 | Réflexe obstacle en couche 1, à partir de la géométrie de `lidar_guard.py` | Reprise transposée | 3 à 4 j |
| 9 | Onglets calibration et état système de l'IHM | Extension | 2 à 3 semaines, cohérent avec l'échéance de 17.5 |
| 10 | Moteur de stratégie et format de description des actions | Neuf | 2 à 4 semaines |
| 11 | Lecteur de rejeu, puis simulateur cinématique | Neuf | Non chiffré, après le règlement |

L'ordre suit les dépendances, pas l'importance. Les rangs 1 à 3 valent moins de trois jours
à eux trois et retirent la cause de l'incident de 2026 ; ils sont faisables avant la
publication du règlement.

# 9. Comment le refaire

**Traiter l'interface comme un produit, pas comme un morceau du noyau.** L'interface 2026
est déjà une interface web servie par la Pi et affichée en kiosque. C'est précisément la
seconde branche envisagée en 17.5 du CDC, et elle est déjà réalisée. La question 6 de la
section 16.4 peut donc se refermer sur « reprendre », à une condition : que le couplage au
protocole reste où il est aujourd'hui, c'est-à-dire dans la table déclarative
`CAN_COMMANDS` d'`app.js` et dans les trente-deux points d'entrée de `web.py`. Le rendu,
le tracé de l'aire de jeu, les jauges, le mode Match et l'éditeur de stratégie ne
connaissent rien du CAN.

*Contre-argument à conserver :* le CDC place l'affichage d'état critique en couche 1, dans
le noyau C++. Reprendre l'interface telle quelle signifie garder un serveur web Python
dans le système, donc un sixième processus, ou bien réécrire le serveur en C++ et perdre
une partie du bénéfice de la reprise. Une troisième voie existe — le noyau publie son état,
un processus d'interface le consomme et n'a aucun droit de commande pendant le match —
mais elle n'est pas tranchée et elle n'est pas gratuite.

**Reprendre les intentions, pas les fonctions.** Pour le garde-fou lidar, ce qui a de la
valeur n'est pas le code mais quatre décisions déjà payées : cône dépendant du sens réel du
mouvement projeté dans le repère robot, marge proportionnelle à la vitesse, hystérésis de
reprise, et rejet de tout point hors des bordures de table. Les transposer en C++ coûte
moins cher que les redécouvrir. Le commentaire d'en-tête de `lidar_guard.py`, qui explique
pourquoi la version précédente ne marchait pas, vaut à lui seul d'être conservé.

**Sur les cartes, garder la commande et jeter l'acquisition.** Le profil trapézoïdal et le
PI de vitesse par roue du firmware moteurs ont fait rouler le robot en compétition, et leurs
gains sont ceux d'une machine réelle. Ce qui est à remplacer se situe de part et d'autre :
en amont le comptage des codeurs, qui coûte une interruption par front ; en aval
l'enchaînement tourne-avance-tourne de `Navigator`, qui est la vraie raison pour laquelle le
robot s'arrête entre deux points — pas la file, qui existe déjà et qu'il suffit d'étendre
avec un numéro de séquence et un remplacement. Reformulé : le travail firmware de la saison,
que le CDC annonce comme la poursuite de point cible, porte sur trois cents lignes, pas sur
le firmware entier.

**Ajouter les trois mécanismes manquants avant d'ajouter des fonctions.** Minuterie de fin de
match, chien de garde sur silence de la Pi, et trame d'identification portant la version.
Aucun des trois n'existe, chacun tient en quelques dizaines de lignes sur une base mbed déjà
en place, et chacun couvre une exigence que le règlement sanctionne ou qu'un diagnostic de
stand exige. Les écrire tôt les rend testables toute la saison plutôt qu'en avril.

**Écrire le registre de trames avant le premier octet de firmware.** La description des
échanges existe aujourd'hui en deux copies divergentes, et c'est de là que viennent les
écarts silencieux. Le DBC acté en 8.3 doit précéder les deux côtés du bus, pas les suivre.

**Ne pas reprendre l'exécuteur de stratégie, reprendre son vocabulaire.** Le registre
d'actions nommées d'`actions.py` — décorateur d'enregistrement, contexte passé à chaque
action, sommeil interruptible qui respecte une demande d'arrêt — est la bonne structure.
Ce qu'il faut jeter, c'est la boucle qui attend l'arrivée avant de penser à la suite.

**Instrumenter avant d'optimiser.** L'exigence LOG-EXJ est la seule dont le retard est
irrattrapable : un match non enregistré est perdu. Les rangs 6 et 11 du tableau précédent
peuvent se séparer — écrire les données maintenant, écrire le lecteur plus tard.

**Faire porter les paramètres par des fichiers.** `config.py` est du code déguisé en
configuration, et les angles de servo sont écrits en dur dans `actions.py`. LOG-EXD-05
demande l'inverse. Le coût est faible tant que le volume de paramètres est faible ; il
croît vite ensuite.

# 10. Ce que ce rapport ne tranche pas

La décision de reprise de l'IHM, qui appartient à la question 6 de la section 16.4 : ce
document fournit la grille, pas l'arbitrage.

Le sort de la caméra embarquée et de la détection ArUco, qui dépend de la section 9.2 du
CDC et du règlement 2027.

Le firmware de la carte bras et de celle des actionneurs, dont seul un binaire subsiste. Les
lignes de la grille qui les concernent restent renseignées d'après le comportement observé
côté Pi.

La part respective de l'horloge et du logiciel dans les écarts de période relevés sur le bus.
Le relevé donne une borne, pas une attribution.

La comparaison chiffrée des performances, faute d'enregistrement de match. Aucune vitesse,
aucune précision d'accostage, aucune durée d'action de 2026 n'est mesurable aujourd'hui.
C'est la perte la plus coûteuse de l'édition précédente, et elle est définitive.
