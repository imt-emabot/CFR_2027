---
title: "Règlement 2027 bêta — confrontation aux cahiers des charges"
subtitle: "Coupe de France de Robotique 2027 — observations à approfondir avant la passe de révision des CDC"
date: "19 septembre 2026"
lang: fr
---

# Objet

Ce document consigne la première lecture du règlement de jeu 2027 et du règlement général,
confrontés au CDC logiciel, au CDC mât et à la procédure de préparation. Il n'est pas un
cahier des charges : il n'introduit aucune exigence, n'en modifie aucune, et aucun CDC n'a
été touché. Il sert de liste de travail pour la passe de révision qui suivra, une fois ces
points approfondis. Les renvois vers les CDC se font par identifiant ou par section.

Chaque observation porte un statut :

| Statut | Sens |
|---|---|
| Vérifié | Lu dans le texte du règlement ou des CDC |
| Mesuré sur plan | Relevé sur la figure 8 du règlement de jeu, précision estimée à ±20 mm |
| Estimé | Calcul ou raisonnement à partir des données ci-dessus, non confirmé |
| Avis | Position de l'auteur, à discuter |

# 1. Sources

| Document | Version | Lu |
|---|---|---|
| `Eurobot2027_Rules_FR.pdf` — règlement de jeu | Bêta 0.4 | Intégralement, figures et plan compris |
| `Eurobot_General_Rules_SR_FR.pdf` — règlement général | Officielle 1.3 | Intégralement |
| CDC logiciel, CDC mât, `cdc.yaml`, `CHANGELOG.md` | Dépôt au 19 septembre 2026 | CDC logiciel : partie I entière, partie II sections 1, 5, 9 à 11, 14 à 18. CDC mât : partie I entière, partie II sections 1 à 3, 10 à 13 |
| `procedure-preparation-3min.md`, `rapport-heritage-2026.md` | Idem | Procédure intégralement, rapport survolé |

Deux réserves sur les sources. Le règlement de jeu est une bêta : « aucune réclamation issue
de ce document ne sera prise en compte », et les valeurs de points n'y figurent pas. Les CDC
relèvent le règlement général en version 1.2 ; seule la 1.3 est disponible ici, donc les
écarts signalés en section 3.1 sont des écarts entre le relevé des CDC et la 1.3, sans
qu'on puisse dire lesquels sont des changements de version et lesquels des erreurs de relevé.

# 2. Le jeu 2027 en données

## 2.1 Éléments de jeu

| Élément | Données | Statut |
|---|---|---|
| Pierres | 30 boîtes carton 320 × 110 × 110 mm, environ 90 g, référence RAJA BLFA01 ou équivalent | Vérifié |
| Tags des pierres | ArUco 13 sur chacune des 4 grandes faces | Vérifié |
| Carrières | 10, contenant chacune 3 pierres debout ; 4 le long de chaque grand côté, 2 sur l'axe central | Vérifié (nombre), mesuré sur plan (position) |
| Graal | Fabriqué par l'équipe, mêmes contraintes de construction qu'un PAMI, posé dans la salle du trône pendant la préparation, hors contrôle du robot | Vérifié |
| Boulets | Balles de mousse compressibles de 45 mm, 10 par équipe, à la couleur de l'équipe ; chargés pendant la préparation dans le robot et les PAMI, 1 au plus par PAMI | Vérifié |
| PAMI | Placés dans les écuries pendant la préparation ; retirés du match s'ils en sortent avant 85 s | Vérifié |

## 2.2 Zones, relevées sur le plan

Le plan est dessiné table tournée : l'axe de 3000 mm est vertical sur la figure. Château
jaune du côté X = 0, château bleu du côté X = 3000.

