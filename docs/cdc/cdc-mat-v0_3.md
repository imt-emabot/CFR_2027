---
title: "Cahier des charges — Dispositif de calcul et d'observation déporté"
subtitle: "Coupe de France de Robotique 2027 — v0.3"
date: "3 septembre 2026"
lang: fr
---

# Comment lire ce document

Même découpe que le cahier des charges du logiciel du robot.

**La partie I énonce les besoins, les contraintes subies et les exigences**, sans nommer de
technologie ni de composant. C'est la référence pour juger une solution.

**La partie II rassemble les analyses et les orientations techniques.** Comparaisons,
calculs de dimensionnement, options écartées. **Rien de ce qui s'y trouve n'est un choix
définitivement validé**, y compris ce qui y porte la mention « ACTÉ », qui signifie
seulement « retenu à ce stade et non remis en cause depuis ».

Vérification des exigences : **I** par inspection, **A** par analyse ou calcul, **E** par
essai, **H** vérifié à l'homologation.

## Identifiants et renvois

Chaque exigence porte un identifiant de la forme **`MAT-<catégorie>-<numéro>`**, par
exemple `MAT-MXP-01`. Le préfixe de document rend l'identifiant non ambigu partout : dans un autre
cahier des charges, dans un message, dans un commit.

Trois règles s'appliquent, et elles sont vérifiées automatiquement par `verif_cdc.py` :

- **Un identifiant retiré n'est jamais réattribué.** Les trous de numérotation sont déclarés
  sous le tableau concerné.
- **Une exigence dont le sens change est retirée et remplacée** par un nouvel identifiant.
  Seule la reformulation à sens constant est autorisée en place.
- **Aucun document n'est cité par son numéro de version.** Les renvois vers un autre cahier
  des charges se font par identifiant d'exigence ou par section. La version vit dans le
  dépôt, pas dans le texte.

Les besoins, les principes et les essais sont locaux à ce document et peuvent s'écrire sans
préfixe dans le corps du texte ; cités depuis un autre document, ils doivent l'être avec le
préfixe, par exemple `MAT-Q1`.

Les conventions complètes, et la procédure à suivre pour modifier ou créer un cahier des
charges, sont dans `conventions-cdc.md`, à la racine du dépôt.

---

# PARTIE I — BESOINS, CONTRAINTES ET EXIGENCES

---

# 1. Objet et périmètre

Le règlement appelle ce sous-système le **dispositif de calcul et d'observation déporté**
(G.4). C'est une catégorie homologable à part entière, distincte du robot, des PAMI et des
balises.

Il porte trois fonctions, dont l'ordre de priorité est une décision structurante :

| Rang | Fonction | Pourquoi ce rang |
|---|---|---|
| 1 | Porter le réseau de l'équipe sur la table | Sans lui, aucune communication n'est conforme (F.6) |
| 2 | Coordonner les PAMI et porter leur cordon de départ | Sans lui, les PAMI ne partent pas |
| 3 | Observer la position des robots en vue de dessus | Améliore le recalage ; le robot joue sans |

**La fonction 3 est celle qui donne son nom au projet et c'est la moins prioritaire.**
Conséquence directe : le dispositif doit pouvoir être homologué et joué sans sa partie
vision.

# 2. Besoins

**B1 — Rendre les communications de l'équipe conformes.** Le règlement interdit tout
échange avec l'extérieur de la table pendant un match ; il faut donc que le réseau soit
lui-même sur la table.

**B2 — Permettre aux PAMI de jouer.** Numérotation, supervision, signal de départ.

**B3 — Améliorer la connaissance de la position sur la table.** L'odométrie dérive ; une
mesure absolue extérieure la corrige.

**B4 — Ne jamais dégrader ce qui marche sans lui.** Le robot et les PAMI doivent jouer un
match complet, dispositif absent ou en panne.

**B5 — Tenir dans trois minutes de mise en place**, sans intervention experte sur la table.

**B6 — Rester à la portée de l'équipe**, en heures de conception comme en fabrication.

# 3. Contraintes subies

## 3.1 Réglementaires

| Référence | Contenu |
|---|---|
| G.4 | Support : plateforme partagée sur l'axe de symétrie du fond de terrain, 70 mm au-dessus du sol de jeu, épaisseur 22 mm |
| G.4 | **Emprise autorisée : 450 × 320 mm par équipe**, centre de zone à 225 mm de l'axe de la table |
| G.4 | Interdiction formelle de déborder sur la partie de plateforme adverse |
| G.4 | Hauteur maximale de 1,6 m au-dessus de la surface supérieure de la plateforme ; interdiction de descendre sous sa surface inférieure |
| G.4 | Masse inférieure à 5 kg |
| G.4 | Fixation par au moins une tige filetée Ø8 mm et un écrou papillon dans une rainure de 10 mm de large et **100 mm de long** ; son absence empêche l'homologation |
| G.4 | Tous les éléments solidaires, rien ne doit pouvoir tomber de la table |
| G.4 | Le dispositif est soumis aux vibrations dues aux déplacements des robots |
| G.1 | Les consignes de sécurité applicables aux robots s'appliquent au dispositif |
| F.4.c | Bouton d'arrêt d'urgence exigé seulement en présence de parties mobiles ou de composants dangereux |
| F.4.b | Batteries au lithium : chargeur présenté et sac ignifuge, sauf BMS intégré par le fabricant et enveloppe solide, utilisés pour l'usage prévu |
| F.6 | Le dispositif figure parmi les éléments pouvant porter un cordon de démarrage |
| F.5 | Wi-Fi 5 GHz recommandé, aucune contestation possible sur les interférences |
| H.1 | Trois minutes de mise en place pour l'ensemble de l'équipe |

## 3.2 Géométriques

Données de la table, mesurées ou relevées sur le plan, qui commandent tout le
dimensionnement optique.

| Grandeur | Valeur | Statut |
|---|---|---|
| Table | 3000 × 2000 mm | Règlement |
| Position de la plateforme | Milieu du grand côté de fond | Règlement |
| Hauteur maximale de l'optique au-dessus du sol de jeu | 1670 mm | Calculé, 70 + 1600 |
| Hauteur de la cible observée | 440 mm, ou 520 mm si l'adversaire pose une balise embarquée | Règlement, G.2 et G.6 |
| **Hauteur utile de l'optique au-dessus de la cible** | **1230 mm** | Calculé |
| Tags de référence de la table | Quatre, 100 mm de côté, à ±900 et ±400 mm du centre | **Relevé sur le plan, confirmé** |
| Distances des tags au dispositif | 1032 à 1796 mm selon le placement | Calculé |

**L'optique ne peut pas être placée sur l'axe de symétrie de la table**, puisqu'aucune
partie du dispositif ne doit déborder sur la moitié adverse. Elle est donc décalée d'au
moins la demi-largeur de la tête, et la couverture des deux moitiés de table est
nécessairement dissymétrique. Le décalage s'inverse d'un match à l'autre, puisque la moitié
de plateforme attribuée dépend de la couleur d'équipe.

## 3.3 D'interface

Le dispositif ne pilote rien. Il observe, il relaie, il coordonne les PAMI. Le robot reste
l'autorité sur sa propre position et sur l'état du jeu.

# 4. Principes directeurs

**Q1 — Le réseau prime sur la vision.** En conception, en développement et en cas de panne.

**Q2 — Le dispositif n'a aucun état persistant dont le robot dépende.** Il peut être éteint
et rallumé sans que le robot en souffre.

**Q3 — Aucune correction n'écrase une mesure du robot.** Le dispositif propose, le robot
dispose.

**Q4 — Rien ne se règle sur la table.** Tout ce qui demande du jugement, de la précision ou
du temps se fait avant de monter.

# 5. Exigences

## 5.1 Exigences réglementaires