| Zone | Dimension et position, château jaune | Statut |
|---|---|---|
| Salle du trône (départ et arrivée du robot) | 500 × 500 mm, contre le petit côté, X 0–500, Y 750–1250 | Vérifié (taille), mesuré sur plan (position) |
| Écuries (départ PAMI) | Deux par équipe, dans les coins du côté du château, environ 200 × 300 mm chacune (X 0–200, Y 0–300 et 1700–2000) | Mesuré sur plan |
| Tours | 4 cercles de Ø200 mm par château | Vérifié (taille), mesuré sur plan (nombre) |
| Zones de mur | 3 rectangles de 150 × 400 mm par château : deux le long des grands côtés, un en façade | Vérifié (taille), mesuré sur plan (nombre) |
| Douves | 3 par château : deux en diagonale, une au pied du pont-levis | Mesuré sur plan |
| Cour du château | Surface entourée par les remparts, contenant la salle du trône ; stockage de 3 pierres au plus | Vérifié |
| Route blanche | Double ligne partant de chaque écurie, longeant le grand côté puis s'incurvant vers le centre, jusqu'à l'écurie adverse du même côté ; elle traverse l'angle de la douve diagonale adverse | Mesuré sur plan, rôle non décrit par le texte |
| Tags de table | 4 tags de 100 mm à ±900 et ±400 mm du centre, dans les cours des deux châteaux | Mesuré sur plan, identique à MAT 3.4 |

## 2.3 Actions et barème

| Action | Ce qui est compté | Contraintes marquantes |
|---|---|---|
| Construction de Camelot | p1 par pierre dans une zone de construction ; p2 par mur, p3 par tour, p4 par porte | Mur : 3 pierres couchées empilées, 330 mm. Tour : 1 pierre debout. Porte : 2 debout + 1 couchée, 430 mm, une seule par château. Élément encore contrôlé par un robot en fin de match non compté. Vol dans le château adverse autorisé seulement si toutes les carrières sont vides, −50 points sinon |
| Il n'y en a qu'un | p5 si le Graal est dans le château, p6 par niveau | Niveaux 1 à 3 : 10, 20, 30 cm de pierres ; niveau 4 : toit du robot au-dessus de 30 cm, libre d'actionneur et de fixation. Graal jusqu'à 430 mm dans les zones de construction et la cour. Graal sorti du château : retiré de la table |
| Retour du roi | p7 partiellement, p8 totalement dans la salle du trône | Robot principal seul, PAMI exclus |
| À l'assaut | p9 par douve adverse occupée, p10 si un PAMI attaque un PAMI adverse, p11 par boulet dans la cour adverse | Tout ne compte qu'entre 85 et 100 s. L'actionneur d'attaque doit être d'une couleur distincte et ne rien endommager. Interdit d'influencer volontairement les boulets adverses |

Les valeurs p1 à p11 ne sont pas publiées. Les équipes peuvent proposer un équilibrage
**jusqu'au 13 octobre 2026** sur `www.eurobot.org/proposition_equilibrage` ; il sera publié
avec la version finale. Règles imposées : base de 1, 2 ou 5 points pour l'action la plus
simple, entiers, pas d'équilibrage égoïste, une réponse par équipe.

## 2.4 Hauteurs, et ce qu'elles impliquent

| Objet | Hauteur | Statut |
|---|---|---|
| Robot et objets manipulés | 350 mm, bouton d'arrêt d'urgence toléré à 375 | Vérifié, F.3 |
| Éléments de jeu dans les zones de construction et le château | 430 mm | Vérifié |
| Pierre debout | 320 mm | Vérifié |
| Mur | 330 mm | Calculé |
| Porte | 430 mm | Calculé |
| Support de balise | 430 ± 5 mm | Vérifié, F.6 |

Conséquence estimée : un robot qui transporte une pierre debout hors du château ne peut la
soulever que de 30 mm au plus sans dépasser 350 mm. La porte impose de poser une pierre à
320 mm, ce que seule la tolérance de 430 mm dans le château autorise.

# 3. Écarts avec les cahiers des charges

Classés par gravité décroissante. Pour chacun : constat, effet sur les CDC, piste.

## 3.1 Détection des PAMI adverses — exigée, non prévue

**Constat, vérifié.** Le règlement général 1.3, F.6 : « Les équipes sont tenues d'équiper
leur robot d'un système de détection des robots et PAMI adverses », vérifié à
l'homologation. F.7 soumet en outre les PAMI aux mêmes contraintes de sécurité que les
robots, « BAU, évitement ». La tolérance de non-évitement « ni volontaire ni violent » que
relève le CDC logiciel (3.1, ligne F.7) ne figure pas dans la 1.3.

**Effet sur les CDC.**

- CDC logiciel 14.6 repose sur cette tolérance pour les PAMI adverses.
- CDC logiciel 16.2 rejette les capteurs bas au motif que « rien ne distingue un PAMI d'un
  élément de jeu ».
- LOG-EXR-03 ne parle que des robots adverses. L'étendre aux PAMI en change le sens : selon
  la règle 3 des conventions, c'est un retrait et un remplacement, pas une édition.
- Le lidar est monté au-dessus de 350 mm (9.1, 14.6) et ne voit aucun PAMI.

**Le motif du rejet s'affaiblit en 2027, estimé.** Au sol, on trouve des boulets de 45 mm,
qu'un capteur monté vers 60 mm ou plus ne voit pas, et des pierres dont les positions sont
connues (carrières, constructions, stockage). Les PAMI adverses sont immobiles dans leurs
écuries avant 85 s, sous peine d'être retirés, et ces écuries sont des positions connues.

**Piste.** Les VL53L1X proposés en 9.1 comme secours du réflexe (question 8 de 16.4)
couvriraient aussi ce besoin. Attention à ne pas conditionner cette détection au temps de
match d'une façon qui ressemblerait à une désactivation volontaire : c'est une
disqualification. À poser à l'arbitrage avant de concevoir.

**Urgence.** La décision porte sur la carte capteurs, donc elle doit précéder le routage.

## 3.2 Relevé du règlement général à refaire en 1.3

**Constat, vérifié.** CDC logiciel 3.1 et 1.6, CDC mât 1 citent la version 1.2. Points de
la 1.3 absents ou différents du relevé, en plus de 3.1 ci-dessus :

| Référence 1.3 | Contenu | Touche |
|---|---|---|
| H.4, forfaits | « Retrait de point d'un élément protégé ou d'une aire protégée adverse » | La règle de vol de pierres, voir 6 |
| H.4, forfaits | « Tirer volontairement sur des personnes à proximité » | Un lanceur de boulets |
| H.4, forfaits | « Aucun robot ni PAMI ne sort de leurs zones de départ » | LOG-EXR-09, homologation des PAMI |
| I.3.b | « Le robot et les PAMIs doivent sortir de leurs zones de départ » | Les PAMI doivent fonctionner dès l'homologation s'ils sont présentés |
| F.7 | PAMI plus grand qu'un cube de 100 mm, périmètre 600 / 700 mm, 1,5 kg, zone de 30 × 30 mm pour l'autocollant | Futur CDC PAMI et Graal |

Et côté règlement de jeu, les points que CDC logiciel 1.6 disait attendre :

| Attendu | Réponse de la bêta |
|---|---|
| Zones à accès exclusif | Aucune nommée. Les remparts sont « réservés à chaque équipe », sans dire si l'accès l'est. LOG-EXR-07 reste sans contenu |
| Fenêtre de départ des PAMI | 85 s à la fin du match |
| Valeur des actions | Non publiée, voir 2.3 |

## 3.3 La fin de match concentre presque tout

**Constat, vérifié.** Entre 85 et 100 s se jouent le retour en salle du trône, le placement
du Graal au niveau 4 (qui suppose le robot dans le château), le bombardement et le départ
des PAMI. Rien de l'assaut ne compte avant 85 s.

**Effet, estimé.**