| # | Exigence | Origine | Vérif. |
|---|---|---|---|
| MAT-MXR-01 | Aucune partie du dispositif ne dépasse l'emprise de 450 × 320 mm attribuée à l'équipe, ni ne déborde sur la moitié adverse | G.4 | I, H |
| MAT-MXR-02 | La hauteur totale reste sous 1,6 m au-dessus de la plateforme, et rien ne descend sous sa face inférieure | G.4 | I, H |
| MAT-MXR-03 | La masse totale du dispositif, batterie et câblage compris, reste sous 5 kg | G.4 | I, H |
| MAT-MXR-04 | Le dispositif est fixé par tige filetée et écrou papillon dans la rainure ; aucun élément ne peut se détacher ou tomber de la table | G.4 | I, H |
| MAT-MXR-05 | Le dispositif ne comporte ni partie mobile, ni source lumineuse ou laser susceptible d'imposer un bouton d'arrêt d'urgence | F.4.c | I |
| MAT-MXR-06 | Aucun équipement du dispositif ne communique avec un système extérieur à la table pendant un match | F.6 | I |
| MAT-MXR-07 | La source d'énergie satisfait les conditions du règlement sans réserve, ou fait l'objet d'un accord écrit du comité d'arbitrage | F.4.b | I, H |
| MAT-MXR-08 | Le cordon de départ des PAMI porté par le dispositif est accessible et conforme | F.6 | I, H |

## 5.2 Exigences fonctionnelles

| # | Exigence | Besoin | Vérif. |
|---|---|---|---|
| MAT-MXF-01 | Le dispositif fournit un réseau sans fil couvrant la table, auquel se connectent le robot et les PAMI | B1 | E |
| MAT-MXF-02 | Le dispositif attribue un numéro à chaque PAMI et affiche l'état de connexion de chacun | B2 | E |
| MAT-MXF-03 | Le dispositif diffuse aux PAMI un instant de départ, et non un ordre de départ | B2 | E |
| MAT-MXF-04 | Le dispositif détermine la position des robots présents sur la table et la transmet au robot de l'équipe | B3 | E |
| MAT-MXF-05 | Chaque position transmise est accompagnée d'une datation et d'un indicateur de confiance | B3 | I, E |
| MAT-MXF-06 | Le dispositif distingue le robot de l'équipe du robot adverse sans intervention humaine en cours de match | B3 | E |
| MAT-MXF-07 | Le dispositif établit sa propre situation par rapport à la table sans intervention humaine | B5 | E |
| MAT-MXF-08 | Le dispositif réévalue en permanence sa situation par rapport à la table pendant le match | B3 | A, E |
| MAT-MXF-09 | Le dispositif signale lui-même la dégradation ou la perte de sa fonction d'observation | B4 | E |
| MAT-MXF-10 | Le dispositif collecte les journaux des PAMI et les rend consultables après le match | B2 | I |
| MAT-MXF-11 | Les paramètres qui changent d'un match à l'autre — couleur d'équipe, hauteur du marqueur adverse — sont saisissables pendant la préparation | B5 | I |
| MAT-MXF-12 | Chaque position est datée dans une base de temps dont le décalage avec l'horloge du robot est estimable en continu par le robot, sans horloge commune préalable | B3 | A, E |

## 5.3 Exigences de sûreté et de dégradation

| # | Exigence | Origine | Vérif. |
|---|---|---|---|
| MAT-MXS-01 | La perte de la fonction d'observation ne perturbe ni le réseau ni la coordination des PAMI | Q1 | E |
| MAT-MXS-02 | Le robot joue un match complet, dispositif éteint ou absent | Q2 | E |
| MAT-MXS-03 | Les PAMI partent, dispositif tombé après diffusion de l'instant de départ | Q2 | E |
| MAT-MXS-04 | Une position transmise dont la vraisemblance est douteuse est signalée comme telle, ou n'est pas transmise | Q3 | A, E |
| MAT-MXS-05 | Le dispositif n'émet aucune commande vers le robot ni vers ses cartes | Q3 | I |
| MAT-MXS-06 | Une perte de repère du dispositif par rapport à la table est détectée et signalée, jamais compensée en silence | Q3 | E |
| MAT-MXS-07 | Un choc ou un déplacement du dispositif est détecté et invalide les positions transmises jusqu'à rétablissement | Q3 | E |
| MAT-MXS-08 | L'autonomie électrique couvre une journée complète de compétition, le dispositif étant éteint entre les matchs ; une demi-journée sans extinction | B6 | A, E |

## 5.4 Exigences de performance

Les valeurs cibles sont à confirmer par la mesure ; tant qu'elles ne le sont pas, les
paramètres sont pris pessimistes.

| # | Exigence | Vérif. |
|---|---|---|
| MAT-MXP-01 | L'erreur de position transmise reste inférieure au seuil au-delà duquel le robot rejette la correction, en tout point de la table | A, E |
| MAT-MXP-02 | La cadence de transmission des positions est suffisante pour suivre un robot se déplaçant à 1 m/s | A, E |
| MAT-MXP-03 | La datation d'une position correspond à l'instant réel de la mesure, et non à celui de sa transmission | A, E |
| MAT-MXP-04 | Les oscillations mécaniques du dispositif ne dégradent pas l'erreur de position au-delà du budget de MAT-MXP-01 | A, E |
| MAT-MXP-05 | La détermination de la situation par rapport à la table reste valide malgré l'occultation d'une partie des repères | E |
| MAT-MXP-06 | Le délai entre l'instant de mesure d'une position et sa disponibilité chez le robot est borné, mesuré, et reste sous la valeur retenue par le robot pour son mécanisme de correction | A, E |

**Note sur MAT-MXP-04.** L'inclinaison du dispositif se traduit au sol par une erreur
proportionnelle à la portée : 0,1° font environ 5 mm au point le plus éloigné, 0,5° en font
24. C'est ce qui rend la tenue mécanique et son éventuelle compensation une question de
performance, et non de simple robustesse.

## 5.5 Exigences d'exploitation

| # | Exigence | Vérif. |
|---|---|---|
| MAT-MXE-01 | La mise en place sur la table se limite à poser, fixer et lancer ; aucune connexion ni saisie sur la table | E |
| MAT-MXE-02 | Le dispositif démarre en autonomie et est opérationnel avant d'être posé | E |
| MAT-MXE-03 | L'état du dispositif est lisible depuis la table sans écran ni ordinateur | I |
| MAT-MXE-04 | Le diagnostic complet est accessible au stand sans démonter le dispositif | I |
| MAT-MXE-05 | Le transport et le montage se font sans outil, hors la fixation réglementaire | I |
| MAT-MXE-06 | Aucun réglage optique ou mécanique n'est nécessaire entre deux matchs, y compris en cas de changement de couleur d'équipe | E |

## 5.6 Exigences de développement

| # | Exigence | Besoin | Vérif. |
|---|---|---|---|
| MAT-MXD-01 | Les fonctions réseau et coordination sont réalisables et homologables sans la fonction d'observation | Q1, B6 | I |
| MAT-MXD-02 | Les fonctions d'observation et de coordination sont indépendantes au point qu'une défaillance de l'une ne touche pas l'autre | Q1 | E |
| MAT-MXD-03 | Les paramètres de dimensionnement — géométrie, seuils, cadences — sont dans des fichiers de configuration versionnés | B6 | I |
| MAT-MXD-04 | Les compétences et les outils déjà maîtrisés par l'équipe sont réutilisés plutôt que remplacés | B6 | I |

# 6. Plan de vérification

| Essai | Description | Exigences couvertes |
|---|---|---|
| M1 | Mise en place chronométrée, deux personnes, robot et PAMI compris | MAT-MXE-01, MAT-MXE-02, MAT-MXR-04 |
| M2 | Match joué dispositif éteint | MAT-MXS-02, MAT-MXS-03 |
| M3 | Fonction d'observation interrompue en plein match | MAT-MXS-01, MAT-MXF-09, MAT-MXD-02 |
| M4 | Occultation volontaire d'une partie des repères de table | MAT-MXP-05, MAT-MXS-06 |
| M5 | Choc porté au dispositif pendant un match | MAT-MXS-07, MAT-MXP-04 |
| M6 | Mesure de l'erreur de position en une dizaine de points connus de la table | MAT-MXP-01, MAT-MXP-02, MAT-MXP-03 |
| M6b | Mesure du délai de bout en bout mesure → réception par le robot, et de l'écart d'horloge estimé | MAT-MXF-05, MAT-MXF-12, MAT-MXP-06 |
| M7 | Journée complète sur une charge de batterie | MAT-MXS-08 |
| M8 | Deux matchs consécutifs avec changement de couleur d'équipe | MAT-MXE-06, MAT-MXF-06, MAT-MXF-11 |
| M9 | Pesée et métrologie d'encombrement avant homologation | MAT-MXR-01, MAT-MXR-02, MAT-MXR-03 |
| M10 | Revue d'homologation sur pièces : conformité électrique, absence de partie mobile, cordon de départ, non-communication vers l'extérieur | MAT-MXR-05, MAT-MXR-06, MAT-MXR-07, MAT-MXR-08 |