- CDC logiciel 11.4 donne un repli vers 85 s et un rangement vers 95 s. Un repli à 85 s
  arrive trop tard pour laisser le temps de lever le Graal et de lancer les boulets depuis
  la maison. Ordre de grandeur plus réaliste : 75 à 80 s.
- Les PAMI adverses convergent à partir de 85 s vers nos trois douves, dont celle du
  pont-levis, qui est le chemin naturel du retour depuis le centre. Un robot qui rentre
  après 85 s les croise.
- Nos propres constructions sont des obstacles physiques autour de la cour. Une porte ne
  laisse pas passer le robot. Le modèle du monde et la carte de navigation doivent intégrer
  ce que le robot a construit.

**Synergie, avis.** Un robot rentré dans la salle du trône vers 80 s marque le retour,
porte le Graal au niveau 4, peut bombarder s'il lance depuis chez lui (1,6 à 2,4 m jusqu'à
la cour adverse, estimé), et réalise de fait le niveau 3 d'évitement des PAMI de 14.6,
l'effacement. Le repli sert quatre actions à la fois.

## 3.4 Recalage en coin et écuries PAMI

**Constat.** CDC logiciel 11.5 et la procédure (étape 6) prévoient un recalage par contact
« en désignant le coin utilisé ». Les coins de notre côté sont les écuries PAMI (mesuré sur
plan). La salle du trône touche un seul bord, ce qui ne recale qu'un axe.

**Effet, estimé.** L'ordre de la procédure s'inverse : recalage dans le coin d'abord, pose
des PAMI ensuite. Aujourd'hui, le robot attend que les PAMI soient placés puis rejoint sa
position. Pendant le match, les coins restent occupés par nos PAMI jusqu'à 85 s : pas de
recalage en coin en cours de match.

**Étapes nouvelles pour la procédure.** Pose du Graal dans la salle du trône, hors contrôle
du robot. Chargement des boulets dans le robot et dans chaque PAMI, peut-être avec des
balles remises à la table puisqu'elles sont à la couleur de l'équipe, qui change à chaque
match. Toutes deux prennent du temps sur les trois minutes.

## 3.5 Encombrement du robot

**Constat.** La salle du trône fait 500 × 500 mm et le Graal doit y être « intégralement
contenu » au départ, à côté du robot. Si le Graal n'a pas été levé, il y est encore à
l'arrivée, et p8 demande tout le robot dans la zone.

**Effet, estimé.** Robot d'environ 500 × 380 mm au plus, avec un Graal d'une centaine de
millimètres et un peu de marge. Contrainte mécanique à transmettre à l'équipe châssis.

## 3.6 Hauteur du Graal : une fenêtre étroite

**Estimé**, sous réserve de l'interprétation de F.7 posée en 6.

| Support | Hauteur du support | Hauteur maximale du Graal pour rester sous 430 mm |
|---|---|---|
| Tour, 1 pierre debout (niveau 3) | 320 mm | 110 mm |
| Mur, 3 pierres couchées (niveau 3) | 330 mm | 100 mm |
| Toit du robot (niveau 4) | Plus de 300 mm | 130 mm moins l'excès au-dessus de 300 |

Si « plus grand qu'un cube de 100 mm » veut dire que les trois dimensions dépassent
100 mm, le Graal ne peut pas aller sur un mur, et il doit mesurer entre 100 et 110 mm pour
aller sur une tour. Si la règle veut seulement dire qu'il ne tient pas dans le cube, un
Graal plat règle tout.

**Effet sur le lidar, estimé.** Un Graal sur le toit a son sommet entre 400 et 430 mm, dans
la bande où se trouve la fente du lidar sous le support de balise (CDC logiciel 17.7). Il
masquerait un secteur de détection, ce qui touche LOG-EXR-03 jusqu'à la fin du match.
Hauteur de montage du lidar à confirmer, ce qui était déjà ouvert en 17.7.

## 3.7 Nombre de PAMI