*Les exigences dont la colonne de vérification ne porte que **I** ne font pas l'objet d'un
essai : elles sont contrôlées par inspection lors de la revue de document, et non par une
manipulation. Ce sont MAT-MXF-02, MAT-MXF-10, MAT-MXF-11, MAT-MXS-05, MAT-MXE-03, MAT-MXE-04, MAT-MXE-05, MAT-MXD-01,
MAT-MXD-03 et MAT-MXD-04.*

# 7. Ce qui n'est pas une exigence

Traité en partie II, comme orientations révisables : le nombre et le type de capteurs
d'image, leur champ et leur résolution, la nature des repères exploités, le calculateur, la
technologie du réseau, la source d'énergie, le matériau et la géométrie de la structure,
l'emplacement du calculateur sur la structure, la présence d'un capteur inertiel, les
protocoles de transport, et la présence d'un écran de mise au point.

---

# PARTIE II — ANALYSES ET ORIENTATIONS TECHNIQUES

**Statut de cette partie.** Journal de conception, pas spécification. **Aucun élément n'est
un choix définitivement validé** ; la mention « ACTÉ » signifie « retenu à ce stade et non
remis en cause depuis ».

Deux orientations importantes y restent explicitement ouvertes et sont maintenues en
parallèle : le matériau de la structure, et la présence d'un capteur inertiel en tête.

Les renvois internes du type « voir 3.2 » désignent les sections de cette partie.


## 1. Contraintes réglementaires — relevé détaillé

*Les contraintes retenues comme données d'entrée sont en partie I, section 3.1. Ce qui suit
en est le relevé complet avec les analyses associées.*

Relevé du règlement général Eurobot, version officielle 1.2, section G.4 sauf mention
contraire.

| Élément | Valeur | Remarque |
|---|---|---|
| Support | Plateforme partagée, milieu du bord de fond de table, 70 mm au-dessus du sol de jeu | Épaisseur 22 mm, rainure de 10 mm |
| Emprise autorisée | 450 × 320 mm annoncés, **moitié seulement pour notre équipe** | Voir la réserve ci-dessous |
| Hauteur | 1,6 m au-dessus de la surface supérieure de la plateforme | Ne pas descendre sous la surface inférieure |
| Débord | 100 mm à l'arrière uniquement | Interdiction formelle de déborder côté adverse |
| Masse | < 5 kg | |
| Fixation | Au moins une tige filetée Ø8 mm et un écrou papillon dans la rainure | **Son absence empêche l'homologation** |
| Solidarité | Tous les éléments fixés entre eux, rien ne doit pouvoir tomber de la table | |
| Vibrations | Explicitement annoncées par le règlement | Voir 8.2 |
| Liaison filaire | Autorisée vers les balises fixes | Sans objet, pas de balises cette année |
| Communication | Aucun échange avec un système extérieur à la table pendant un match | F.6, voir section 6 |
| Arrêt d'urgence | Exigé seulement en présence de parties mobiles ou de composants dangereux | F.4.c, voir 1.2 |
| Temps de mise en place | 3 minutes pour l'ensemble de l'équipe | H.1, voir section 11 |

### 1.1 Emprise au sol — valeur corrigée

**Correction par rapport à la v0.1**, qui retenait 220 × 300 mm en supposant que les
450 mm annoncés étaient partagés entre les deux équipes. Le plan général montre qu'il n'en
est rien : **chaque équipe dispose de 450 × 320 mm**, et le centre de sa zone est à 225 mm
de l'axe de symétrie de la table.

Conséquences en cascade sur toute la conception mécanique :

- Un trépied ou un cadre triangulé devient possible, là où 220 mm imposaient un mât encastré
  unique.
- Le recul disponible pour ancrer une jambe de force passe à 420 mm, en comptant les 320 mm
  de plateforme et les 100 mm de débord arrière autorisé.
- La rainure de fixation faisant 100 mm de long, **deux tiges M8 y tiennent**, espacées de
  60 à 70 mm. Le règlement dit « au moins une » ; la seconde bloque la rotation autour de la
  verticale, que la première ne reprend pas.

En revanche l'emprise ne permet toujours pas de placer l'optique sur l'axe de symétrie de la
table, puisque rien ne doit déborder côté adverse. Le décalage minimal vaut la demi-largeur
de la tête. Voir 2 pour ce que cela coûte.

### 1.2 Bouton d'arrêt d'urgence

F.4.c impose un bouton d'arrêt d'urgence aux systèmes annexes **s'ils comprennent des
parties mobiles ou des composants potentiellement dangereux**, en citant explicitement les
lasers et les sources lumineuses puissantes.

Le mât n'a aucune partie mobile. **[ACTÉ]** Il n'embarquera **aucun éclairage d'appoint**,
ce qui le maintient hors du champ de cette obligation et supprime un composant, un câblage
et une source de consommation. Si l'éclairage de salle s'avérait insuffisant, la réponse
serait d'ouvrir le diaphragme et d'allonger le temps de pose, pas d'ajouter une lampe.

---

## 2. Géométrie du problème

Toute la conception optique découle de trois nombres.

| Grandeur | Valeur |
|---|---|
| Hauteur de la caméra au-dessus du sol de jeu | 1670 mm au maximum (70 + 1600) |
| Hauteur de la cible suivie | 440 mm — centre de la tranche colorée du marqueur |
| **Hauteur utile de la caméra au-dessus du plan de la cible** | **1230 mm** |
| Distance horizontale au coin lointain | 2500 mm |
| Portée au coin lointain | 2786 mm |

La caméra est au milieu d'un grand côté d'une table de 3 × 2 m. En prenant l'origine à sa
verticale, la table s'étend de −1500 à +1500 en largeur et de 0 à 2000 en profondeur.

**Hypothèse retenue pour tout le dimensionnement : cible à 440 mm.** Le cas 520 mm, quand
l'adversaire pose une balise embarquée, ramène la hauteur utile à 1150 mm et l'élévation au
coin lointain de 26,2° à 24,7°. L'effet sur la résolution est de l'ordre de 6 % en radial,
absorbé par les marges de 3.2 ; il n'est pas repris dans les tables. Les tags de calibration,
eux, sont dans le plan de jeu et ne sont pas concernés.

**Angles depuis un axe optique pointé vers le centre de la table :**

| Point de la table | Distance horizontale | Portée | Angle hors axe | Élévation |
|---|---|---|---|---|
| Centre | 1000 mm | 1585 mm | 0° | 50,9° |
| Bord lointain, au centre | 2000 mm | 2348 mm | 19,3° | 31,6° |
| Coins lointains | 2500 mm | 2786 mm | 37,3° | 26,2° |
| **Coins proches** | 1500 mm | 1940 mm | **60,5°** | 39,4° |

Le résultat contre-intuitif est là. Les points difficiles ne sont pas les coins lointains
mais les **coins proches**, ceux qui sont de part et d'autre du pied du mât. Ils sont à
60,5° de l'axe optique, alors qu'une Camera Module 3 Wide n'ouvre que ±51° en horizontal.

**Une caméra unique ne peut donc pas couvrir la table, quelle que soit sa résolution.**
Ce n'est pas une question de netteté, c'est une question de champ. L'intuition de départ
— deux caméras qui se recouvrent au milieu — est la bonne, mais pour cette raison-là et
pas pour celle qu'on croyait.

**Où placer la tête, sachant qu'elle ne peut pas être sur l'axe.** Le décalage minimal est
la demi-largeur de la tête. Superposer les deux caméras verticalement plutôt que côte à côte
réduit cette largeur et ramène le décalage vers 60 mm.

| Décalage de l'optique | Coin le plus éloigné | Tag de référence le plus éloigné |
|---|---|---|
| 60 mm, caméras superposées | 2819 mm | 1698 mm |
| 120 mm, caméras côte à côte | 2853 mm | 1732 mm |
| 225 mm, centre de la demi-zone | 2914 mm | 1796 mm |

**Les trois placements passent**, la limite de lisibilité d'un tag de 100 mm en mode binné
étant de 1820 mm — voir 3.4. La v0.1 laissait entendre que le décalage de 225 mm faisait
basculer le tag le plus lointain du mauvais côté ; c'était faux, l'analyse reposait sur des
positions de tags estimées à l'œil et non sur le plan. Le placement de la tête est donc un
choix mécanique, pas un choix optique.

Le décalage s'inverse selon la couleur d'équipe. Les deux caméras sont donc réglées
symétriquement et **rien n'est réajusté entre deux matchs** ; la calibration continue absorbe
la différence.

**Avec deux caméras dont les axes visent (±750, 1000) :**

| Point | Angle hors axe |
|---|---|
| Coin lointain du côté couvert | 18,3° |
| Centre de la table | 25,3° |
| Coin proche du côté couvert | 39,2° |
| Zone de recouvrement, bord lointain | 35,5° |
| Pied du mât | 45,5° |

Tout tombe sous 46°, ce qui laisse de la marge sur les ±51° horizontaux. La contrainte
devient verticale : l'écart d'élévation entre le pied du mât et le coin lointain est de
64°, à comparer aux 70° de champ vertical d'une Camera Module 3 Wide en 16:9. **Cela passe,
mais avec seulement 6° de marge**, donc l'orientation en tangage des deux caméras est un
réglage critique, à faire une fois et à bloquer mécaniquement.

---

## 3. Dimensionnement optique

### 3.1 Ce qu'il faut résoudre

Deux cibles très différentes, et c'est ce qui structure toute la chaîne de vision.

**La tranche colorée du marqueur.** Carré de 100 mm de côté, tranche de 20 mm à la couleur
de l'équipe (G.6). C'est une tache, on en cherche le centroïde.

**Le tag ArUco 4 × 4 sur la face supérieure.** 70 mm de côté, soit six cellules en comptant
l'anneau de bordure, donc 11,7 mm par cellule. Il est sur une face horizontale, donc
**raccourci par le sinus de l'élévation** : au coin lointain, à 26,2° d'élévation, les
70 mm n'en font plus que 31 dans la direction de la fuite.

### 3.2 Résolution au sol, au point le plus défavorable

Portée 2786 mm, élévation 26,2°. « Transversale » désigne la direction perpendiculaire à la
ligne de visée, « radiale » la direction de la fuite, dégradée par l'incidence rasante.

| Configuration | Sortie / champ | GSD transv. | GSD radial | Marqueur 100 mm | px par cellule ArUco |
|---|---|---|---|---|---|
| 1 × CM3 Wide, pleine résolution | 4608 px / 102° | 1,1 mm | 2,4 mm | 93 px | 2,1 |
| 1 × CM3 Wide, mode binné | 2304 px / 102° | 2,2 mm | 4,9 mm | 46 px | 1,1 |
| **2 × CM3 Wide, pleine résolution** | 4608 px / 102° | **1,1 mm** | **2,4 mm** | **93 px** | **2,1** |
| **2 × CM3 Wide, mode binné** | 2304 px / 102° | **2,2 mm** | **4,9 mm** | **46 px** | **1,1** |
| 2 × CM3 Wide, sortie 1536 | 1536 px / 102° | 3,2 mm | 7,3 mm | 31 px | 0,7 |
| 2 × Global Shutter, objectif 90° | 1456 px / 90° | 3,0 mm | 6,8 mm | 33 px | 0,8 |
| 3 × Global Shutter, objectif 60° | 1456 px / 60° | 2,0 mm | 4,5 mm | 50 px | 1,1 |

Les deux premières lignes sont là pour comparaison seulement : leur couverture est
insuffisante, comme montré en section 2.

Trois conclusions se lisent directement dans ce tableau.

**Le suivi de la tache colorée est confortable partout.** Même en mode binné, le marqueur
fait 46 pixels de large au point le plus défavorable. Un centroïde sur une tache de cette
taille s'estime largement au sous-pixel, ce qui donne une erreur de position de l'ordre de
2 à 5 mm en transversal et de 5 à 10 mm en radial. À comparer au seuil de rejet de 15 cm du
test d'innovation dans le CDC logiciel : on a plus d'un ordre de grandeur de marge.

**Le tag ArUco n'est lisible nulle part au coin lointain.** Une cellule par pixel, ou deux
au mieux, alors qu'un détecteur en demande trois à quatre au minimum. Le suivi couleur n'est
donc pas une commodité, c'est la seule chose qui fonctionne sur la moitié lointaine de la
table.

**Le mode global shutter coûte plus qu'il ne rapporte.** Pour couvrir le champ nécessaire,
il faut un objectif d'environ 90° par caméra, et 1456 pixels étalés sur 90° donnent une
résolution inférieure à celle de la Camera Module 3 Wide en mode binné. Il faudrait trois
caméras global shutter pour égaler deux Camera Module 3, pour un coût triplé et un
calculateur qui n'a que deux entrées CSI.

### 3.3 Jusqu'où l'ArUco reste utilisable

Le tag n'est pas inutile pour autant : il est parfaitement lisible près du mât, et il porte
une information que la couleur n'a pas — l'identité exacte et l'orientation.

Rayon de lisibilité autour du mât, avec deux Camera Module 3 Wide :

| Sortie | Seuil de 3 px/cellule | Seuil de 4 px/cellule |
|---|---|---|
| Mode binné 2304 px | 1,54 m | 1,30 m |
| Pleine résolution 4608 px | 2,15 m | 1,89 m |

**[PROPOSÉ]** L'ArUco est donc exploité en complément opportuniste, sur la moitié proche de
la table, comme vérification d'identité et source d'orientation. Il n'est jamais la source
principale.

### 3.4 Les tags de calibration posent le même problème

Point que l'analyse a fait apparaître et qui n'était pas prévu. Les quatre tags ArUco fixes
de la table sont dans le plan de jeu, donc à 1670 mm sous la caméra, et vus en incidence
rasante eux aussi.

Avec un tag de 100 mm en mode binné, la lisibilité s'arrête vers 1,8 m du mât. Avec un tag
de 70 mm, vers 1,4 m. Or les tags sont répartis sur toute la table.

Si les tags lointains ne sont pas détectés, la calibration se fait sur deux tags voisins,
avec une géométrie dégénérée et une pose de caméra très mal conditionnée. C'est un mode de
panne silencieux : le calcul converge, le résultat est faux.

**[ACTÉ] Deux flux de résolution différente.** La chaîne de vision exploite deux sorties de
la même caméra, ce que `libcamera` sait faire nativement :

| Flux | Résolution | Cadence | Usage |
|---|---|---|---|
| Suivi | Binné, 2304 px | 20 à 30 Hz | Détection couleur, position des robots |
| Calibration | Pleine résolution, 4608 px | 2 à 5 Hz | Détection des tags de table, ré-estimation de pose |

La caméra ne bouge que par vibration : quelques hertz suffisent largement pour la
calibration, et le budget de calcul est préservé pour le suivi.

**Valeurs confirmées sur le plan.** Les quatre tags font **100 mm de côté** et sont placés
à **±900 mm et ±400 mm du centre de la table**. Leurs distances au dispositif vont de
1032 à 1796 mm selon le placement de la tête.

| Résolution | Portée d'un tag de 100 mm posé sur la table |
|---|---|
| Mode binné 2304 px | 1,82 m |
| Pleine résolution 4608 px | 2,62 m |

Le tag le plus éloigné est donc lisible en mode binné dans tous les cas de figure, avec 24 à
122 mm de marge selon le placement. C'est peu, et cela confirme le maintien du flux pleine
résolution pour la calibration : la marge y passe à plus de 800 mm.

Le recadrage sur régions d'intérêt autour des positions attendues reste la parade si le
budget de calcul devient contraignant. Il ne coûte presque rien une fois la situation
approximativement connue.

---

## 4. Caméras

### 4.1 Choix retenu