**Constat, mesuré sur plan.** Deux écuries d'environ 200 × 300 mm par équipe. Sept PAMI,
soit quatre dans l'une des deux écuries, imposent des PAMI d'environ 100 × 150 mm au plus.

**Barème, vérifié.** 3 douves adverses, un seul bonus d'attaque, 1 boulet par PAMI. Chaque
boulet donné à un PAMI est retiré au robot, sur 10.

**Effet.** La constante `nombre_pami` de `cdc.yaml` (sept, soit six plus un) et le
dimensionnement de 14.1 et 14.4 reposent sur ce nombre. Le règlement ne l'invalide pas,
mais ne récompense plus directement au-delà de trois ou quatre PAMI. **Avis :** à rediscuter
avec la personne qui développe les PAMI, la redondance face aux PAMI adverses restant un
argument.

**Pour le futur CDC PAMI, estimé.** Environ 2,2 m de route jusqu'à la douve diagonale
adverse, à parcourir en 15 s, soit 0,15 m/s de moyenne au minimum ; viser plutôt
0,3 m/s. Les PAMI adverses empruntent la même route en sens inverse et se croisent vers le
milieu. Le départ doit prendre une marge sur 85 s, de l'ordre d'une demi-seconde, puisqu'un
PAMI sorti trop tôt est retiré. La dérive d'horloge n'est pas le sujet (80 ms sur un match
à 800 ppm, rapport d'héritage), l'écart entre la tirette et le signal de l'arbitre l'est
peut-être.

## 3.8 Points secondaires

| Point | Constat | Touche | Statut |
|---|---|---|---|
| Précision de dépose | Zone de mur de 150 mm pour une pierre de 110 mm : ±20 mm ; pierre de 320 mm dans 400 mm : environ ±7° de cap. LOG-EXF-02 devient chiffrable | LOG-EXF-02, `couverture_exemptee`, fiche 17.13 | Estimé |
| Pierres dans la bande du lidar | Portes à 430 mm vues par le lidar ; murs à 330 mm non. Obstacles statiques à masquer dans le réflexe | CDC logiciel 9.1 | Estimé |
| Carrières au pied du mât | Deux carrières du grand côté de fond sont à 100–450 mm de l'axe de la plateforme. Les robots viendront s'y frotter : chocs et vibrations plus fréquents que supposé | MAT-MXS-07, MAT-MXP-04 | Mesuré sur plan, effet estimé |
| Adresse de l'arbitrage | MAT 13, point 3, cite `referee@eurobot.org` ; le règlement de jeu donne `referee@planete-sciences.org` | CDC mât 13 | Vérifié |
| Élément encore contrôlé | Non compté en fin de match. La pierre ou le Graal doivent être lâchés avant l'arrêt, volontairement, sans que rien ne retombe | LOG-EXR-02, 11.4 | Vérifié |
| Recouvrements reportés | Le CHANGELOG reportait à « après les règles du 19 septembre » la déduplication de quatre zones de recouvrement entre les CDC | Passe de révision | Vérifié |

# 4. Ce qui tient

- **P1.** Les valeurs de points ne seront connues qu'avec la version finale : décrire les
  actions en donnée (11.3, LOG-EXF-06) est exactement ce que la situation demande.
- **Le départ est une date (14.2, MAT-MXF-03).** Adapté tel quel à la phase d'attaque.
- **Les échéances absolues (11.4, LOG-EXP-05).** Indispensables avec une fin de match aussi
  chargée ; seules les valeurs bougent.
- **Le mât.** Plateforme, hauteur et tags de table inchangés : les analyses de MAT 2 et 3
  restent valides.
- **La séquence forcée (11.3).** Le règlement recommande lui-même « des systèmes simples et
  fiables sur un nombre limité d'actions ».

# 5. Opportunités

| Opportunité | Principe | Statut |
|---|---|---|
| Caméra embarquée | Approche fine des pierres par le tag 13 ; les 20 à 30 images par seconde estimées en 9.2 suffisent | Estimé |
| État des carrières vu du mât | Le tag 13 est sur des faces verticales, bien mieux présentées à la caméra que les tags horizontaux des robots. Compter les pierres restantes nourrirait le modèle du monde, l'état transmis aux PAMI, et la condition « toutes les carrières vides » qui autorise le vol | Estimé, faisabilité non vérifiée |
| Proposer un équilibrage | Formulaire ouvert jusqu'au 13 octobre ; une proposition cohérente avec notre stratégie, sans être égoïste | Vérifié (délai) |

# 6. Questions à poser à l'arbitrage

Via la FAQ (`www.eurobot.org/faq/`) ou `referee@planete-sciences.org`. Les réponses d'un
arbitre référent sur la FAQ sont opposables.

1. Une pierre posée dans une zone de construction sans former de construction valide
   rapporte-t-elle p1 ? Plusieurs pierres debout dans une zone de mur, par exemple.
2. « Plus grand qu'un cube de 100 mm » : les trois dimensions au-delà de 100 mm, ou
   seulement ne pas tenir dans le cube ? Cela décide si le Graal peut aller sur un mur.
3. Le robot doit détecter les PAMI adverses et les PAMI doivent éviter, mais l'attaque
   exige qu'un PAMI en touche un autre. Comment les deux se concilient-ils ?
4. Où passe la limite entre le vol de pierres autorisé par E.1 et le forfait pour « retrait
   de point d'un élément protégé » de H.4 ? La phrase « sans détruire uniquement le château
   adverse » est ambiguë.
5. Existe-t-il des aires à accès exclusif cette année ? Le robot peut-il entrer dans la cour
   adverse hors vol de pierres ?
6. La tolérance de 430 mm vaut-elle pour le préhenseur qui tient la pierre, ou seulement
   pour la pierre ?
7. Un système de détection des PAMI adverses dont la sensibilité dépend de la phase de jeu
   est-il acceptable, ou assimilé à une désactivation ?
8. Les boulets sont-ils fournis à la table par l'organisation ?

# 7. Avis sur la stratégie

**Avis**, à débattre une fois les valeurs de points connues.

Pour une équipe à deux à dix heures par semaine, commencer par ce qui ne demande pas de
basculer les pierres : pierres debout dans les zones, les quatre tours, le Graal sur une
tour ou sur le toit, le retour en salle du trône, les PAMI. Murs et porte demandent de
coucher des boîtes de 320 mm et de les empiler jusqu'à 430 mm : c'est la mécanique la plus
coûteuse, pour des bonus dont on ne connaît pas encore la valeur. Un lanceur ne se justifie
que s'il tire depuis la salle du trône, où il s'ajoute au retour au lieu d'entrer en
concurrence avec lui.

Contre-argument à conserver : si la question 1 de la section 6 reçoit une réponse négative,
les pierres qui ne forment pas de construction ne rapportent rien, et le basculement devient
nécessaire pour marquer au-delà des quatre tours.

# 8. Actions

| Action | Échéance | Qui |
|---|---|---|
| Poser les questions de la section 6 | Immédiat | Équipe |
| Trancher la détection des PAMI adverses, avant le routage de la carte capteurs | Avant routage | Logiciel et électronique |
| Rediscuter le nombre de PAMI et leur encombrement | Avec le CDC PAMI (fiche 17.9) | Responsable PAMI |
| Proposer un équilibrage | 13 octobre 2026 | Équipe |
| Transmettre les contraintes d'encombrement et de hauteur de toit | Avant conception du châssis | Mécanique |
| Passe de révision des CDC, de `cdc.yaml` et de la procédure, selon les conventions | Après approfondissement de ce document | Logiciel |

# 9. Ce que ce document ne tranche pas

Aucune exigence n'est retirée, créée ou modifiée ici. Les pistes de la section 3 sont des
entrées pour la passe de révision, pas des décisions. Les mesures sur plan sont à confirmer
sur la version finale du règlement, dont les annexes donneront peut-être les cotes des
zones.