**[PROPOSÉ] Deux Raspberry Pi Camera Module 3 Wide**, capteur IMX708, 4608 × 2592, champ
horizontal de 102°, autofocus à détection de phase, environ 35 € pièce.

Motifs, dans l'ordre de poids :

Le champ de 102° est ce qui rend la couverture possible à deux caméras. C'est la contrainte
dure de la section 2.

Le Raspberry Pi 5 possède **deux connecteurs CSI natifs à quatre voies**, sans multiplexeur
ni carte d'extension. Deux caméras, deux ports, `libcamera` gère les deux.

L'équipe a déjà réglé le problème `libcamera` sur le robot principal — compilation du fork
Raspberry Pi pour les gestionnaires de pipeline `rpi/vc4` et `rpi/pisp`, sans quoi l'IMX708
n'est pas reconnu sous Ubuntu. Ce travail se réutilise à l'identique. C'est plusieurs
soirées économisées.

### 4.2 Réglages imposés

**[ACTÉ]** Trois réglages doivent être verrouillés en mode manuel, et c'est la source
d'échec la plus probable de toute la chaîne :

**Balance des blancs verrouillée.** Une balance automatique déplace la teinte d'une image à
l'autre selon ce qui entre dans le champ. Un robot qui traverse une zone de tapis coloré
peut faire dériver la teinte de référence, et le seuillage couleur décroche.

**Exposition et gain verrouillés.** Même raison, et l'exposition contrôle en plus le flou
de bougé.

**Mise au point verrouillée.** L'autofocus est un défaut ici : il chercherait en permanence,
et la position du plan de netteté modifie légèrement la focale, donc la calibration. La mise
au point se fait une fois sur la table et se fige.

**Flou de bougé.** Un robot à 1 m/s parcourt 1 mm par milliseconde. À 5 ms de pose, le flou
vaut 5 mm, soit 2 à 3 pixels au coin lointain : sans effet sur un centroïde de tache. En
salle de compétition, largement éclairée, une pose de 2 à 5 ms est atteignable. Chiffres
estimés, à vérifier sur place.

### 4.3 L'obturateur déroulant et l'horodatage

C'est le vrai défaut de l'IMX708 pour cet usage, et il n'est pas dans la netteté.

Un capteur à obturateur déroulant lit ses lignes séquentiellement. Deux marqueurs situés en
haut et en bas de l'image n'ont donc pas été capturés au même instant, l'écart pouvant
atteindre la durée de lecture complète, de l'ordre de quelques dizaines de millisecondes.
Attribuer un horodatage unique à toute l'image introduit une erreur de position pouvant
atteindre 2 à 3 cm sur un robot à 1 m/s.

La déformation du marqueur lui-même, elle, est négligeable : il n'occupe que quelques
dizaines de lignes.

**[ACTÉ] Correction par ligne.** L'horodatage transmis pour chaque détection est celui de
l'image corrigé de la position verticale du marqueur, la durée de lecture étant connue et
constante. Une multiplication, aucune contrainte matérielle.

*Option écartée :* la caméra global shutter, qui supprimerait le problème à la racine mais
coûte trop de résolution pour le champ requis (3.2). Si la correction par ligne s'avérait
insuffisante en essai, c'est la porte de sortie, au prix d'une troisième caméra.

### 4.4 Détection de couleur

Les références sont données par l'annexe J.3 du règlement : bleu signalisation RAL 5017,
jaune signalisation RAL 1023. Le règlement prévient que les teintes varient selon
l'impression du tapis, donc les valeurs ne peuvent pas être codées en dur.

**[PROPOSÉ] Calibration des teintes pendant la phase de préparation.** Les deux robots sont
alors à des positions de départ connues, immobiles, sous l'éclairage réel de la salle. Le
mât échantillonne les teintes à ces positions et fixe ses fenêtres de seuillage. C'est une
calibration gratuite, faite au bon endroit et au bon moment, et elle absorbe à la fois la
variation d'impression et celle de l'éclairage.

**Rejet des fausses détections**, dans cet ordre de coût croissant :

1. La projection au sol tombe hors du rectangle de jeu — écarte le public et le décor.
2. La surface en pixels est incompatible avec la portée attendue.
3. La cohérence temporelle : une détection qui saute de plus d'un déplacement plausible
   entre deux images est rejetée.

### 4.5 Comment on obtient une position à partir d'une tache

Rappel de la construction, parce que c'est ce qui décide de la faisabilité.

La pose de la caméra est connue par la calibration continue (section 5). Le centroïde de la
tache donne une direction d'observation, c'est-à-dire un rayon partant du centre optique. Le
marqueur est à une hauteur connue. **L'intersection de ce rayon avec le plan horizontal à
cette hauteur donne directement les coordonnées sur la table.** Aucune inconnue résiduelle.

Ce qu'on perd par rapport au tag, c'est l'orientation. Elle n'est pas nécessaire : pour
l'adversaire, seule la position est exploitée ; pour notre robot, le cap vient de
l'odométrie, bien meilleure que ce qu'une vision rasante donnerait.

**Hauteur du marqueur : deux valeurs. [ACTÉ]** Le marqueur repose sur le support de balise à
430 ± 5 mm, ou sur une balise embarquée si l'adversaire en pose une, soit 510 mm. Avec
l'épaisseur de 20 mm, le centre de la tranche est à 440 mm ou à 520 mm. **C'est un paramètre
par robot et par match**, saisi pendant la préparation. Une erreur de 80 mm sur cette
hauteur se traduit par plus de 15 cm d'erreur de position au coin lointain — assez pour être
rejetée par le test d'innovation, donc assez pour rendre le mât inutile sans qu'il le dise.

---

## 5. Calibration continue

Reprise et précision de la section 10.2 du CDC logiciel.

La pose de la caméra est ré-estimée en permanence par résolution `solvePnP` sur les quatre
tags de table, dont les coordonnées sont connues. Deux raisons distinctes l'imposent : les
trois minutes de préparation excluent toute procédure manuelle, et G.4 annonce
explicitement que le dispositif subit les vibrations dues aux déplacements des robots.

| Tags détectés | Comportement |
|---|---|
| 4 | Ré-estimation nominale |
| 3 | Ré-estimation dégradée, confiance abaissée |
| 2 ou moins | Pose figée sur la dernière estimation valide, confiance dégradée |
| Moins de 3 pendant plus de N secondes | Arrêt de l'émission des corrections de pose |

Chaque tag est rejeté sur son erreur de reprojection, sans quoi une détection partielle ou
un reflet contamine la pose entière.

**Nuance importante sur le filtrage temporel.** Le CDC logiciel demandait un filtre lent
pour qu'une image isolée ne déplace pas la calibration d'un coup. C'est vrai contre le bruit,
mais faux contre les vibrations : un mât de 1,6 m sur une base de 320 mm de profondeur
oscille à quelques dizaines de hertz au mieux, et si le filtre est plus lent que cette
oscillation, il moyenne une pose que la caméra n'a jamais eue. Les fréquences propres
calculées sont en 8.3.

La règle correcte : **rejeter les valeurs aberrantes en amont, filtrer peu en aval.** La
fréquence de coupure du filtre doit rester au-dessus du premier mode propre de la structure,
à mesurer une fois le mât monté. Ce qui donne au passage un intérêt inattendu à la
calibration continue : elle rend la rigidité mécanique moins critique, puisqu'elle suit
l'oscillation au lieu de la subir.

### 5.1 Compenser les oscillations par un capteur inertiel [OUVERT]

La calibration tourne à 2–5 Hz, alors que les configurations calculées en 8.3 placent le
premier mode entre 16 et 51 Hz pour les tripodes, et vers 7 Hz pour l'option PVC à jambe
unique. **La calibration ne peut donc pas suivre l'oscillation dans aucun de ces cas**, et
chaque image de suivi est projetée avec une situation légèrement fausse. C'est le seul trou
identifié dans la chaîne d'observation.

**Un accéléromètre seul ne le comble pas.** Sur une structure qui oscille, il mesure à la
fois la projection de la pesanteur, qui dépend de l'inclinaison, et l'accélération
tangentielle du mouvement. Pour une oscillation pendulaire, les deux se compensent
partiellement et l'inclinaison n'est pas observable proprement.

**Un gyromètre le comble.** Il mesure la vitesse angulaire, qu'on intègre entre deux mises à
jour de calibration ; la vision remet le biais à zéro à chaque mise à jour. Filtre
complémentaire classique : basse fréquence par les repères, haute fréquence par l'inertiel.

Budget d'erreur de 0,05° entre deux calibrations, soit une demi-seconde :

| Contribution | Composant d'entrée de gamme | Composant courant |
|---|---|---|
| Bruit d'intégration | 0,021° | 0,003° |
| Dérive de biais | 0,004° | 0,001° |

Le capteur n'est donc pas le facteur limitant : **la synchronisation l'est**. Pour corriger
une image, il faut l'inclinaison à l'instant exact de son exposition. À 0,2° d'amplitude et
5 Hz, la vitesse angulaire crête atteint 6,3 °/s, et 5 ms d'erreur de datation coûtent
0,03°, soit 1,5 mm au sol.

Deux limites à retenir. Le gyromètre corrige la **rotation, pas la translation** : pour un
premier mode de console, 0,2° d'inclinaison s'accompagnent d'environ 3,7 mm de déplacement
de la tête, qui contribuent 3,7 mm d'erreur contre 9,8 mm pour la rotation. On retire donc
environ 70 % de l'erreur d'oscillation, pas la totalité. Et le capteur doit être solidaire
du support des caméras, pas du boîtier.

Bénéfice secondaire qui vaut à lui seul le composant : le gyromètre voit un choc
instantanément, ce qui permet d'invalider les positions transmises et de forcer une
recalibration sans attendre que la vision s'en aperçoive. C'est le moyen le plus simple de
tenir MAT-MXS-07.

**Ce que cette orientation changerait ailleurs :** un capteur à une dizaine d'euros rend
acceptable une structure plus souple, donc plus légère. Comme le budget de masse est le
point dur (8.3), c'est peut-être ce qui décidera entre les deux options de structure.

---

## 6. Réseau et serveur PAMI

### 6.1 Pourquoi le réseau est ici

F.6 interdit à tout système de communiquer avec un système extérieur à la table pendant un
match. Un point d'accès posé au stand rendrait donc l'ensemble non conforme. La plateforme
de calcul étant sur la table, y placer le point d'accès contient tout le réseau de l'équipe
dans le périmètre autorisé.

F.6 autorise par ailleurs explicitement le dispositif de calcul à porter un cordon de
démarrage, ce qui règle la question de la tirette des PAMI.

### 6.2 Point d'accès : séparé, pas celui du Raspberry Pi

**[PROPOSÉ]** Un point d'accès Wi-Fi 5 GHz dédié, du type routeur de voyage, plutôt que la
radio intégrée du Raspberry Pi en mode point d'accès.

Motifs : la radio intégrée partage son antenne et son processeur avec la vision, ce qui est
exactement le couplage qu'on cherche à éviter entre une fonction prioritaire, le réseau, et
une fonction secondaire, la vision. Et l'antenne intégrée d'une carte est faible dans une
salle saturée, ce que le règlement annonce en F.5.

*Repli :* si l'encombrement ou la consommation posent problème, la radio du Raspberry Pi en
mode point d'accès reste une solution de secours acceptable, à condition de vérifier la
charge processeur en même temps que la vision.

### 6.3 Séparation des processus

**[ACTÉ]** Le serveur PAMI et la chaîne de vision sont **deux processus distincts**, avec
des politiques de redémarrage distinctes, sur le modèle des couches du robot principal.

La règle : **un plantage de la vision ne doit jamais faire tomber le serveur PAMI.**
L'inverse est acceptable. C'est la transposition directe du principe LOG-P3 du CDC logiciel, et
c'est ce qui permet de jouer un match avec des PAMI et sans observation.

### 6.4 Interface vers le robot

Le mât n'est **jamais un participant DDS** et n'écrit **jamais** sur le bus CAN. Il émet
vers la passerelle applicative de la couche 2 du robot.

Transport identique à celui des PAMI : **UDP unicast, numéro de séquence, chaque message
émis trois fois espacé de vingt millisecondes**, le récepteur ignorant les doublons.

Contenu d'un message de pose : identifiant du robot observé, position, horodatage dans la
base de temps du mât, indicateur de confiance, nombre de tags de calibration utilisés.

**Base de temps.** Le mât horodate dans sa propre base ; le robot estime le décalage par
filtre du minimum sur les allers-retours, exactement comme pour la carte moteurs. Le code
d'estimation développé pour le CAN se réutilise tel quel.

---

## 7. Calculateur

**[PROPOSÉ] Raspberry Pi 5, 8 Go.**

| Candidat | Pour | Contre |
|---|---|---|
| **Raspberry Pi 5** | Deux entrées CSI natives à quatre voies ; `libcamera` déjà maîtrisé par l'équipe sur le robot ; documentation et durée de vie ; même écosystème que le robot, donc mêmes outils et mêmes réflexes de diagnostic | Processeur modeste pour un détecteur neuronal |
| Radxa Rock 5B, Orange Pi 5 | Processeur RK3588 nettement plus puissant, accélérateur neuronal intégré | Support MIPI caméra réputé pénible, chaîne logicielle moins stable, aucune réutilisation de l'expérience acquise |
| NVIDIA Jetson Orin Nano | Le meilleur pour de l'inférence temps réel | Deux à quatre fois le prix, consommation supérieure, hors sujet pour du suivi de tache colorée |

Le raisonnement tient en une ligne : la chaîne de traitement retenue est du seuillage
couleur et de la détection de marqueurs, pas de l'inférence neuronale. Sur ce travail, le
Raspberry Pi 5 est largement suffisant, et **le seul critère qui discrimine réellement est
le double port CSI natif**, que les concurrents n'offrent pas aussi simplement.

*Si l'on voulait un jour un détecteur neuronal*, un module Hailo-8L sur le port PCIe du
Raspberry Pi 5 coûte environ 70 € et résout la question, à condition de ne pas avoir occupé
ce port par un SSD. À garder en tête au moment de choisir le stockage.

**Stockage :** carte SD de bonne qualité suffisante. Le mât n'écrit pas de journaux
volumineux, et un NVMe occuperait le port PCIe. À revoir si l'enregistrement vidéo des
matchs devient un besoin.

**Refroidissement :** ventilateur actif obligatoire. Un boîtier fermé au sommet d'un mât,
sous les projecteurs d'un hall, avec deux flux caméra en permanence, va throttler sans
dissipation active.

### 7.1 Emplacement du calculateur sur la structure [ACTÉ]

**Le calculateur monte en tête, avec les caméras.**

Motif : les nappes de liaison caméra existent en 200, 300 et 500 mm ; au-delà, la liaison
n'est plus fiable et il faudrait des convertisseurs d'extension, environ 30 € par caméra
avec un point de panne supplémentaire. Sur 1,6 m, un calculateur au pied est exclu.

Répartition retenue :

| Emplacement | Contenu |
|---|---|
| Tête | Deux caméras, calculateur, refroidissement, convertisseur abaisseur, point d'accès |
| Pied | Batterie, interrupteur général, cordon de départ des PAMI, voyants d'état, panneau de connexion |
| Entre les deux | Alimentation, contact de tirette, liaison écran, liaison clavier, voyants |

**Ne pas faire monter du 5 V.** Sur deux mètres de conducteur de 0,5 mm², 4 A produisent
0,55 V de chute, ce qu'un calculateur ne tolère pas. On fait monter la tension batterie et
le convertisseur est en tête : le courant tombe à 1,3 A et la chute devient négligeable.

**Écran de mise au point.** Conservé comme confort, mais au pied : un cordon vidéo court et
soulagé mécaniquement branché à demeure sur le calculateur, puis une liaison de deux mètres
qui descend vers une prise en pied, accompagnée d'une rallonge pour un clavier. Compte 150 à
200 g dans le même faisceau. **On ne branche jamais rien au niveau de la tête** : le
connecteur vidéo d'un calculateur compact est fragile et il sera à 1,6 m dans un boîtier.

L'état courant reste lisible par voyants au pied, sans écran, pour tenir MAT-MXE-03. L'écran
sert au stand, jamais en match.

*Contrepartie assumée :* la masse en tête abaisse la fréquence propre d'environ 30 % par
rapport à un calculateur au pied. Voir 8.3 et 5.1.

---

## 8. Alimentation et mécanique

### 8.1 Batterie

**[PROPOSÉ] Batterie d'outillage électroportatif**, avec adaptateur de prise de courant du
fabricant et convertisseur abaisseur à large plage d'entrée.

Bilan de consommation, estimé :

| Poste | Consommation |
|---|---|
| Raspberry Pi 5, deux caméras en charge | 8 à 12 W |
| Point d'accès Wi-Fi | 3 à 6 W |
| Pertes du convertisseur | ~10 % |
| **Total** | **15 à 20 W** |

| Pack | Énergie | Autonomie | Masse |
|---|---|---|---|
| 12 V nominal, 2 Ah | ~22 Wh | ~1 h 15 | ~0,35 kg |
| 12 V nominal, 4 Ah | ~43 Wh | ~2 h 30 | ~0,5 kg |
| 18 V nominal, 5 Ah | ~90 Wh | ~5 h | ~0,7 à 1,1 kg |

Un match dure trois minutes de préparation et cent secondes de jeu. Même le plus petit pack
tient une demi-journée de compétition si le mât est éteint entre les matchs, et le plus
gros la tient allumé. Comme la masse n'est pas la contrainte serrée de ce projet — voir 8.3
— le pack de 4 Ah ou plus est le bon choix.

**Le convertisseur doit accepter 9 à 21 V**, pour couvrir indifféremment un pack 12 V
nominal, qui descend à 9 V en fin de décharge, et un pack 18 V nominal, qui monte à 21 V à
pleine charge. Sortie 5 V, 5 A pour un Raspberry Pi 5 avec périphériques.

### 8.2 Point réglementaire sur la batterie — à confirmer auprès de l'arbitrage

F.4.b impose aux batteries au lithium un chargeur présenté à l'homologation et un sac
ignifuge permanent, **sauf** pour les batteries à BMS intégré par le fabricant et enveloppe
solide. La liste d'exemples cite explicitement le **matériel électroportatif**. Une batterie
de perceuse tombe donc dans l'exception, ce qui est un vrai avantage sur une LiPo nue.

La réserve : le texte ajoute « non démontées et **utilisées pour l'usage prévu par le
fabricant** ». Alimenter un ordinateur monocarte n'est pas strictement l'usage prévu.

**Parade retenue :** utiliser un **adaptateur de prise de courant vendu par le fabricant de
la batterie**, qui constitue un usage prévu et documenté. Et poser la question à
`referee@eurobot.org`, dont le règlement précise que les réponses sont officielles et
opposables. Le coût de la question est nul, celui d'un refus à l'homologation ne l'est pas.

### 8.3 Structure — deux options maintenues en parallèle

**Correction par rapport à la v0.1.** Elle annonçait 2 à 2,9 kg de masse totale et concluait
que la masse n'était pas la contrainte. C'était faux : la platine, les jambes de force et le
faisceau n'étaient pas comptés. **Avec un bilan complet, la masse est bien la contrainte
dimensionnante**, et c'est elle qui départage les options.

#### Critère de raideur

Une inclinaison du dispositif se traduit au sol par une erreur proportionnelle à la portée :

| Inclinaison | Erreur au point le plus éloigné |
|---|---|
| 0,05° | 2,4 mm |
| 0,1° | 4,9 mm |
| 0,2° | 9,8 mm |
| 0,5° | 24 mm |
| 1° | 49 mm |

Budget retenu : rester sous 0,2° d'oscillation dynamique. Et la fréquence propre doit rester
nettement au-dessus de la cadence de calibration, sous peine que l'oscillation ne soit pas
suivie — sauf à ajouter le capteur inertiel de 5.1.

Précision géométrique utile au contreventement : un basculement d'avant en arrière déplace le
point projeté dans la direction radiale, amplifiée d'un facteur 2,3 par l'incidence rasante,
alors qu'un basculement latéral déplace transversalement, sans amplification.

#### Ce que la jambe de force apporte, et ce qu'elle laisse

Modèle de portique plan à trois éléments poutre, jambe ancrée à 1400 mm et reculée de
420 mm, tête de 0,45 kg. **[ACTÉ] La jambe de force est présente dans les deux options.**

| Option | Raideur avant-arrière | Raideur latérale | Gain de la jambe |
|---|---|---|---|
| PVC Ø100 × 3 | 32,5 N/mm | 2,4 N/mm | × 13,7 |
| Aluminium Ø50 × 2 | 163,7 N/mm | 4,5 N/mm | × 36,7 |

Résultat contre-intuitif : **la jambe sur-résout une direction et laisse l'autre.** Le
rapport entre les deux plans atteint 36 en aluminium, très au-delà du facteur 2,3 de
sensibilité. L'axe faible bascule donc vers le latéral, qui n'est pas contreventé.

D'où le tripode : une jambe arrière à 420 mm et deux jambes latérales à ±200 mm. Le latéral
passe alors de 11 à 51 Hz en aluminium. C'est la bonne forme, mais elle coûte de la masse.

#### Bilan de masse et de budget

| Configuration | Masse totale | Coût structure | f avant-arrière | f latéral |
|---|---|---|---|---|
| PVC Ø100, tripode | 6,49 kg | 128 € | 21 Hz | 18 Hz |
| PVC Ø80, tripode | 6,07 kg | 126 € | 20 Hz | 16 Hz |
| Aluminium Ø50, tripode | 5,83 kg | 185 € | 60 Hz | 51 Hz |
| **Aluminium Ø40, jambes Ø20** | **4,89 kg** | 170 € | 50 Hz | 45 Hz |

Une seule configuration passe sous les 5 kg réglementaires, et de justesse. La platine pèse
à elle seule 0,9 à 1 kg même allégée, et les trois jambes autant que le mât.

**Les deux options restent ouvertes**, avec des profils différents :

**Option PVC.** Trois fois moins raide que l'aluminium à section égale — module de 3000 MPa
contre 70000 — donc il faut du gros diamètre, donc de la masse. Elle ne tient le budget
qu'avec la seule jambe arrière et un tube Ø80, au prix d'un plan latéral vers 7 Hz. En
contrepartie, son **amortissement matériau est dix à vingt fois supérieur** : ce qui gêne
n'est pas la fréquence en soi mais la durée pendant laquelle la structure vibre après chaque
choc de robot, et le PVC sonne bien moins longtemps. Le passage des câbles à l'intérieur du
tube est immédiat, et le coût est trois fois moindre.

**Option aluminium.** Seule à tenir le tripode complet dans le budget de masse. Fréquences
confortables, marge de 110 g seulement sur les 5 kg.

Le capteur inertiel de 5.1 est ce qui peut rouvrir l'option PVC, en rendant acceptable une
structure plus souple.

#### Ce qui reste à faire avant de choisir

Un modèle paramétrique accompagne ce document et permet de rejouer le calcul sur des
références réelles de tubes. Ses limites sont écrites en tête : liaisons supposées
parfaitement rigides, alors qu'une bride ou un collier fait perdre 20 à 40 %. **Les valeurs
sont un classement, pas des mesures**, et il faut compter un tiers de moins sur le réel.

Trois mesures manquent : la masse d'une platine réelle, qui est le poste sous-estimé et vaut
autant que le mât ; les références de tubes effectivement approvisionnables ; et la fréquence
propre de la structure une fois montée.

#### Points mécaniques indépendants de l'option

**Deux tiges M8** dans la rainure de 100 mm, espacées de 60 à 70 mm, la seconde bloquant la
rotation autour de la verticale. La platine repose à plat et reprend le moment de
renversement par appui.

**Masse lourde en bas.** Batterie et accessoires au pied, seuls les caméras, le calculateur
et son alimentation en tête.

**L'orientation des caméras** est un réglage critique, avec 6° de marge en tangage
(section 2). Elle se règle une fois et se bloque mécaniquement, avec repère gravé pour
pouvoir la rétablir après un choc.

**Voisinage adverse.** Le dispositif adverse est sur la moitié mitoyenne. Prévoir qu'il
puisse être plus haut, plus large dans sa moitié, et qu'il émette aussi en Wi-Fi.
---

## 9. Architecture logicielle

### 9.1 Découpage

Deux processus indépendants, conformément à 6.3 :

| Processus | Contenu | Priorité |
|---|---|---|
| `pami-server` | Point d'accès applicatif, enregistrement des PAMI, attribution des numéros, tirette, diffusion de la date de départ, page de supervision, journaux | Vitale |
| `vision` | Deux flux caméra, calibration continue, détection couleur, détection ArUco opportuniste, émission des poses | Secondaire, peut mourir |

`vision` publie sa santé vers `pami-server`, qui l'affiche sur la page de supervision. Le
robot voit l'état des deux dans son propre onglet d'état système.

### 9.2 Chaîne de traitement de `vision`

Par caméra, à chaque image du flux de suivi : conversion en espace couleur adapté, seuillage
sur les fenêtres de teinte calibrées, extraction des composantes connexes, filtrage par
surface, calcul du centroïde au sous-pixel, correction de l'horodatage par ligne (4.3),
projection sur le plan à la hauteur du marqueur (4.5), rejet des projections hors table.

En parallèle, à basse cadence sur le flux pleine résolution : détection des tags de table,
rejet par erreur de reprojection, `solvePnP`, mise à jour de la pose de caméra.

Fusion des deux caméras dans la zone de recouvrement : la détection retenue est celle dont
l'angle hors axe est le plus faible, ce qui privilégie mécaniquement la caméra la mieux
placée sans avoir à pondérer finement.

### 9.3 Modes dégradés

| Panne | Conséquence |
|---|---|
| Une caméra | La moitié de table correspondante n'est plus observée, l'autre continue |
| Les deux caméras, ou `vision` | Le mât devient un point d'accès et un serveur PAMI. Les PAMI partent, le robot joue sans correction de pose |
| Moins de trois tags de calibration | Voir section 5 |
| `pami-server` | Les PAMI basculent sur leur repli, niveau 2 ou 3 selon qu'ils ont reçu la date de départ |
| Batterie | Perte totale du mât. Le robot joue son match, les PAMI partent sur tirette locale |

**Exigence structurante, rappelée du CDC logiciel : le mât n'a aucun état persistant dont le
robot dépend.**

---

## 10. Interface avec le reste du système

| Vers | Contenu | Transport |
|---|---|---|
| Robot principal | Pose observée, confiance, horodatage | UDP unicast répété, 20 à 30 Hz |
| Robot principal | Santé du mât, nombre de tags, état des caméras | UDP unicast, 1 Hz |
| PAMI | Date de départ, numéro attribué, état du monde relayé | UDP unicast répété |
| Opérateur | Page de supervision, en mode essai uniquement | HTTP sur le réseau de la table |
| Robot principal | Couleur d'équipe, hauteur de marqueur adverse | Paramétré à la préparation, dans les deux sens à décider |

Le dernier point est [OUVERT] : la couleur et la hauteur de marqueur peuvent être saisies
sur l'IHM du robot puis transmises au mât, ou saisies sur la page du mât. La première option
évite une seconde interface à manipuler pendant les trois minutes ; la seconde évite une
dépendance du mât au robot. À trancher avec la procédure de préparation.

---

## 11. Mise en place, part du mât

Rappel du cadre : trois minutes pour toute l'équipe, dépassement à 50 points, récidive au
forfait. Deux personnes, l'une au robot, l'autre au mât puis aux PAMI.

Séquence côté mât, telle qu'envisagée :

1. Poser le mât sur sa moitié de plateforme, engager la tige M8 dans la rainure.
2. Serrer l'écrou papillon.
3. Lancer la calibration, qui doit être **automatique et se terminer en quelques secondes**.
4. Passer aux PAMI.

Tout le reste — mise sous tension du calculateur, du point d'accès, du serveur, connexion
des PAMI — se fait **en zone de préparation, avant de monter sur la table**. C'est la seule
façon de tenir le budget de temps.

Exigences qui en découlent, et ce sont elles qui pilotent le développement :

- Le mât **démarre en autonomie** et est opérationnel avant d'être posé. Aucun câble, aucun
  clavier, aucune manipulation sur la table.
- Les PAMI sont **déjà connectés au serveur** quand ils sortent de la caisse.
- La calibration **ne demande aucune action** : elle se lance seule dès que les tags sont
  vus et signale son état par un indicateur visible depuis la table.
- Aucune étape ne doit dépasser vingt secondes.

---

## 12. Planning et budget

### 12.1 Ordre de développement

L'ordre découle de la priorité des fonctions énoncée en partie I, section 1.

| Étape | Contenu | Homologable |
|---|---|---|
| 1 | Structure, fixation, alimentation, calculateur, point d'accès | Oui |
| 2 | Serveur PAMI, tirette, enregistrement, date de départ | Oui, et suffisant pour jouer avec des PAMI |
| 3 | Calibration continue sur les tags de table | Oui |
| 4 | Suivi couleur, émission des poses | Oui |
| 5 | ArUco opportuniste, position adverse, obstacles mobiles | Confort |

**Les étapes 1 et 2 doivent être terminées bien avant les étapes suivantes**, parce qu'elles
libèrent le sous-système PAMI. Un mât sans caméra qui porte le réseau et le serveur est
utile ; une caméra sans réseau ne l'est pas.

### 12.2 Budget estimé

| Poste | Coût |
|---|---|
| Raspberry Pi 5 8 Go, carte SD, refroidissement actif | 100 à 120 € |
| 2 × Camera Module 3 Wide | 70 à 80 € |
| 2 × nappes CSI adaptées 15 vers 22 broches | 10 à 15 € |
| Point d'accès Wi-Fi 5 GHz compact | 30 à 50 € |
| Convertisseur abaisseur large plage, 5 V 5 A | 15 à 25 € |
| Adaptateur de batterie d'outillage | 20 à 40 € |
| Structure : tubes, jambes de force, platine, brides, deux tiges M8 | 126 à 185 € selon l'option (8.3) |
| **Sous-total, postes obligatoires** | **371 à 515 €** |
| Batterie, si non disponible | 40 à 80 € |
| Capteur inertiel, si retenu (5.1) | 5 à 15 € |
| **Total, tout compris** | **415 à 610 €** |

Le CDC logiciel provisionnait initialement 150 à 300 €. **L'estimation a été relevée à
415–610 € dans le CDC logiciel, sections 1.4 et 17.8**, l'écart venant de la seconde caméra,
du point d'accès dédié, de l'alimentation autonome et de la structure, qui n'étaient pas
comptés. Les totaux ci-dessus sont la somme exacte des lignes ; la borne haute de 550 €
annoncée précédemment était fausse.

---

## 13. Points ouverts et mesures à faire

| # | Point | Bloque | Échéance |
|---|---|---|---|
| 1 | **Structure : PVC ou aluminium**, et capteur inertiel ou non — les deux questions sont liées (5.1, 8.3) | La conception mécanique entière | Chemin critique |
| 2 | Masse d'une platine réelle | Le bilan de masse, qui n'a que **110 g** de marge sur les 5 kg | Avant de choisir la structure |
| 3 | Question à `referee@eurobot.org` sur la batterie d'outillage (8.2) | L'achat de l'adaptateur | Immédiat, la réponse prend du temps |
| 4 | Éclairage réel de la salle, temps de pose atteignable | Le choix obturateur déroulant ou global (4.3) | Premier essai en salle |
| 5 | Fréquence propre de la structure une fois montée | Le réglage du filtre de calibration (5) | Après montage |
| 6 | Où se saisissent couleur d'équipe et hauteur de marqueur (10) | La procédure de préparation | Avec la fiche de préparation |
| 7 | Point d'accès dédié ou radio intégrée du calculateur (6.2) | L'achat | 1 mois |
| 8 | Port PCIe : stockage ou accélérateur neuronal (7) | Rien pour l'instant | Reportable |
| ~~9~~ | ~~Taille et position des tags de table~~ | — | **Clos** : 100 mm, à ±900 et ±400 mm du centre (3.4) |

Restent sur le chemin critique le choix de structure, qui dépend du bilan de masse et du
capteur inertiel, et le courriel à l'arbitrage sur la source d'énergie.
