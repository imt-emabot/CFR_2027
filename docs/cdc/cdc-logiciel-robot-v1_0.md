---
title: "Cahier des charges — Logiciel embarqué du robot principal"
subtitle: "Coupe de France de Robotique 2027 — v1.0"
date: "3 septembre 2026"
lang: fr
---

# Comment lire ce document

Le document est en deux parties, et la distinction entre les deux est le principal
changement de cette version.

**La partie I énonce les besoins, les contraintes subies et les exigences.** Elle décrit ce
que le système doit faire et pourquoi, sans nommer de technologie ni d'architecture. Elle
est stable : elle ne change que si le besoin change ou si le règlement change. C'est elle
qui sert de référence pour juger une solution.

**La partie II rassemble les analyses et les orientations techniques.** Elle contient tout
le travail de conception mené jusqu'ici : comparaisons, calculs, architectures envisagées,
options écartées. **Rien de ce qui s'y trouve n'est un choix définitivement validé**, y
compris ce qui y porte la mention « ACTÉ », qui signifie seulement « retenu à ce stade du
travail et non remis en cause depuis ».

La règle d'écriture pour la suite : une phrase qui nomme une bibliothèque, un protocole, un
composant ou une structure de programme appartient à la partie II. Une phrase qui pourrait
être vérifiée par un arbitre ou par un essai, sans savoir comment le robot est fait,
appartient à la partie I.

Les exigences sont numérotées pour pouvoir être citées et suivies. La colonne de
vérification indique comment on prouve qu'elle est tenue : **I** par inspection, **A** par
analyse ou calcul, **E** par essai, **H** vérifié à l'homologation.

## Identifiants et renvois

Chaque exigence porte un identifiant de la forme **`LOG-<catégorie>-<numéro>`**, par
exemple `LOG-EXS-04`. Le préfixe de document rend l'identifiant non ambigu partout : dans un autre
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
préfixe, par exemple `LOG-P6`.

Les conventions complètes, et la procédure à suivre pour modifier ou créer un cahier des
charges, sont dans `conventions-cdc.md`, à la racine du dépôt.

---

# PARTIE I — BESOINS, CONTRAINTES ET EXIGENCES

---

# 1. Contexte

Équipe engagée en Coupe de France de Robotique, édition 2027. Le règlement de jeu annuel
est dévoilé à la Rentrée de la Robotique du **19 septembre 2026** ; le concours se tient du
**5 au 8 mai 2027** à La Roche-sur-Yon.

Le périmètre couvert est le logiciel du **robot principal**. Le dispositif de calcul et
d'observation déporté fait l'objet d'un cahier des charges séparé. Les **sept PAMI**, soit
six plus un, sont développés par une autre personne ; seul leur contrat d'interface est
traité ici.

Le responsable logiciel écrit également le firmware des cartes embarquées, ce qui permet de
figer les interfaces internes sans négociation externe.

# 2. Besoins

Les besoins répondent à la question « pourquoi ce logiciel existe ». Chaque exigence de la
section 5 se rattache à l'un d'eux.

**B1 — Rejouer d'une année sur l'autre.** Le règlement de jeu change intégralement chaque
année. Le travail investi doit survivre à ce changement, sinon l'équipe repart de zéro
chaque saison et ne progresse jamais.

**B2 — Ne pas perdre un match à cause du logiciel.** Lors de la dernière édition, une
défaillance logicielle a immobilisé le robot en compétition. C'est le besoin qui structure
le plus fortement les exigences de sûreté.

**B3 — Marquer plus de points que l'adversaire en cent secondes.** Ce qui suppose de se
déplacer vite et précisément, de ne pas rester bloqué, et de choisir quoi faire quand la
situation change.

**B4 — Diagnostiquer une anomalie en quelques minutes.** En compétition, entre deux matchs,
sans instrumentation de laboratoire et souvent sans réseau. Et pouvoir reprendre l'analyse
à froid, longtemps après, sur un match qu'on ne peut pas rejouer en vrai.

**B5 — Rester homologable et sans pénalité.** Le règlement sanctionne certaines
défaillances logicielles par des points, parfois par le forfait ou la disqualification.

**B6 — Rester développable par l'équipe réelle.** Effectif non arrêté, disponibilité
comprise entre deux et dix heures par semaine et par personne. Une solution qui demande
plus d'heures que l'équipe n'en a n'est pas une solution.

# 3. Contraintes subies

Ce ne sont ni des besoins ni des choix : ce sont des données d'entrée sur lesquelles le
projet n'a pas de prise, ou plus de prise.

## 3.1 Réglementaires

Relevé du règlement général Eurobot, version officielle 1.2. Les règles annuelles le
compléteront après le 19 septembre 2026.

| Référence | Contenu |
|---|---|
| F.3 | Périmètre de 1200 mm au départ, 1400 mm déployé, à tout instant ; hauteur de 350 mm, hors mât de balise et électronique intégrée sous ce mât |
| F.4.c | Bouton d'arrêt d'urgence obligatoire ; la non-coupure des systèmes de commande, d'affichage et d'évitement est tolérée |
| F.5 | Wi-Fi 5 GHz recommandé ; aucune contestation possible sur les interférences |
| F.6 | Tous les systèmes sont sur la table et ne communiquent pas avec l'extérieur pendant un match |
| F.6 | Démarrage par cordon de tirette uniquement ; aucun autre système manuel n'est homologué |
| F.6 | Système de détection des robots adverses obligatoire, vérifié à l'homologation |
| F.6 | Rectangle libre de 100 × 70 mm sur une face verticale |
| F.7 | PAMI hauts de 150 mm au départ, 350 mm déployés ; non-évitement toléré s'il n'est ni volontaire ni violent |
| G.6 | Marqueur d'identification fourni par l'organisation, tags 4 × 4 numérotés 0 à 50 interdits aux équipes |
| H.1 | Trois minutes de préparation, mouvements autorisés ; plus aucun mouvement ensuite jusqu'à la tirette |
| H.1 | Le bouton d'arrêt d'urgence peut être enfoncé après la préparation pour préserver batteries et actionneurs |
| H.2, H.3 | Cent secondes de match, puis arrêt et extinction des actionneurs ; afficheurs tolérés |
| I.3.b | Homologation dynamique : sortir de la zone de départ et valider une action en cent secondes |
| I.3.c | Toute modification significative après homologation doit être déclarée |

Pénalités qui dépendent directement du logiciel :

| Manquement | Sanction |
|---|---|
| Perte d'une pièce sur l'aire de jeu | −20 points |
| Dégradation de la table ou d'un élément | −30 points |
| Système d'évitement non fonctionnel | −30 points |
| Faux départ | −50 points, forfait si répété |
| Robot encore en mouvement à cent secondes | −50 points |
| Changement de zone de départ après la préparation | −50 points |
| Entrée dans une aire adverse à accès exclusif | **Forfait** |
| Désactivation volontaire de l'évitement | **Disqualification** |

## 3.2 Matérielles

Le matériel est acquis ou en cours de refonte ; le logiciel s'y adapte.

| Élément | État |
|---|---|
| Calculateur embarqué, écran tactile, caméra, lidar | Acquis |
| Bus de terrain reliant les cartes | Acquis, débit figé |
| Cartes alimentation, moteurs, capteurs et actionneurs | Toutes refaites pour 2027 |
| Locomotion différentielle, deux roues motrices, deux roues codeuses folles | Acquis |
| Tirette sur entrée du calculateur, arrêt d'urgence matériel | Acquis |
| Stockage rapide | Non acquis |
| Dispositif de calcul déporté | À construire, cahier des charges séparé |

Le choix de la gamme de microcontrôleurs et le brochage du connecteur de bus sont ouverts
et se décident avec l'équipe électronique, avant le routage.

## 3.3 Humaines et calendaires

Environ trente-cinq semaines entre la rédaction et l'homologation. Équipe non constituée,
disponibilité de deux à dix heures par semaine et par personne. Le règlement de jeu n'est
connu qu'à un tiers du parcours.

## 3.4 Héritage

Un logiciel existe et a joué. Il comprend notamment une interface tactile éprouvée en
compétition. Il comprend aussi les défauts qui ont causé l'incident de la dernière édition.
La contrainte est de **ne pas jeter ce qui a fonctionné**, ce qui suppose de l'évaluer avant
de le remplacer.

# 4. Principes directeurs

Les principes ne sont pas des exigences : ce sont les arbitrages de fond auxquels on revient
quand deux exigences se contredisent.

**P1 — Ce qui change chaque année est de la donnée, pas du code.** Répond à B1.

**P2 — Une seule source de vérité pour la position.** Les autres sources proposent des
corrections. Répond à B3.

**P3 — Toute panne d'un composant non vital coûte des points, jamais le match.** Répond à
B2.

**P4 — Le logiciel du calculateur n'est jamais le seul chemin pour une obligation
sanctionnée.** Répond à B2 et B5.

**P5 — Le système se réinstalle à l'identique.** Répond à B2 et B4.

**P6 — Rien ne bloque le départ d'un match.** Aucun contrôle, aucun outil, aucune règle de
cohérence. Les préconditions non satisfaites sont signalées, jamais bloquantes. Répond à B5.

**P7 — Le coût en heures est un critère d'arbitrage au même titre que la performance.**
Répond à B6.

# 5. Exigences

## 5.1 Exigences réglementaires

Dérivées de la section 3.1. Elles ne se négocient pas.

| # | Exigence | Origine | Vérif. |
|---|---|---|---|
| LOG-EXR-01 | Le robot cesse tout mouvement au plus tard cent secondes après le signal de départ | H.3, H.4 | E, H |
| LOG-EXR-02 | Aucun mécanisme ne retombe, ne se déploie ni ne relâche sa charge au moment de l'arrêt de fin de match | H.4 | E |
| LOG-EXR-03 | Le robot dispose d'une détection des robots adverses en état de fonctionner pendant toute la durée du match, y compris en fonctionnement dégradé | H.4, I.3.b | E, H |
| LOG-EXR-04 | Aucune commande accessible dans la configuration de match ne permet de désactiver la détection d'adversaire | H.4 | I |
| LOG-EXR-05 | Aucun mouvement, y compris d'actionneur, entre la fin de la préparation et le signal de départ, quelles que soient les coupures et remises en puissance intervenues | H.1, H.4 | E |
| LOG-EXR-06 | À la fin de la phase de préparation, le robot se trouve dans sa zone de départ | H.4 | E |
| LOG-EXR-07 | Le robot n'entre dans aucune aire adverse à accès exclusif | H.4 | E, A |
| LOG-EXR-08 | Aucun échange avec un équipement extérieur à la table pendant un match | F.6 | I |
| LOG-EXR-09 | Sans adversaire, le robot sort de sa zone de départ et valide au moins une action en cent secondes | I.3.b | H |
| LOG-EXR-10 | Périmètre et hauteur réglementaires respectés à tout instant, y compris pendant un déploiement | F.3 | I, E |
| LOG-EXR-11 | Le départ n'est déclenché que par le cordon de tirette | F.6 | I |
| LOG-EXR-12 | Le robot ne brouille pas volontairement l'adversaire et n'utilise aucun leurre | F.6 | I |

## 5.2 Exigences fonctionnelles

| # | Exigence | Besoin | Vérif. |
|---|---|---|---|
| LOG-EXF-01 | Le robot connaît sa position et son orientation sur la table à tout instant du match | B3 | E |
| LOG-EXF-02 | Le robot atteint une position de travail avec la précision qu'exigent les actions de jeu ; la valeur cible est fixée après publication des règles annuelles | B3 | E |
| LOG-EXF-03 | Le robot rejoint un objectif en contournant un obstacle mobile, sans arrêt définitif | B3 | E |
| LOG-EXF-04 | Le robot recale sa position sur un élément fixe de la table, sur commande | B3 | E |
| LOG-EXF-05 | Le robot choisit l'ordre de ses actions selon l'état estimé du terrain et révise ce choix en cours de match | B3 | E |
| LOG-EXF-06 | Les actions de jeu de l'année sont décrites en donnée ; changer de règlement ne demande pas de modifier le cœur du logiciel | B1 | I |
| LOG-EXF-07 | Une séquence d'actions scriptée, indépendante du choix automatique, est disponible et sélectionnable | B2, B5 | E |
| LOG-EXF-08 | Le robot ou son système annexe transmet aux PAMI, avant leur départ, l'instant de départ et l'état estimé du terrain | B3 | E |
| LOG-EXF-09 | Chaque PAMI démarre et joue sa séquence même sans aucune liaison | B2 | E |
| LOG-EXF-10 | Le robot n'entre pas en collision avec ses propres PAMI pendant leur fenêtre de déploiement | B3 | E |
| LOG-EXF-11 | Le système accepte une source de position absolue extérieure et la traite comme correction, jamais comme substitution | B3 | A, E |
| LOG-EXF-12 | Le système permet de mesurer les paramètres physiques du robot — réponse à un échelon, décélération réelle, courant consommé — sans instrument extérieur | B3, B4 | E |
| LOG-EXF-13 | L'opérateur peut commander individuellement chaque actionneur et chaque déplacement élémentaire hors match | B4 | I |

## 5.3 Exigences de sûreté et de dégradation

Elles découlent de B2 et des principes P3, P4 et P6. Ce sont celles qui priment en cas de
conflit.

| # | Exigence | Origine | Vérif. |
|---|---|---|---|
| LOG-EXS-01 | Aucun contrôle logiciel n'empêche le départ d'un match ; une précondition non satisfaite est signalée et journalisée | P6 | E |
| LOG-EXS-02 | La perte de la fonction de navigation évoluée n'interrompt pas le match | P3 | E |
| LOG-EXS-03 | La perte de la liaison sans fil n'a aucun effet sur le déroulement du match une fois celui-ci commencé | P3 | E |
| LOG-EXS-04 | L'arrêt de fin de match ne dépend pas du calculateur principal | P4 | E |
| LOG-EXS-05 | La détection d'obstacle et la commande de freinage ne dépendent pas de la fonction de navigation évoluée | P3, P4 | E |
| LOG-EXS-06 | Les cartes de puissance freinent d'elles-mêmes en cas de silence prolongé du calculateur | P4 | E |
| LOG-EXS-07 | Seule la fonction d'alimentation peut interrompre le robot, et uniquement sur défaut électrique caractérisé | P4 | I, E |
| LOG-EXS-08 | Les alimentations du calculateur et du bus de commande ne sont jamais interrompues automatiquement | P4 | I |
| LOG-EXS-09 | Aucun mécanisme d'écriture ne peut saturer le stockage au point de rendre le système inopérant | B2 | E |
| LOG-EXS-10 | Le redémarrage répété d'un composant ne dégrade ni les performances ni la disponibilité du reste du système | B2 | E |
| LOG-EXS-11 | Toute anomalie détectée par une carte est signalée au calculateur et journalisée, même si elle n'a pas de conséquence immédiate | B4 | E |
| LOG-EXS-12 | Une source de position extérieure incohérente est rejetée sans déplacer l'estimation courante | P2 | A, E |

## 5.4 Exigences de performance

Ces exigences portent des valeurs à confirmer par la mesure. Tant qu'elles ne sont pas
mesurées, les paramètres correspondants sont pris pessimistes.

| # | Exigence | Vérif. |
|---|---|---|
| LOG-EXP-01 | La distance à laquelle le robot engage un freinage est calculée à partir de sa vitesse courante et de sa décélération réelle, toutes deux mesurées, et non d'une constante | A, E |
| LOG-EXP-02 | Le robot contourne un adversaire se déplaçant à 1 m/s sans arrêt ni collision | E |
| LOG-EXP-03 | L'écart entre la datation d'une mesure d'odométrie et l'horloge du calculateur est borné, mesuré en continu, et signalé s'il dépasse le seuil retenu | A, E |
| LOG-EXP-04 | La charge du bus de terrain reste sous la moitié de sa capacité en configuration nominale de match | A |
| LOG-EXP-05 | Le robot déclenche son repli de fin de match sur une échéance absolue, jamais sur la fin d'une action | E |
| LOG-EXP-07 | Une perte de message sur le bus de terrain est détectable par le destinataire et comptabilisée | E |

*LOG-EXP-06 a été retirée et n'est pas réattribuée, conformément à la règle de gestion des
identifiants. Elle portait une contrainte de latence de la boucle de navigation rendue sans
objet par le choix 4.2 de la partie II.*

## 5.5 Exigences d'exploitation

Elles découlent de B4 et B5, et ce sont les plus faciles à oublier au moment de coder.

| # | Exigence | Vérif. |
|---|---|---|
| LOG-EXE-01 | La mise en place complète tient dans les trois minutes réglementaires, à deux personnes, chronomètre en main | E |
| LOG-EXE-02 | L'état de chaque carte — présence, version, dernier défaut — est consultable avant le départ sur une vue unique | I |
| LOG-EXE-03 | Le journal d'un match permet d'établir après coup pourquoi une action n'a pas été réalisée | E |
| LOG-EXE-04 | Aucun ordinateur extérieur n'est nécessaire pour préparer, calibrer ou lancer un match | I |
| LOG-EXE-05 | Deux configurations d'exécution existent, l'une pour la mise au point, l'autre pour le match officiel ; la configuration active est visible en permanence et journalisée au départ | I, E |
| LOG-EXE-06 | Une incohérence de version entre cartes est détectée et signalée sans empêcher le départ | E |
| LOG-EXE-07 | Le robot est utilisable au stand sans montage particulier, écran et commandes embarqués | I |

*L'enregistrement, le rejeu et la capitalisation relèvent de l'exploitation mais font l'objet
d'une section propre, 5.7, en raison de leur volume. LOG-EXE-08 est réservé et non attribué.*

## 5.6 Exigences de développement et de pérennité

| # | Exigence | Besoin | Vérif. |
|---|---|---|---|
| LOG-EXD-01 | Le système se réinstalle à l'identique à partir d'un support versionné | B2 | E |
| LOG-EXD-02 | La description des échanges entre cartes est produite à partir d'une source unique, dont dérivent le code embarqué et les outils de diagnostic | B4 | I |
| LOG-EXD-03 | Le code éprouvé en compétition est réutilisé, sauf raison documentée de le remplacer | B6 | I |
| LOG-EXD-04 | Chaque exigence de sûreté de la section 5.3 est associée à un essai reproductible, rejoué avant chaque compétition | B2 | I |
| LOG-EXD-05 | Les paramètres physiques et les seuils sont dans des fichiers de configuration versionnés, jamais dans le code | B1, B6 | I |

## 5.7 Exigences d'enregistrement, de rejeu et de capitalisation

Ces exigences répondent à B4 et, par la capitalisation, à B1 et B3. Elles se distinguent des
autres par une propriété : **un match non enregistré est perdu définitivement.** Le lecteur
et le simulateur peuvent être écrits n'importe quand ; l'instrumentation, non.

### Enregistrement

| # | Exigence | Vérif. |
|---|---|---|
| LOG-EXJ-01 | L'enregistrement démarre et s'arrête avec le match, sans aucune action de l'opérateur | E |
| LOG-EXJ-02 | Toutes les données reçues par le logiciel pendant un match sont enregistrées : mesures des capteurs, échanges avec les cartes, positions issues du dispositif déporté, messages des PAMI, entrées de l'opérateur | E |
| LOG-EXJ-03 | Toutes les décisions, actions et alertes produites par le logiciel sont enregistrées, accompagnées des éléments qui les ont motivées | E |
| LOG-EXJ-04 | Toute donnée enregistrée porte une datation exprimée dans une base de temps unique et commune à toutes les sources | A, E |
| LOG-EXJ-05 | L'enregistrement comprend la configuration active, les versions de tous les composants et le mode d'exécution | I |
| LOG-EXJ-06 | Chaque enregistrement est identifiable sans ambiguïté : date, rencontre, adversaire, couleur, score final | I |
| LOG-EXJ-07 | L'enregistrement n'altère ni les cadences ni le comportement du robot ; aucune écriture ne peut retarder une décision | A, E |

### Rejeu

| # | Exigence | Vérif. |
|---|---|---|
| LOG-EXJ-08 | Le rejeu d'un match est possible sans le robot ni aucun de ses éléments | E |
| LOG-EXJ-09 | Le rejeu présente graphiquement l'aire de jeu, la position et l'état du robot, ses mesures, ses alertes, ses décisions et ses actions, la position estimée de l'adversaire, et celle des PAMI lorsqu'elle est disponible | E |
| LOG-EXJ-10 | Le rejeu distingue visuellement ce qui a été mesuré de ce qui a été estimé ou supposé | I |
| LOG-EXJ-11 | Le temps est parcourable librement : avance, recul, pas à pas, vitesse variable, saut direct à un événement | E |

### Capitalisation

| # | Exigence | Vérif. |
|---|---|---|
| LOG-EXJ-12 | Un match enregistré est convertible en scénario exploitable par le simulateur de stratégie | E |
| LOG-EXJ-13 | Le scénario issu d'un match comprend les conditions initiales, la trajectoire de l'adversaire, la chronologie des actions réellement exécutées et leurs durées mesurées | I, E |
| LOG-EXJ-14 | Le simulateur permet de comparer le résultat d'une stratégie modifiée au déroulement réel dont le scénario est issu | E |
| LOG-EXJ-15 | Les durées et les taux de réussite mesurés en match alimentent la description des actions de l'année | I |

**Ce que ces exigences ne demandent pas.** Modifier une décision à l'intérieur du rejeu.
Dès qu'une décision change, les données enregistrées cessent d'être valides et il faut
simuler : c'est le rôle du simulateur, alimenté par le scénario d'LOG-EXJ-12, pas celui du
lecteur. Les deux outils restent séparés.

# 6. Plan de vérification

Les essais ci-dessous ne sont pas des tests de recette optionnels : ils sont la seule preuve
que les exigences de sûreté sont tenues, et ils sont rejoués avant chaque compétition
(LOG-EXD-04). Ce plan couvre les exigences de sûreté (5.3), d'exploitation (5.5) et
d'enregistrement (5.7). **Il ne couvre pas les exigences fonctionnelles de 5.2**, qui relèvent
de la validation ordinaire de développement et feront l'objet d'une fiche distincte, 17.13.
Les exigences dont la colonne de vérification ne porte que **I** sont contrôlées par
inspection lors de la revue de document, sans manipulation.

| Essai | Description | Exigences couvertes |
|---|---|---|
| V1 | Terminaison brutale de la fonction de navigation en plein match | LOG-EXS-02, LOG-EXS-05, LOG-EXR-03 |
| V2 | Coupure de la liaison sans fil et du dispositif déporté en plein match | LOG-EXS-03, LOG-EXF-09 |
| V3 | Match complet avec un stockage presque saturé | LOG-EXS-09, LOG-EXS-10 |
| V4 | Départ avec une carte absente et une version incohérente | LOG-EXS-01, LOG-EXE-06 |
| V5 | Terminaison du calculateur à quatre-vingt-dix secondes de match | LOG-EXS-04, LOG-EXR-01, LOG-EXR-02 |
| V6 | Cycle de préparation complet, chronométré, incluant coupure et remise en puissance | LOG-EXE-01, LOG-EXR-05, LOG-EXR-06 |
| V7 | Homologation à blanc, sans adversaire | LOG-EXR-09, LOG-EXR-10 |
| V8 | Campagne de mesure des paramètres physiques | LOG-EXF-12, LOG-EXP-01, LOG-EXP-03 |
| V9 | Rejeu graphique intégral d'un match enregistré, robot éteint et absent | LOG-EXJ-01 à LOG-EXJ-11 |
| V10 | Conversion d'un match en scénario, exécution dans le simulateur avec une stratégie modifiée, comparaison au déroulement réel | LOG-EXJ-12 à LOG-EXJ-15 |
| V11 | Silence prolongé du calculateur, émission Pi coupée en plein mouvement | LOG-EXS-06, LOG-EXP-07 |
| V12 | Injection d'un défaut électrique caractérisé, sur un rail de puissance puis sur un rail non coupable | LOG-EXS-07, LOG-EXS-08, LOG-EXS-11 |
| V13 | Injection d'une pose extérieure incohérente pendant un déplacement | LOG-EXS-12, LOG-EXF-11 |

# 7. Ce qui n'est pas une exigence

Pour éviter que la partie II ne remonte par petits bouts dans la partie I, voici les
questions qui n'ont volontairement pas de réponse ici. Elles sont traitées en partie II,
comme des orientations révisables.

Le choix d'un intergiciel robotique et la façon de découper le logiciel en processus. Le
choix d'une bibliothèque de navigation. Le protocole du bus de terrain, son plan
d'adressage, son outillage et sa politique d'acquittement. Le format, le support et l'outillage des
enregistrements de match, ainsi que la technologie du lecteur. La nature de l'interface entre le calculateur et la carte
moteurs. L'emplacement du pilote du capteur de distance. La méthode de synchronisation des
horloges. Le transport employé vers les PAMI et le dispositif déporté. La gamme des
microcontrôleurs. Le langage et la technologie de l'interface opérateur. La présence ou non
d'un chemin de signalisation matériel parallèle au bus.

Chacune de ces questions a déjà été instruite, souvent longuement. Aucune n'est refermée.

---

# PARTIE II — ANALYSES ET ORIENTATIONS TECHNIQUES

**Statut de cette partie.** Ce qui suit est le journal de conception, pas la spécification.
Il rassemble les comparaisons, les calculs, les architectures envisagées et les options
écartées, avec leurs motifs.

**Aucun élément de cette partie n'est un choix définitivement validé.** La mention
« ACTÉ » qu'on y rencontre signifie « retenu à ce stade du travail et non remis en cause
depuis », pas « décidé ». Plusieurs de ces orientations ont déjà été renversées en cours de
route, et d'autres le seront — notamment quand l'équipe sera constituée et quand le
règlement de jeu sera publié.

Ce qui vaut, en revanche, c'est la **traçabilité des motifs** : chaque orientation est
accompagnée de la raison qui l'a fait retenir et de ce qui la ferait reconsidérer. C'est ce
qui permet de la rouvrir sans refaire l'analyse.

La numérotation interne de cette partie est celle des versions précédentes du document. Les
renvois qu'on y trouve, du type « voir 4.3 », désignent les sections de cette partie et non
celles de la partie I.


## 1. Contexte matériel détaillé

*Le contexte de projet et les contraintes subies sont en partie I, sections 1 et 3. Ce qui
suit en est le détail technique : références, chiffres et analyses de composants.*

### 1.1 Projet

Équipe engagée en Coupe de France de Robotique. Dernière participation avec
l'architecture décrite ci-dessous. L'édition visée est **2027**.

| Jalon | Date | Source |
|---|---|---|
| Rentrée de la Robotique, règlement dévoilé | 19 septembre 2026, 14 h–18 h | Site officiel, vérifié |
| Concours | 5 au 8 mai 2027, La Roche-sur-Yon | Site officiel, vérifié |

Soit environ **35 semaines** entre la rédaction de ce document et l'homologation.

Périmètre : le logiciel du **robot principal**, plus le **mât déporté** (voir 1.4). Les
**sept PAMI** — six plus un — sont développés par une autre personne ; leur **contrat
d'interface** est rédigé ici (section 14). Le nombre sept est la valeur de référence,
utilisée pour le dimensionnement du transport (14.4) et du serveur (14.1).

Le responsable logiciel écrit également le firmware des cartes batterie, moteurs et
capteurs/actionneurs. **Les contrats d'interface peuvent donc être figés sans négociation
externe**, ce qui supprime le principal risque de planning identifié en v0.1.

**Capacité de l'équipe.** L'équipe n'est pas encore constituée et la promotion du projet
n'a pas été faite. La capacité connue est de **2 à 10 heures par semaine et par
personne**, très variable. Conséquence sur ce document : le planning de la section 18
reste volontairement global, exprimé en ordre de dépendance plutôt qu'en dates fermes, et
tout arbitrage d'architecture est évalué à l'aune de son coût en heures — c'est le critère
qui a tranché la question du noyau (4.3).

### 1.2 Matériel embarqué

| Élément | Détail | Statut |
|---|---|---|
| Calculateur | Raspberry Pi 5, 8 Go | Acquis |
| Stockage | NVMe prévu ; seule une carte SD 64 Go est achetée | À acquérir |
| Bus de terrain | CAN 500 kbit/s, HAT sur la Pi | Acquis |
| Télémétrie | Wi-Fi 5 GHz vers routeur dédié | Acquis |
| Lidar | **RPLIDAR C1** (C1M1), USB | Acquis |
| Caméra | Raspberry Pi Camera Module 3 (IMX708), CSI | Acquis |
| IHM | Raspberry Pi Touch Display 2, 5 pouces, portrait | Acquis |
| Actionneurs | Servomoteurs sur module I²C ; shield pas-à-pas | Acquis |
| Locomotion | 2 moteurs, roues centrées, différentiel, driver Cytron | Acquis |
| Odométrie | 2 roues folles, **module magnétique à sortie A/B et SPI** | À confirmer |
| Roue codeuse | Diamètre ~48 mm (joint torique OD 48 / ID 45) | Déduit |
| Démarrage | Tirette sur GPIO de la Pi ; arrêt d'urgence matériel | Acquis |

**Caractéristiques du lidar C1**, d'après la fiche technique constructeur : jusqu'à 5000
mesures par seconde, portée de 12 mètres, zone morte de 5 cm seulement. À 10 Hz de
rotation, cela donne 500 points par tour, soit une résolution angulaire de 0,72°.

### 1.3 Cartes électroniques sur le bus CAN

**Toutes les cartes sont refaites pour la saison 2027.** C'est une opportunité et une
contrainte : les brochages, les connecteurs et le choix des microcontrôleurs peuvent être
repris à zéro, mais ils doivent être figés tôt, parce qu'ils bloquent le routage.

**Carte alimentation (STM32).** Entrée LiPo 4S. Sorties 5 V puissance, 5 V commande,
5 V Pi, 12 V puissance. Mesure de courant et tension par **INA3221** (3 canaux, 0,25 %)
sur shunts de 8 mΩ 1 W. Sorties commutées par relais **G2RL-2 DPDT 8 A 12 V**. Un DAC
**MCP4725** est présent.

Conséquences chiffrées : le LSB de 40 µV de l'INA3221 sur un shunt de 8 mΩ donne une
**résolution de 5 mA** ; la pleine échelle de 163,8 mV correspond à 20,5 A, mais le relais
plafonne à 8 A — c'est la limite réelle. À 8 A le shunt dissipe 0,51 W dans un boîtier
1 W, donc il chauffe.

Contraintes de coupure : voir 11.2.

**Carte moteurs (STM32).** Acquisition des codeurs, calcul d'odométrie, asservissement.
**Source de vérité de la pose du robot.** Le code actuel doit être largement révisé, voire
réécrit ; la carte n'est pas accessible pour l'instant.

**Cartes capteurs / actionneurs (STM32C09x).** Refondues chaque année selon les actions de
jeu. Le contrôleur FDCAN de ces puces a été **validé par essai**. Dix puces sont en stock.
À noter pour mémoire : la série STM32C071, proche en référence, ne dispose pas de CAN — ne
pas s'y tromper lors d'un réapprovisionnement.

**Gamme de microcontrôleurs — [OUVERT], analyse conservée.**

Le F303K8 actuel est très juste en mémoire, ce qui contraint directement le mode
d'identification (6.3). Chiffres vérifiés sur les fiches techniques ST :

| Référence | Flash | RAM | Fréquence | CAN | Remarque |
|---|---|---|---|---|---|
| STM32F303K8 (actuel) | 64 Ko | 12 Ko + 4 Ko CCM | 72 MHz | 1 bxCAN | Tampon d'identification limité à ~0,8 s à 1 kHz |
| STM32G431KB | 128 Ko | 22 Ko + 10 Ko CCM | 170 MHz | 1 FDCAN | Même format Nucleo-32, ST-LINK V3E, USB device, CORDIC et FMAC |
| STM32G474RE | 512 Ko | 128 Ko | 170 MHz | 3 FDCAN | Format 64 broches, à vérifier au moment de l'achat |
| STM32C09x (en stock) | — | — | — | 1 FDCAN | Validé par essai, dix puces disponibles |

Comptage d'entrées-sorties pour la carte moteurs sur un boîtier 32 broches : quatre pour
les deux voies codeur, quatre pour le SPI, deux pour le CAN, quatre pour le PWM et la
direction des deux moteurs, deux pour une liaison série de mise au point. Dix-huit sur
vingt-cinq disponibles : ça passe, mais la marge disparaît dès qu'un capteur de fin de
course s'ajoute.

Argument pour le G474RE sur la carte moteurs : 128 Ko de RAM donnent un tampon
d'identification de dix secondes à 1 kHz, contre 0,8 s aujourd'hui. On passe de « juste
assez pour une réponse indicielle » à « j'enregistre un parcours complet ».

Argument pour unifier toute la flotte sur le G4 : un seul HAL, un seul paramétrage CubeMX,
une seule chaîne de compilation, un seul stock de rechange. Pour une équipe à deux ou dix
heures par semaine, l'homogénéité rapporte plus d'heures que les trois euros par carte
qu'elle coûte.

Argument contre : les dix STM32C09x sont déjà achetés et fonctionnent. Les garder sur les
cartes capteurs, où le firmware est simple et refait chaque année, laisse deux familles
mais aucune ne porte de bxCAN — ce qui laisse ouverte la possibilité de passer au CAN FD
plus tard si le débit devient contraignant.

Ce choix est indépendant du logiciel et se tranche avec la personne qui route les cartes.

### 1.4 Dispositif de calcul et d'observation déporté — dans le périmètre 2027

**[ACTÉ]** Le mât entre dans le périmètre de la saison, son développement commence, et il
fait l'objet d'un **cahier des charges dédié** — voir la fiche 17.10 et la section 10.

Le règlement l'appelle *dispositif de calcul et d'observation déporté* (G.4). C'est une
catégorie homologable à part entière, fixée sur une plateforme partagée au milieu du bord
de fond de table, à 70 mm au-dessus du sol de jeu. Contraintes retenues :

| Contrainte | Valeur | Source |
|---|---|---|
| Emprise au sol | 450 × 320 mm, côté de l'équipe uniquement | G.4 |
| Hauteur maximale | 1,6 m au-dessus de la plateforme | G.4 |
| Masse | < 5 kg | G.4 |
| Fixation | Tige filetée M8 et écrou papillon dans une rainure de 10 mm | G.4 |
| Vibrations | Explicitement annoncées par le règlement | G.4 |

**Non provisionné au budget** : 415 à 610 € estimés, chiffrés dans le CDC mât, section 12.2.
Objectifs par priorité : position du
robot de l'équipe pour recaler l'odométrie, position du robot adverse, éventuellement
position des obstacles mobiles.

**Le dispositif héberge aussi le serveur PAMI et le point d'accès Wi-Fi.** [ACTÉ] C'est ce
qui rend l'ensemble conforme à F.6, qui interdit à tout système de communiquer avec
l'extérieur de la table pendant un match : la plateforme de calcul étant sur la table, le
réseau de l'équipe y est entièrement contenu. Voir 14.1.

*Contrepartie assumée :* le sous-système PAMI dépend désormais d'un élément matériel qui
n'existe pas encore. La parade est de découpler les deux dans le temps — le boîtier posé
sur la plateforme peut être homologué avec le seul serveur et son point d'accès, la partie
vision étant ajoutée plus tard. Il ne faut pas que le retard du mât devienne le retard des
PAMI.

Élément déterminant pour le dimensionnement : **quatre tags ArUco fixes sur la table**
servent de référence et de calibration.

### 1.5 IHM tactile existante

Une interface tournait déjà sur l'écran tactile lors de la dernière édition, avec :

- état de la batterie et des sorties de puissance,
- carte en direct,
- sélecteur de stratégie,
- onglet d'actions unitaires couvrant tous les éléments du robot — avancer, tourner,
  commander un actionneur — chacune associée à une action prédéfinie,
- onglet de journaux.

**C'est le premier candidat de la grille de comparaison (section 15) : du code éprouvé en
compétition, qui couvre déjà l'essentiel du besoin.** Deux manques identifiés : un onglet
de calibration et d'identification (section 6), et un onglet d'état du système
(section 16.3).

### 1.6 Contraintes du règlement général qui pèsent sur le logiciel

Relevé issu du **règlement général Eurobot, version officielle 1.2**. Les règles annuelles
compléteront ce tableau après le 19 septembre 2026.

| Règle | Contenu | Conséquence logicielle |
|---|---|---|
| F.6 | Tous les systèmes sont sur la table et ne communiquent pas avec l'extérieur pendant un match | Serveur PAMI et point d'accès dans le dispositif de calcul (1.4) ; aucun client extérieur pendant le match (12) |
| H.1 | 3 minutes de préparation, mouvements autorisés ; plus aucun mouvement ensuite jusqu'à la tirette | État `PREPARATION` distinct dans la machine à états (11.4) ; recalage fait avant le match |
| H.2, H.3 | 100 secondes, puis arrêt et extinction des actionneurs | Minuterie tenue par les firmwares (7.3), séquence de fin en 11.4 |
| H.4 | Système d'évitement non fonctionnel : −30 points | Le réflexe obstacle doit survivre à la mort de Nav2 (9.1) |
| H.4 | Désactivation volontaire de l'évitement : **disqualification** | Aucun interrupteur d'évitement atteignable en mode match (12) |
| H.4 | Faux départ : −50 points, récidive = forfait | Aucun mouvement à la mise sous tension ni à la relâche du bouton d'arrêt d'urgence (13.2) |
| H.4 | Robot qui bouge encore à 100 s : −50 points | Coupure inconditionnelle par le firmware (7.3) |
| H.4 | Changement de zone de départ après la préparation : −50 points | Le recalage doit ramener le robot dans sa zone (11.4) |
| H.4 | Entrée dans une aire adverse à accès exclusif : **forfait** | Zones interdites : voir 5.2 et la discussion en 16.2 |
| H.4 | Perte d'une pièce du robot : −20 points ; dégradation de la table : −30 points | Les actionneurs ne doivent pas retomber en fin de match (11.4) |
| F.3 | Périmètre 1200 mm au départ, 1400 mm déployé, à tout instant ; hauteur 350 mm | Empreinte Nav2 dynamique si des mécanismes se déploient |
| F.3 | La hauteur exclut le mât de balise et l'électronique intégrée sous le mât | Le lidar peut être monté dans le mât, configuration déjà homologuée (9.1) |
| F.4.c | Le bouton d'arrêt d'urgence tolère la non-coupure des systèmes de commande, d'affichage et d'évitement | Valide le choix des rails non coupables (13.2) |
| F.5 | Wi-Fi 5 GHz recommandé, aucune contestation possible sur les interférences | Le mât et les PAMI ne peuvent être dans aucune boucle critique |
| F.6 | Rectangle libre de 100 × 70 mm sur une face verticale | Contrainte mécanique, à signaler à l'équipe châssis |
| F.7 | PAMI hauts de 150 mm au départ, 350 mm déployés | Invisibles du lidar monté haut (14.6) |
| G.6 | Marqueur ArUco fourni par l'organisation, contour et tranche à la couleur de l'équipe | Base du suivi par le mât (10.4) |
| G.6 | Tags 4 × 4 numérotés 0 à 50 interdits aux équipes | Utiliser un autre dictionnaire ou des numéros au-dessus de 90 |
| I.3.b | Homologation dynamique : sortir de la zone de départ et valider une action en 100 s | Spécification du mode séquence forcée (11.3) |
| I.3.c | Toute modification significative après homologation doit être déclarée | Discipline de version, pas de contrainte logicielle |

**Ce que le règlement ne dit pas et qu'il faut attendre :** les zones à accès exclusif, la
fenêtre de départ des PAMI, la valeur des actions. Tout cela vient des règles annuelles.
Les paramètres correspondants sont donc dans le fichier de configuration (11.3), jamais
dans le code.

**Trois points sont explicitement vérifiés à l'homologation** et méritent d'être traités
comme des exigences fonctionnelles à part entière plutôt que comme des détails : la
minuterie de 100 secondes, le système d'évitement des adversaires, et la capacité à sortir
de la zone de départ en validant au moins une action. Le mode séquence forcée de 11.3
existe d'abord pour ce dernier point.

---

## 2. Retour d'expérience — ce qui dicte l'architecture

### 2.1 L'incident fondateur

Pendant la dernière compétition, **ROS a planté, redémarré en boucle et saturé la carte
SD**. L'équipe a réagi en cours de coupe en convertissant tous les nœuds vers un protocole
maison fonctionnant sans ROS.

Diagnostic le plus probable : politique de redémarrage sans temporisation croissante,
combinée à des journaux sans rotation ni quota. Un processus qui tombe et se relance dix
fois par seconde en écrivant une trace d'erreur remplit 32 Go en quelques minutes.

La relecture du dépôt de l'édition précédente corrobore ce diagnostic sans le démontrer : le
lanceur de la branche ROS porte quatre nœuds mis en commentaire — pilote lidar, filtre de
scan, garde-fou d'obstacle et repère de carte — sous la mention « noeuds commentés pour
fixer le crash loop ». La boucle avait donc été constatée avant la compétition, et traitée
en retirant des nœuds plutôt qu'en bornant les journaux et les redémarrages. Effet de bord :
cette branche a fini sa vie sans aucun évitement.

### 2.2 Ce qu'on en retient

C'est **l'exigence non fonctionnelle numéro un**. Elle structure la section 13.

Deux conclusions distinctes : ROS n'est pas en cause en tant que tel, un exécutif mal
configuré l'était ; mais un système de plusieurs dizaines de processus a une surface de
panne que le noyau du match ne doit pas hériter.

La v0.2 en tirait la conclusion d'un noyau écrit hors de ROS. La v0.3 tranche autrement :
la surface de panne se réduit en regroupant les nœuds dans moins de processus, pas en
quittant ROS. Voir 4.3.

---

## 3. Principes directeurs — formulation de travail

*Repris et consolidés en partie I, section 4. Conservés ici pour la traçabilité des
renvois internes de cette partie.*

**P1 — Réutilisabilité pluriannuelle. [ACTÉ]** Le **noyau** — transport, navigation,
exécutif, modèle du monde générique — est du code pérenne ; les **actions de jeu de
l'année** sont de la donnée, décrites dans un fichier de configuration.

**P2 — Source de vérité unique. [ACTÉ]** La pose est produite par la carte moteurs. Le mât
et la vision proposent des **corrections** filtrées, jamais des écrasements.

**P3 — Dégradation progressive. [ACTÉ]** Toute panne d'un composant non vital coûte des
points, jamais le match.

**P4 — Le logiciel n'est pas le seul chemin de sécurité. [ACTÉ]** Arrêt d'urgence matériel
et chien de garde sur la carte moteurs, indépendants de tout code tournant sur la Pi.
S'y ajoute désormais la minuterie de fin de match, tenue par les firmwares (7.3) : les
obligations que le règlement sanctionne ne doivent dépendre d'aucun processus Linux.

**P5 — Reproductibilité. [ACTÉ]** Image système clonée et versionnée.

**P6 — Rien ne bloque le départ d'un match. [ACTÉ]** Aucun contrôle logiciel, aucun outil,
aucune règle de cohérence ne peut empêcher le départ. Les préconditions non satisfaites
sont **affichées et journalisées, jamais bloquantes**. Seule la carte alimentation peut
interrompre le robot, et uniquement sur défaut électrique (11.2).

Ce principe est apparu tardivement mais il a rang égal aux cinq autres : il interdit par
construction toute une famille de mécanismes de sécurité tentants — vérification de
version bloquante, refus de départ sur carte absente — dont le coût en points est
supérieur au bénéfice.

---

## 4. Architecture logicielle cible

### 4.1 Découpage en trois couches

```
┌──────────────────────────────────────────────────────────┐
│  COUCHE 3 — Outillage (hors match)                       │
│  Enregistrement, visualisation, simulation, télémétrie   │
│  Wi-Fi. Peut mourir sans conséquence.                    │
├──────────────────────────────────────────────────────────┤
│  COUCHE 2 — Perception & navigation (ROS 2)              │
│  Caméra, mât, Nav2, modèle du monde.                     │
│  Sa perte fait basculer en mode dégradé.                 │
├──────────────────────────────────────────────────────────┤
│  COUCHE 1 — Noyau de match (ROS 2, processus unique)     │
│  Tirette, machine à états, moteur de stratégie,          │
│  passerelle CAN, chien de garde, IHM d'état,             │
│  PILOTE LIDAR + réflexe obstacle.                        │
│  Ne doit jamais tomber.                                  │
└──────────────────────────────────────────────────────────┘
                          │ CAN 500 kbit/s
┌──────────────────────────────────────────────────────────┐
│  Cartes STM32 : moteurs, alimentation, capteurs          │
│  Autonomes. Chien de garde propre. Freinent si silence.  │
└──────────────────────────────────────────────────────────┘
```

Changement par rapport à la v0.2 : le lidar quitte la couche 2 pour la couche 1. Motif en
9.1.

### 4.2 Articulation Nav2 / carte moteurs — tranché

**[ACTÉ] Flux de waypoints remplaçable.**

Nav2 ne produit pas naturellement des coordonnées : son contrôleur local émet une consigne
de vitesse à 20 Hz. Mais son planificateur global produit un chemin — une liste de poses
échantillonnée à la résolution de la costmap — qui peut être sous-échantillonnée en
waypoints. Ce qui donne l'évitement n'est pas le format, c'est la **fréquence de
remplacement**.

Mécanisme retenu : la Pi envoie une **file de N waypoints portant un numéro de séquence**,
rafraîchie à 5–10 Hz depuis le chemin replanifié. La costmap contenant le robot adverse,
le chemin le contourne. La carte moteurs suit la file en poursuite de point cible et
**accepte le remplacement de la file en cours de mouvement, sans s'arrêter**. C'est la
condition qui rend l'ensemble viable.

| Critère | Flux de waypoints | Consigne de vitesse 20 Hz |
|---|---|---|
| Latence de réaction | ~400 ms | ~250 ms |
| Précision d'accostage | 5 mm | 5–10 cm |
| Charge CAN | ~60 trames/s | ~20 trames/s |
| Perte de la Pi | file en cours terminée proprement | arrêt immédiat |
| Interfaces sur la carte moteurs | **une seule** | deux |

**Le robot contourne, il n'esquive pas** : la trame `PAUSE` prioritaire reste le mécanisme
d'urgence, et elle est désormais émise depuis la couche 1 (voir 9.1), pas depuis Nav2.

*Ce que cela coûte :* la carte moteurs doit implémenter une poursuite de point cible avec
distance d'anticipation d'environ 20 cm à 0,8 m/s, au lieu d'un déplacement point à point.
C'est le travail firmware principal de la saison.

*Ce que cela évite :* deux interfaces distinctes sur la carte moteurs, et le passage de la
boucle de mouvement par la couche qui a planté en compétition.

### 4.3 Frontière ROS — tranché

**[ACTÉ] Le noyau de match reste du ROS 2, dans un processus unique contenant plusieurs
nœuds.**

Le point de confusion que cette décision lève : **un nœud n'est pas un processus**. Un
nœud est une unité logique — publications, abonnements, services, timers, un nom. Un
processus est une unité du système d'exploitation, avec sa mémoire, son ordonnancement et
sa mort. `ros2 run` lance un processus contenant un nœud, mais c'est un comportement par
défaut, pas une contrainte.

Ce que le regroupement change, sur deux axes.

**La communication.** Entre deux processus, chaque message est sérialisé, traverse le RMW
par mémoire partagée ou boucle locale UDP, puis est désérialisé. Dans un même processus
avec l'intra-process activé, une publication par `unique_ptr` transmet le pointeur
lui-même : ni copie ni sérialisation. Sur les volumes du robot ce n'est pas le gain
décisif, mais c'est gratuit.

**La mort.** C'est le vrai sujet. Une exception non rattrapée ou un dépassement mémoire
tuent le processus entier, donc tous ses nœuds. Entre deux processus, l'isolation est
garantie par le noyau Linux. Et systemd ne connaît que des processus : quotas de journaux,
`RestartSec` croissant, politique de redémarrage s'appliquent par processus, jamais par
nœud.

Règle de regroupement : **mettre dans le même processus les nœuds qui doivent vivre et
mourir ensemble.** Le découpage en nœuds reste celui qu'on aurait écrit naturellement ; on
passe de quinze processus à cinq.

*Ce que cela remplace :* la proposition v0.2 d'un noyau hors ROS avec exécutif écrit à la
main, chiffrée à plusieurs semaines. Le diagnostic de 2.1 désigne un exécutif mal
configuré, pas ROS ; des quotas journald et une temporisation croissante traitent la cause
pour deux heures de travail. Le coût de l'option v0.2 était incompatible avec la capacité
de l'équipe (1.1).

*Ce que cela coûte :* le noyau hérite quand même de la surface de panne de rclcpp et du
RMW. Un plantage dans un nœud du noyau tue les cinq autres. C'est le prix assumé.

*Contrainte de mise en œuvre :* rclpy ne supporte pas les composants C++. **Un langage par
processus.** Comme la passerelle CAN gagne à être composée avec le récepteur de trames
(8.5), qui est en C++, le noyau sera en C++.

### 4.4 Découpage en processus [ACTÉ]

| Processus | Contenu | Politique de redémarrage |
|---|---|---|
| `core` | Tirette, machine à états, passerelle CAN, chien de garde, pilote lidar, réflexe obstacle, IHM d'état | Aucun redémarrage en match |
| `strategy` | Moteur de stratégie | Redémarrage autorisé, repli sur séquence forcée pendant l'absence |
| `nav` | Nav2, costmaps, planificateur global | Peut mourir, `RestartSec` croissant |
| `perception` | Caméra, client mât | Peut mourir |
| `tooling` | Enregistrement, télémétrie, visualisation | Tué d'office au coup de tirette |

Mise en œuvre en C++ : chaque nœud compilé en bibliothèque partagée avec
`RCLCPP_COMPONENTS_REGISTER_NODE`, chargé dans un `ComposableNodeContainer` déclaré au
lancement.

### 4.5 Découverte DDS [ACTÉ]

Par défaut, ROS 2 découvre en multicast sur toutes les interfaces. Dans un hall de
compétition où d'autres équipes font tourner ROS sur le même Wi-Fi, les nœuds étrangers
apparaissent dans le graphe. C'est une cause plausible — estimée, non démontrée — de
comportement erratique en compétition, invisible au laboratoire.

Trois garde-fous obligatoires :

1. `ROS_DOMAIN_ID` propre à l'équipe, documenté.
2. Découverte restreinte à la machine locale sur la Pi (`ROS_AUTOMATIC_DISCOVERY_RANGE`).
3. **Aucun participant DDS sur le lien Wi-Fi.** Mât, télémétrie et PAMI passent par une
   passerelle applicative, jamais par DDS distant.

---

## 5. Navigation

### 5.1 Ce que Nav2 apporte

- **Trajectoires dynamiques** : replanification permanente, contournement plutôt qu'arrêt.
- **Zones interdites** : filtres de coûts (`keepout_filter`) et de vitesse
  (`speed_filter`), par simple image de configuration, sans code.
- **Objectifs** : action de navigation standard avec annulation, préemption et retour
  d'état.

### 5.2 Configuration retenue [PROPOSÉ]

| Élément | Choix | Justification |
|---|---|---|
| Localisation | **Pas d'AMCL** | Voir 5.3 |
| Carte | Grille d'occupation statique, 1 cm/px | 300 × 200 px, coût négligeable |
| Planificateur global | Smac Planner | Chemins réalisables pour un différentiel |
| Fréquence de replanification | 5–10 Hz | Fixe la latence d'évitement |
| Contrôleur local | **Non utilisé** | Remplacé par la poursuite sur STM32 |
| Zones interdites | `keepout_filter` | Configuration, pas de code |
| Couche obstacles | Lidar (publié par la couche 1) + positions issues du mât | Adversaire injecté comme obstacle |

Ne pas utiliser le contrôleur local de Nav2 est la conséquence directe du choix 4.2. Cela
allège aussi nettement la charge processeur.

### 5.3 Localisation : pourquoi pas d'AMCL

Le lidar est monté haut pour voir les balises des robots. À cette hauteur il ne voit pas
les bordures de table : un recalage par correspondance de scan sur les murs est inopérant,
il n'y a pas de murs dans le champ. AMCL et le SLAM sont hors sujet.

La pose vient de trois sources hiérarchisées :

1. **Odométrie de la carte moteurs** — source de vérité, haute fréquence.
2. **Recalage par contact** — bourrage contre une bordure connue, précision
   millimétrique, en début de match et après tout choc.
3. **Correction du mât** — pose absolue, basse fréquence, latence de 100 à 200 ms.

Le mât **n'écrase jamais** la pose : sa correction passe un test d'innovation, et au-delà
d'un écart de l'ordre de 15 cm elle est rejetée avec levée d'alerte, plutôt que de
téléporter le robot. Application de préférence à vitesse faible.

Une quatrième source a été envisagée puis écartée : la localisation par amers passifs sur
les supports de balise fixe, dont les positions sont données au millimètre par le
règlement. Motif du rejet en 16.2.

**Le recalage par contact se fait pendant les trois minutes de préparation**, pas pendant
le match. H.1 autorise explicitement le robot et ses actionneurs à bouger pendant cette
phase. C'est un gain de plusieurs secondes sur les cent du match, et cela rend la pose
initiale fiable sans rien coûter. Deux exigences en découlent : la séquence de recalage
doit être lancée depuis l'IHM et tenir largement sous les trois minutes, et elle doit
**ramener le robot dans sa zone de départ**, sous peine des 50 points de H.4.

### 5.4 Dimensionnement de l'évitement — calcul corrigé

**La v0.2 contenait une erreur d'addition.** Le tableau annonçait 32 cm de distance
d'arrêt totale comme somme de latences et de freinage qui donnent en réalité 44 à 52 cm.
Conséquence : le rayon de détection de 40 à 50 cm annoncé n'avait pas de marge, il en
avait une négative.

| Grandeur | Valeur | Origine |
|---|---|---|
| Cadence de mesure | 5000 pts/s | Fiche technique C1 |
| Fréquence de rotation | 10 Hz | Configuration standard |
| Points par tour | 500 | Calcul |
| Résolution angulaire | 0,72° | Calcul |
| Écart entre points à 1 m | 1,26 cm | Géométrie |
| Zone morte | 5 cm | Fiche technique C1 |
| Latence de détection | 150–250 ms | Tour lidar + traitement, estimé |
| Latence de replanification | ~200 ms | À 5 Hz |
| **Latence totale** | **350–450 ms** | Somme |
| Distance parcourue pendant la latence, à 0,8 m/s | 28–36 cm | Calcul |
| Freinage à 0,8 m/s sous 2 m/s² | 16 cm | Cinématique |
| **Distance d'arrêt totale, obstacle statique** | **44–52 cm** | Somme corrigée |
| **Face à un adversaire à 1 m/s** (rapprochement 1,8 m/s) | **~80 cm** | Calcul |

Un adversaire à 1 m/s parcourt 10 cm entre deux tours de lidar. La zone morte de 5 cm du
C1 est un bon point : un obstacle collé au robot reste visible.

Ces valeurs supposent une décélération de 2 m/s² qui n'est pas mesurée. Elles ne servent
donc qu'à dimensionner un ordre de grandeur ; la règle applicable est en 5.5.

### 5.5 Politique de freinage [ACTÉ]

Le chiffre de distance de sécurité n'est pas figé à ce stade, et il ne doit pas l'être :
il dépend de paramètres que seule la campagne d'identification donnera. Ce qui est figé
maintenant, c'est **la forme de la règle**, parce qu'elle détermine ce que la campagne doit
mesurer.

Distance de sécurité calculée à l'exécution :

```
d_sécurité = v² / (2 · a_freinage) + v · T_réaction + marge
```

`a_freinage` sort de la campagne d'identification (6.2). `T_réaction` se mesure en
enregistrant le délai entre l'apparition d'un obstacle et le début de décélération
effective. **Les deux sont des paramètres du fichier de configuration, jamais des
constantes dans le code.** Tant qu'ils ne sont pas mesurés, on prend des valeurs
pessimistes et on bride `v_max`.

Trois régimes de freinage, à distinguer dans le firmware :

1. **Décélération douce sur trajectoire** — `PAUSE` normal, obstacle détecté à distance.
2. **Freinage maximal** — obstacle dans la zone critique.
3. **Arrêt libre roue** — blocage mécanique détecté, pour ne pas forcer.

Le seuil entre les régimes 1 et 2 reste ouvert et se tranchera après identification.

### 5.6 Risque assumé

Nav2 est le type de système dont la défaillance a coûté la dernière compétition. Le mode
dégradé n'est acceptable que s'il est **testé** — voir 13.3.

---

## 6. Modélisation physique du robot

### 6.1 Périmètre retenu [ACTÉ]

Le minimum utile : masse, frottement, adhérence, modèle moteur. Pas de modèle dynamique
analytique complet — inerties, constantes de couple, frottements secs et visqueux
identifiés séparément — qui représenterait trois semaines de travail pour un résultat que
l'expérimentation donne en une journée, en incluant ce que le modèle oublie toujours : jeu
du réducteur, souplesse du châssis, état du revêtement.

Sont produits en plus, parce que Nav2 les exige de toute façon : un **URDF** (repères,
empreinte au sol, position du lidar et de la caméra) et le **modèle cinématique**
différentiel.

### 6.2 Campagne d'identification

| Paramètre | Méthode | Durée |
|---|---|---|
| Entraxe codeurs, rayons effectifs | Carré de 2 m dans les deux sens | 2 h |
| Constante de temps moteur τ | Échelon de consigne, 10 essais | 1 h |
| Gain vitesse/PWM, zone morte | Rampe lente | 1 h |
| Accélération avant patinage | Rampes croissantes, écart odométrie / réel | 2 h |
| Adhérence effective, `a_freinage` | Freinage maximal, mesure de distance | 1 h |
| `T_réaction` de la chaîne complète | Obstacle surgissant, mesure du délai | 1 h |

Environ une journée.

Le parcours en carré dans les deux sens de rotation est la procédure de référence : elle
sépare l'erreur d'entraxe de l'erreur de rayon différentiel, ce qu'un simple aller-retour
ne fait pas.

Le **patinage des roues codeuses folles** est le paramètre le plus important et le seul
qui ne se calcule pas : il ruine l'odométrie sans arrêter le robot, donc sans alarme. Une
première estimation : pour une base d'environ 8 kg sur PVC, l'adhérence donne une
accélération théorique proche de 6 m/s², mais la limite réelle vient du patinage et du
renversement de la charge. Les valeurs utiles se situent entre 0,5 et 1,5 m/s et entre 1
et 2 m/s².

Résolution attendue : avec une roue codeuse de 48 mm de diamètre — circonférence
150,8 mm — un module 12 bits donne 0,037 mm par pas, largement suffisant.

Deux paramètres s'ajoutent à la campagne parce que d'autres sections en dépendent :
`a_freinage` et `T_réaction` pour la politique de freinage (5.5), et le **profil de courant
sur un match normal** pour régler les seuils de surintensité (11.2). Le tampon
d'identification enregistre déjà le courant, donc l'outil existe.

### 6.3 Mode identification sur la carte moteurs [ACTÉ]

**Rien de ce qui précède n'est mesurable sans instrumentation.** La carte moteurs expose un
**mode d'identification** : injection d'une consigne définie — échelon, rampe, créneau — et
journalisation horodatée de la réponse. C'est le premier morceau de firmware à écrire,
avant même la poursuite de point cible.

**Architecture retenue : tampon RAM puis dump CAN après essai.** La question v0.2 « USB ou
CAN » est tranchée en faveur du CAN, mais pas sous la forme envisagée. Ce qui est
impossible, c'est le streaming à 1 kHz pendant un déplacement ; le dump après essai, robot
à l'arrêt, ne pose aucun problème.

Dimensionnement, à 10 octets par échantillon (horodatage 16 bits en pas de 100 µs, plus
consigne, vitesse gauche, vitesse droite et courant en int16) :

| Microcontrôleur | RAM disponible estimée | Échantillons | Durée à 500 Hz |
|---|---|---|---|
| F303K8 actuel | ~8 Ko | 800 | 1,6 s |
| G474RE envisagé | ~100 Ko | 10 000 | 20 s |

Une réponse indicielle de base roulante a une constante de temps de l'ordre de 100 à
300 ms. Même 1,6 s couvre le transitoire et l'établissement, avec 50 à 150 points sur τ.
Le F303K8 suffit ; le G4 donne du confort, pas une capacité nouvelle.

Coût du dump : 800 échantillons de 10 octets font 1000 trames de 8 octets, soit 0,5 s en
n'occupant que la moitié du bus. Rien d'autre ne circule, le robot est immobile.

**Trois flux distincts** — c'est ce découpage qui permet de garder le CAN et l'IHM :

| Flux | Débit | Rôle |
|---|---|---|
| Commande | Quelques trames | `IDENT_START(type, amplitude, durée)` depuis l'IHM |
| Suivi en direct | 20–50 Hz, échantillons décimés | Courbe affichée pendant l'essai, l'opérateur voit un essai raté avant la fin |
| Dump fin | Après l'essai, par blocs indexés avec accusé | Données à pleine résolution |

**Interdit au niveau firmware :** `IDENT` et une file de waypoints active sont mutuellement
exclusifs. Refus explicite, pas un simple avertissement.

Le passage à un module codeur à sortie **A/B et SPI** simplifie l'acquisition : la voie
A/B se lit sur un timer en mode codeur, sans charge processeur ni gigue, contrairement à
une interrogation périodique en I²C.

### 6.4 Interface de calibration

L'IHM existante (1.5) est étendue d'un **onglet de calibration et d'identification** :
lancement des séquences, affichage en direct de la courbe de réponse pendant l'essai,
récupération du dump, saisie et enregistrement des paramètres identifiés. Les paramètres
sont stockés dans un fichier de configuration versionné, jamais codés en dur.

### 6.5 Simulation

**[ACTÉ] Simulateur cinématique maison d'abord.** En Python, sans physique : suffit à
valider le moteur de stratégie et l'enchaînement des actions. Deux à trois jours.

**Sa priorité monte.** Ce même simulateur est le moteur de la comparaison contrefactuelle
demandée par LOG-EXJ-14 : dès qu'on modifie une décision, les données enregistrées cessent d'être
valides et il faut propager la suite. Conformément à 5.7, cette exploration n'a pas lieu dans
le lecteur mais dans le simulateur, alimenté par le scénario d'LOG-EXJ-12. Le simulateur
cinématique, le fichier de description des actions et la trajectoire adverse rejouée en
boucle ouverte forment ensemble ce moteur. Un seul outil sert donc à valider la stratégie
hors robot et à explorer les autres branches d'un match réel.

**[REPORTÉ] Gazebo.** Permet de tester Nav2 sans robot, ce qui compte quand plusieurs
personnes se partagent une seule machine, mais coûte une à deux semaines plus une
dépendance à maintenir. Décision reportée à décembre, ou plus tôt si le partage du robot
devient le goulot d'étranglement de l'équipe.

---

## 7. Contrat de la carte moteurs

### 7.1 Principe

La Pi ne transmet **jamais un profil de vitesse**. Elle transmet un **but et des
contraintes** ; la carte moteurs génère son propre profil. C'est ce qui rend le mouvement
robuste à une latence variable côté Pi.

### 7.2 Messages

**Pi → carte moteurs**

| Message | Charge utile | Rôle |
|---|---|---|
| `PATH_BEGIN` | `seq, nb_points, v_max, a_max, sens` | Ouvre une nouvelle file |
| `PATH_POINT` | `seq, index, x, y` | Un waypoint |
| `PATH_END` | `seq, θ_final, mode_fin` | Clôt la file, la rend active |
| `GOTO` | `id_cmd, x, y, θ, v_max, a_max, sens` | Consigne unique, accostage |
| `PAUSE` | `régime` | Freine sur la trajectoire en cours, selon 5.5 |
| `RESUME` | — | Reprend sans replanifier |
| `ABORT` | `seq` ou `id_cmd` | Annule |
| `SET_POSE` | `x, y, θ` | Recalage (contact, mât validé) |
| `IDENT_START` | `type, amplitude, durée` | Mode identification (6.3) |
| `IDENT_DUMP` | `index_bloc` | Demande de restitution d'un bloc |
| `SYNC_PING` | `t_pi` | Sondage de synchronisation d'horloge (7.3) |
| `MATCH_T0` | `horodatage du front de tirette` | Arme la minuterie de match de la carte (7.3) |
| `SAFE_PARK` | — | Rangement des actionneurs en position sûre |

Le **numéro de séquence** est le mécanisme central : une file dont le `seq` est plus récent
remplace la file courante sans arrêt du robot. Une file incomplète — `PATH_END` non reçu —
est ignorée.

**Carte moteurs → Pi**

| Message | Charge utile | Fréquence |
|---|---|---|
| `ODOM` | `x, y, θ, v, ω, horodatage STM32` | 100 Hz |
| `STATUS` | `seq, index_courant, état, distance_restante, écart_latéral` | 20–50 Hz |
| `IDENT_LIVE` | échantillon décimé | 20–50 Hz, en mode identification |
| `IDENT_BLOCK` | bloc de dump indexé | Sur demande |
| `FAULT` | `code_cause, contexte` | Sur événement, priorité haute |
| `HELLO` | `empreinte_protocole, version_firmware` | Au démarrage et sur demande |

`état` : repos, en mouvement, en pause, bloqué, atteint, erreur.

Les trames `FAULT` et `HELLO` sont communes à toutes les cartes, pas seulement à la carte
moteurs — voir 8.4 et 16.3.

### 7.3 Points critiques

**`PAUSE` / `RESUME` est le mécanisme d'urgence.** Freiner sur la trajectoire courante puis
reprendre résout l'essentiel des situations, bien mieux qu'un arrêt suivi d'une nouvelle
consigne, qui perd le contexte du mouvement.

**Le remplacement de file doit être sans à-coup.** Si la carte moteurs marque un arrêt à
chaque nouvelle file reçue à 10 Hz, le robot n'avance plus. C'est le point de
vérification numéro un du firmware.

**Base de temps entre la STM32 et la Pi. [ACTÉ]**

L'horodatage de l'odométrie est produit par la STM32, pas par la Pi. La v0.2 s'arrêtait là,
ce qui laissait un trou : rien ne disait comment convertir cet horodatage vers l'horloge de
la Pi pour alimenter les repères ROS.

La pratique de l'édition précédente — la Pi horodate à la réception — a une gigue égale à
la latence CAN plus l'ordonnancement Linux. En régime nominal, 1 à 5 ms, soit 4 mm à
0,8 m/s, ce qui ne se voit pas. **Le problème n'est pas la moyenne, c'est la queue de
distribution** : sous charge, un pic à 100 ms fait 8 cm d'erreur de recalage, sans aucun
signal d'alarme.

L'objectif n'est donc pas une horloge parfaite mais un **décalage borné et mesuré**.

Mécanisme retenu, logiciel : la STM32 place son propre compteur microseconde dans chaque
trame `ODOM`. La Pi enregistre les couples (horodatage STM32, instant de réception) et
estime en continu décalage et dérive par régression sur les échantillons de latence
minimale — le filtre du minimum, comme NTP. Après quelques secondes, la précision est
sous la milliseconde, et on obtient en prime une mesure permanente de la latence du bus,
qui est un bon indicateur de santé.

Deux points de vigilance. Le recalage doit être **continu**, pas fait une fois au début du
match : le quartz dérive. À 100 ppm, l'écart accumulé sur 100 s vaut 10 ms, encore
acceptable. Et il faut **vérifier que le firmware tourne sur le HSE et non sur le HSI** :
avec l'oscillateur interne, la dérive se compte en milliers de ppm et le décalage devient
absurde en fin de match. C'est un piège classique de la Nucleo-32, et c'est une
vérification de dix minutes, et elle se fait **carte alimentée par le robot, sonde de
programmation débranchée** : sur une carte de développement, ce que le microcontrôleur voit
comme horloge externe vient souvent de la sonde, et la bibliothèque bascule silencieusement
sur l'oscillateur interne quand elle disparaît. Mesurer la configuration du banc revient à
mesurer une configuration qui n'existe pas en match.

Relecture du dépôt du firmware moteurs : aucune configuration d'horloge explicite n'y figure,
ni dans le projet ni dans les options de compilation. L'hypothèse de l'oscillateur interne
est la plus probable ; elle reste estimée.

Le relevé de bus de l'édition précédente donne une borne, pas une réponse. Les périodes
d'émission mesurées contre l'horloge de la Pi valent +1 260 ppm pour la carte moteurs et
+460 ppm pour la carte alimentation, écarts qui mélangent l'horloge, le dépassement de
période propre au mécanisme logiciel de chaque carte et la datation à la réception. Ce qu'ils
montrent sans ambiguïté : **les deux cartes divergent déjà d'environ 800 ppm entre elles**,
soit quatre-vingts millisecondes sur un match. C'est huit fois le budget admis ci-dessus, et
c'est la raison pour laquelle l'estimation continue du décalage reste nécessaire même si les
cartes 2027 reçoivent un quartz. Le quartz, lui, coûte deux pastilles : c'est un arbitrage à
rendre avant routage, pas après.

Une synchronisation matérielle par fil dédié a été étudiée puis écartée. Voir l'annexe A.

**Minuterie de fin de match, tenue par le firmware. [ACTÉ]**

H.3 impose l'arrêt à 100 secondes, H.4 sanctionne de 50 points un robot qui bouge encore,
et I.3.b vérifie la minuterie à l'homologation. Placer cette échéance uniquement dans la
machine à états de la Pi revient à faire dépendre une pénalité certaine du processus dont
tout le reste du document organise la défaillance possible.

**Chaque carte porteuse d'actionneurs — moteurs comprise — démarre son propre décompte sur
`MATCH_T0` et coupe le mouvement à échéance, sans rien attendre de la Pi.** La Pi déclenche
le repli bien avant ; le firmware est le filet.

Ce que la coupure ne doit surtout pas faire : ouvrir la puissance des actionneurs. Un bras
levé qui retombe, c'est une pièce perdue sur l'aire de jeu (−20 points) ou une dégradation
de la table (−30 points), pour avoir voulu respecter la règle trop littéralement. La
séquence correcte est en 11.4 : rangement en position sûre **avant** l'échéance, puis à
100 s arrêt de tout mouvement et maintien en position. Les afficheurs peuvent rester
allumés, H.3 l'autorise explicitement.

Le décompte du firmware doit être plus long que celui de la Pi d'une marge de sécurité, de
l'ordre de 200 ms, pour que la coupure normale se produise toujours avant la coupure de
secours et que le filet ne se déclenche jamais en fonctionnement nominal.

**Chien de garde.** Absence de toute trame de la Pi pendant 300 ms : la file courante est
terminée puis le robot s'arrête. Contrairement à une commande de vitesse, une file de
waypoints reste exécutable sans la Pi, ce qui est un gain de robustesse.

### 7.4 Poursuite de point cible

Distance d'anticipation d'environ 20 cm à 0,8 m/s, à adapter à la vitesse. Deux modes de
fin de file, à préciser dans `mode_fin` : arrêt à la dernière pose avec orientation
imposée (accostage), ou enchaînement direct sur la file suivante (transit).

---

## 8. Bus CAN

### 8.1 Le débit n'est pas un problème

**[ACTÉ — reste à 500 kbit/s]**

À 500 kbit/s, une trame standard de 8 octets occupe environ 130 bits une fois le bit
stuffing pris en compte, soit 260 µs. Saturation théorique vers 3800 trames par seconde.

| Flux | Fréquence | Trames/s |
|---|---|---|
| Odométrie (2 trames) | 100 Hz | 200 |
| État carte moteurs | 50 Hz | 50 |
| Files de waypoints (6 trames) | 10 Hz | 60 |
| Alimentation, 4 rails | 10 Hz | 40 |
| Capteurs, 4 cartes | 50 Hz | 200 |
| Divers, commandes | — | ~30 |
| **Total** | | **~580** |

Soit **15 % de charge**, latence d'une trame prioritaire sous la milliseconde. Passer à
1 Mbit/s dégraderait la marge de compatibilité électromagnétique pour un gain nul.

Le mode identification (6.3) ne coexiste jamais avec un déplacement ; son dump occupe
environ la moitié du bus pendant une demi-seconde, robot immobile.

**Le CAN est le seul chemin de signalisation entre cartes.** L'option d'une ligne
matérielle parallèle a été écartée (annexe A). Cela renforce l'exigence sur les trames
prioritaires `PAUSE` et `FAULT` : elles doivent occuper le haut du plan d'identifiants et
leur émission ne doit dépendre d'aucune allocation dynamique.

### 8.2 Plan d'allocation des identifiants [PROPOSÉ]

Découpage en champs plutôt qu'en plages, sur les 11 bits d'un identifiant standard :

| Bits | Champ | Rôle |
|---|---|---|
| 10–8 | Priorité (3 bits) | 0 = urgence. L'arbitrage CAN donne la priorité gratuitement |
| 7–4 | Type de message (4 bits) | 16 familles |
| 3–0 | Émetteur (4 bits) | 16 cartes |

Avantage du découpage en champs : les filtres matériels se configurent par masque sur le
champ de type, ce qui évite à chaque carte de réveiller son processeur pour des trames qui
ne la concernent pas. Le F303K8 dispose de 14 banques de filtres, largement assez.

Règle de gestion : **un identifiant n'est jamais réattribué d'une année sur l'autre.** Un
identifiant retiré reste retiré.

### 8.3 Registre des trames — tranché

**[ACTÉ] DBC, avec `cantools` comme outillage.** Essai comparatif réel mené sur cinq
trames représentatives (`ODOM`, `GOTO`, `PATH_POINT`, `IDENT_BLOCK`, `FAULT`), pack/unpack
générés et compilés, décodage vérifié dans SavvyCAN — voir la fiche 17.3 pour le détail et
les fichiers de l'essai.

Résultats vérifiés : le C généré par `cantools` pour l'emballage et le déballage est
intégralement en entiers, aucune occurrence de flottant dans le corps des fonctions
`_pack`/`_unpack` (le flottant n'apparaît que dans les fonctions annexes de conversion
physique, non nécessaires si le firmware travaille en unités brutes). Le décodage dans
SavvyCAN a été vérifié correct sur les cinq trames, y compris la table de valeurs de
l'énumération `FAULT` (labels natifs) et le signal brut de 48 bits d'`IDENT_BLOCK`
(décodage exact, sans troncature, sur l'implémentation testée).

**Ce que le format maison n'a pas égalé.** Un générateur maison de 100 lignes, écrit pour
la comparaison, a produit une anomalie réelle (regroupement erroné d'un champ énuméré dans
une structure de bitfield) dès son premier usage. `cantools` n'a produit aucune anomalie
sur le même périmètre. C'est le critère de charge de maintenance qui a le plus pesé dans
la décision, davantage que la différence d'élégance sur `IDENT_BLOCK`.

*Ce que cet essai ne tranche pas :* le plan d'identifiants en champs de 8.2 reste
[PROPOSÉ] — l'essai a porté sur le format d'encodage des trames, pas sur l'allocation des
identifiants CAN eux-mêmes.

*Historique :* les deux options ont été décrites en détail avant l'essai — DBC d'un côté,
format maison (YAML + générateur) de l'autre — sur les critères suivants, tous vérifiés :
taille et empreinte RAM du C généré, gestion du signé et de l'échelle en entiers purs,
expressivité du multiplexage, décodage automatique dans SavvyCAN, charge de maintenance.
Pronostic initial du document, partiellement infirmé : un résultat hybride était anticipé,
DBC perdant sur les trames sans structure en signaux. En pratique, DBC est moins élégant
sur ce cas (`IDENT_BLOCK` force un entier 48 bits plutôt qu'un tableau d'octets) mais ne
casse pas, et la maturité de l'outil a fait la différence.

### 8.4 Empreinte de protocole et remontée de défaut [ACTÉ]

**Empreinte.** Le registre (8.3) est haché à la compilation et la valeur injectée dans un
`#define`. Chaque carte émet son empreinte et sa version de firmware dans une trame `HELLO`
au démarrage et sur demande. La Pi compare avec la sienne.

**Ce que la Pi fait de la comparaison : elle l'affiche, elle ne bloque rien.** Application
directe de P6. Une carte dont l'empreinte diffère est signalée en rouge sur l'onglet d'état
du système (16.3) et le fait est journalisé au moment du départ, mais la tirette reste
active. Cela supprime la classe de bugs « cette carte tourne encore avec l'ancien
firmware » sans introduire un mécanisme capable de faire perdre un match.

**Remontée de défaut.** Toute carte qui détecte une condition anormale émet `FAULT` avec
son identité, un code de cause et deux ou trois octets de contexte. Codes minimaux à
prévoir : perte de voie codeur, écart de poursuite excessif, actionneur en butée, blocage
mécanique, surintensité, sous-tension, empreinte de protocole incohérente.

**[PROPOSÉ] LED de défaut mémorisée par carte.** Le CAN étant désormais le seul chemin de
signalisation, il reste un angle mort : un défaut survenu alors que le bus est tombé
n'est plus diagnosticable. Une LED par carte, allumée à la levée d'un défaut et maintenue
jusqu'à acquittement même si la condition disparaît, coûte un composant et un GPIO et
fonctionne avec le CAN mort, la Pi éteinte ou le firmware planté. C'est le seul moyen de
diagnostic restant dans ce cas. À arbitrer avec l'équipe électronique pendant la refonte
des cartes.

### 8.5 Passerelle vers ROS [ACTÉ]

Le protocole reste maison. Une passerelle traduit vers ROS pour la couche 2, **en lecture
seule** : la couche ROS observe le bus, elle ne l'écrit pas.

Mise en œuvre par `ros2_socketcan`, qui fournit un nœud recevant les trames brutes en
`can_msgs/Frame` et un nœud émetteur symétrique. La passerelle s'abonne aux trames brutes
et les décode vers les messages ROS typés, avec le code généré en 8.3.

L'argument décisif pour passer par cette bibliothèque plutôt que d'ouvrir SocketCAN
directement : le flux de trames brutes peut être **enregistré dans un rosbag et rejoué**.
En cas de doute sur un comportement, on rejoue l'enregistrement et on sait immédiatement si
le bug est dans le décodage ou dans le firmware. Sur un protocole maison, ça vaut plusieurs
soirées.

Deux conséquences. À 580 trames par seconde, un nœud récepteur dans un processus séparé
coûterait une sérialisation par trame : il est **composé dans le processus `core`**, cas
d'usage direct de 4.3. Et `ros2_socketcan` étant en C++, cela confirme que le noyau est en
C++ et non en Python.

*À vérifier avant de s'engager :* disponibilité binaire du paquet pour la distribution
retenue.

---

## 9. Perception

### 9.1 Lidar — remonté en couche 1 [ACTÉ]

Détection d'obstacles dynamiques exclusivement, pas de localisation (voir 5.3).

**Le pilote lidar appartient à la couche 1, pas à la couche 2.** Motif : `PAUSE` est le
mécanisme d'urgence du système, il est déclenché par une observation lidar, et la couche 2
a explicitement le droit de mourir (P3). Laisser la détection dans la couche non fiable
revient à faire dépendre l'urgence de ce qui peut disparaître, ce qui contredit P4.

Le transfert du port série à la mort d'un processus n'est pas une option : le RPLIDAR est
un port série USB, un seul processus l'ouvre à la fois, et un mécanisme de reprise qui ne
s'exerce qu'au moment d'une panne est précisément celui qui ne marche pas le jour où il
sert.

Architecture retenue : le pilote vit dans le processus `core`, publie `/scan` que Nav2
consomme en tant qu'abonné ordinaire, et un **réflexe obstacle** placé à côté de lui émet
`PAUSE` sur seuil radial dans un secteur avant. Aucune costmap, aucune replanification dans
ce chemin.

**Contrat du pilote — exigences explicites.** Le point délicat est qu'on place un pilote USB
dans le processus qui ne doit jamais tomber. Il doit donc :

- tourner dans son propre thread, avec toutes les exceptions rattrapées ;
- reconnecter en boucle sur perte du périphérique, sans intervention ;
- **dégrader en « pas de réflexe » plutôt que faire tomber le processus** ;
- signaler son état sur l'onglet d'état du système, et journaliser chaque reconnexion ;
- ne jamais allouer de mémoire dans le chemin de détection.

Le secteur angulaire, le seuil et l'hystérésis du réflexe sont des paramètres de
configuration, pas des constantes.

**Filtrage spatial obligatoire.** Avec 12 mètres de portée, le lidar voit très largement
au-delà des bordures : arbitres penchés sur la table, équipe adverse, décor. F.5 prévient
d'ailleurs qu'on ne peut demander à personne de s'écarter. Un réflexe par simple seuil
radial freinerait donc à chaque fois qu'un arbitre s'approche, ce qui est une perte sèche
sur cent secondes.

Nav2 traite déjà ce cas par les bornes de sa costmap. **Le réflexe de la couche 1 ne passe
pas par la costmap et doit donc filtrer lui-même** : tout retour dont la projection dans le
repère table tombe hors du rectangle de jeu est ignoré. Cela demande la pose courante, qui
arrive de toute façon sur le CAN dans le même processus. Le coût est de quelques opérations
par point, sans allocation.

Une marge est à prévoir : un adversaire collé à la bordure doit rester détecté malgré
l'erreur de pose. Rejeter au-delà de la bordure plus dix centimètres est un point de départ
raisonnable, à affiner sur table.

**[PROPOSÉ] Capteurs de distance de secours.** Deux ou trois VL53L1X sur une carte capteur
CAN, à l'avant et à l'arrière, donneraient un réflexe totalement indépendant de la Pi et du
lidar pour une dizaine d'euros. Les cartes capteurs étant refaites chaque année, le coût
marginal est faible. À arbitrer avec le reste de la refonte électronique.

Caractéristiques et dimensionnement en 5.4.

### 9.2 Caméra embarquée

**Point de blocage résolu.** Le problème n'était ni ROS ni la conteneurisation : sur
Ubuntu, le paquet `libcamera` distribué est la version amont, qui n'embarque pas les
gestionnaires de pipeline Raspberry Pi (`rpi/vc4`, `rpi/pisp`). Sans eux, le système ne
peut pas dialoguer avec le capteur IMX708 du Module 3, qui n'est supporté que par le fork
Raspberry Pi de libcamera. Il n'existe pas de contournement par paquet.

Marche à suivre : compiler le fork Raspberry Pi de libcamera depuis les sources, puis
`camera_ros` par-dessus dans l'espace de travail colcon. Environ 15 à 20 minutes de
compilation, une seule fois.

**Charge de calcul, estimée.** Détection de marqueurs type ArUco ou AprilTag en 640 × 480 :
20 à 30 images par seconde sur processeur seul, confortable. Détecteur neuronal léger en
640 : 3 à 6 images par seconde — insuffisant pour du réactif, acceptable pour une
identification ponctuelle à l'arrêt. Le temps réel exigerait un accélérateur externe.

---

## 10. Dispositif de calcul et d'observation déporté

### 10.1 Rôle et contraintes

Unité de calcul propre, fixée sur la plateforme partagée du bord de fond de table.
Contraintes dimensionnelles et de fixation en 1.4. Sorties attendues : pose du robot de
l'équipe, pose du robot adverse, éventuellement obstacles mobiles. Il héberge en outre le
serveur PAMI et le point d'accès Wi-Fi (14.1).

Le Wi-Fi 5 GHz en salle de compétition est très encombré ; les pertes sont à considérer
comme normales, pas comme un incident. Le mât ne peut être dans aucune boucle critique.
**Le robot doit jouer un match complet, mât déconnecté.** Mécanisme de correction en 5.3.

Le mât n'est jamais un participant DDS et n'écrit jamais sur le bus CAN. Il parle à la
passerelle applicative de la couche 2 (4.5).

### 10.2 Calibration : résolution de pose, continue

Les quatre tags ArUco fixes aux coordonnées connues donnent mieux qu'une homographie : ils
permettent de résoudre la **pose complète de la caméra** par `solvePnP`.

La différence n'est pas académique. Une homographie ne donne la position correcte que pour
des objets situés dans le plan de la table, alors que le marqueur d'un robot est à plus de
430 mm de hauteur. En ignorant cette hauteur, on introduit une erreur de parallaxe qui
croît avec la distance au centre de l'image et qui se compte en centimètres. Avec la pose
complète et la hauteur de marqueur connue, l'erreur disparaît.

**La calibration est continue, pas initiale. [ACTÉ]** Deux raisons distinctes. Le temps de
préparation est de trois minutes pour l'ensemble du placement (H.1), ce qui exclut toute
procédure manuelle. Et G.4 annonce explicitement que le dispositif subit les vibrations
dues aux déplacements des robots, donc une pose établie au démarrage ne tient pas les cent
secondes.

**Gestion des occultations.** Un match est vivant : un robot de 350 mm de haut peut masquer
un tag de table, et le nombre de tags visibles varie en permanence. Règle retenue :

| Tags visibles | Comportement |
|---|---|
| 4 | Ré-estimation nominale, filtrée dans le temps |
| 3 | Ré-estimation dégradée, poids réduit, indicateur de confiance abaissé |
| 2 ou moins | Pose figée sur la dernière estimation valide, confiance marquée dégradée |
| Moins de 3 pendant plus de N secondes | Arrêt de l'émission des corrections de pose |

Deux précautions sur l'estimation elle-même. **Rejeter les valeurs aberrantes en amont,
filtrer peu en aval** : un filtre plus lent que l'oscillation de la structure moyenne une
pose que la caméra n'a jamais eue. La fréquence de coupure doit rester au-dessus du premier
mode propre du mât. Motif complet et chiffres dans le CDC mât, section 5, qui corrige la
règle de filtrage lent énoncée dans les versions précédentes de ce document. Et chaque tag
doit être **rejeté sur son erreur de reprojection**, sans quoi une détection partielle ou un
reflet contamine la pose entière.

La valeur de N et le seuil de rejet sont des paramètres de configuration.

### 10.3 Ce que le mât suit : la tranche colorée, pas le tag

**[PROPOSÉ]** Le dimensionnement impose ce choix. La caméra est à environ 1,67 m au-dessus
du plan de jeu — 1,6 m au-dessus d'une plateforme elle-même à 70 mm — et le marqueur
d'identification est à 430 mm de hauteur. Le dénivelé utile n'est donc que de 1,24 m, pour
une distance horizontale qui atteint 2,5 m au coin opposé.

L'angle d'incidence au coin lointain vaut ainsi 64° par rapport à la verticale, et le tag
ArUco de 70 mm de côté se réduit à 31 mm dans la direction de la fuite. Avec le champ large
nécessaire pour couvrir la table, cela fait moins de cinq pixels par cellule d'un tag
4 × 4 à résolution utilisable, et la détection échoue dans la moitié lointaine. Ces chiffres
sont estimés, mais l'ordre de grandeur ne laisse pas de marge.

G.6 offre la sortie par le haut : le marqueur fait 100 mm de côté, porte un contour de 5 mm
à la couleur de l'équipe, et **la couleur occupe aussi sa tranche**, épaisse de 20 mm. Vue
sous 64° d'incidence, cette tranche est largement visible — c'est même la face la mieux
présentée à la caméra dans les coins lointains, exactement là où le tag disparaît. L'annexe
J.3 du règlement donne les références : bleu signalisation RAL 5017, jaune signalisation
RAL 1023.

**Comment on obtient une position à partir d'une tache colorée.** C'est la question qui
décide de la faisabilité, et la réponse est la même construction géométrique que pour un
tag. La pose de la caméra est connue par 10.2. Le centroïde de la tache donne une direction
d'observation, c'est-à-dire un rayon partant du centre optique. Le marqueur est à une
hauteur connue. **L'intersection de ce rayon avec le plan horizontal à cette hauteur donne
directement les coordonnées sur la table.** Aucune ambiguïté, aucune inconnue résiduelle.

Ce qu'on perd par rapport au tag : l'orientation du robot. Elle n'est pas nécessaire — pour
l'adversaire on ne veut qu'une position, et pour notre propre robot le cap vient de
l'odométrie, qui est bien meilleure que ce qu'une vision rasante donnerait.

Ce qu'on gagne : le centroïde d'une tache de 100 mm s'estime au sous-pixel, alors que la
détection de coins d'un tag écrasé décroche. Précision estimée de l'ordre du centimètre au
coin lointain, largement sous le seuil de rejet de 15 cm du test d'innovation (5.3).

**Hauteur du marqueur : deux valeurs possibles.** Le marqueur repose sur le support de
balise à 430 ± 5 mm, ou sur la balise embarquée de l'adversaire si celui-ci en pose une,
soit 510 mm. En ajoutant l'épaisseur de 20 mm, le centre de la tranche colorée est à
environ 440 mm ou 520 mm. **C'est un paramètre par robot et par match**, à saisir pendant la préparation, comme la
couleur d'équipe. L'endroit de la saisie — IHM du robot ou page du mât — reste [OUVERT],
voir le CDC mât, section 10. Une erreur de 80 mm sur cette hauteur se traduit par
80 × 2500 / 1230 ≈ **163 mm d'erreur de position au coin lointain**, soit plus que le seuil
de rejet de 15 cm du test d'innovation (5.3) : le mât devient muet sans le dire.

**Levée d'ambiguïté.** Un seul robot principal par équipe est sur la table, et les PAMI sont
exemptés de mât et de support de balise (F.7), donc ils ne portent aucun marqueur. La
couleur suffit à distinguer notre robot de l'adversaire, à condition que le mât connaisse la
couleur de l'équipe pour le match — même sélecteur que la stratégie. Les fausses détections
dans le public ou le décor sont éliminées par la même règle qu'en 9.1 : toute projection qui
tombe hors du rectangle de jeu est ignorée.

Le tag ArUco reste utilisable de façon opportuniste quand le robot est proche de la caméra,
là où il est lisible, comme raffinement et comme vérification d'identité. Il n'est jamais la
source principale.

*Si nous posons nos propres marqueurs*, G.6 interdit les tags 4 × 4 numérotés de 0 à 50 et
réserve les plages 51 à 70 et 71 à 90 selon la couleur d'équipe, qui change d'un match à
l'autre. Utiliser un dictionnaire **5 × 5 avec des numéros au-dessus de 90** évite d'avoir à
imprimer deux jeux et supprime tout risque de confusion avec les tags de l'organisation.

### 10.4 Cahier des charges dédié — rédigé

*Ce plan a été suivi ; le document existe. La liste ci-dessous en est désormais le sommaire,
avec l'état de chaque point. La source pour tous ces sujets est le CDC mât, pas cette
section.*

1. Rôle et sorties, avec priorité et budget de latence pour chacune.
2. Choix du calculateur — **tranché** : Raspberry Pi 5 8 Go, le critère discriminant étant
   le double port CSI natif. Le calculateur porte aussi le serveur PAMI. Voir CDC mât 7.
3. Intégration du point d'accès Wi-Fi et du serveur PAMI, avec la tirette (14.1).
4. Chaîne de vision : ré-estimation continue de pose (10.2), suivi couleur (10.3),
   paramètres de hauteur de marqueur et de couleur d'équipe. **Deux caméras sont
   nécessaires**, une seule ne pouvant couvrir les coins proches (CDC mât 2).
5. Format du message de pose : horodatage dans la base de temps du mât, plus covariance ou
   au minimum un indicateur de confiance.
6. Comportement si le robot ne répond plus.
7. Mécanique et fixation : 450 × 320 mm, 1,6 m, 5 kg, tige M8 et écrou papillon, tenue aux
   vibrations.
8. Exigence structurante : **le mât n'a aucun état persistant dont le robot dépend.**

Entrée encore nécessaire : la photo du montage précédent. La taille et la position des
quatre tags de table sont **closes** — 100 mm de côté, à ±900 et ±400 mm du centre, relevées
sur le plan et confirmées dans le CDC mât, section 3.4.

---

## 11. Stratégie

### 11.1 Reformulation de l'objectif

L'objectif exprimé — choisir la meilleure action selon l'avancement de l'adversaire —
suppose d'observer son score. **Ce n'est pas observable** : le mât fournit une pose adverse
à 10–30 Hz avec 100 à 200 ms de latence, rien de plus.

Formulation qui tient : **le monde est un ensemble de ressources et de zones**, chacune
portant un état estimé — libre, incertain, pris — et une confiance qui décroît lorsque
l'adversaire a séjourné à proximité. Le moteur maximise l'espérance de points sous
incertitude d'occupation, il n'optimise pas contre un score inconnu.

### 11.2 Algorithme [PROPOSÉ]

Recherche à horizon glissant sur une matrice de distances précalculée. Avec 15 actions
candidates et un horizon de 3 coups, on évalue 15 × 14 × 13 ≈ 2700 séquences, soit
quelques millisecondes. Replanification toutes les 500 ms ou sur événement :
action terminée, action devenue impossible, adversaire détecté sur une zone convoitée.

Ni recherche arborescente Monte-Carlo ni planificateur symbolique. Le facteur limitant
n'est pas l'algorithme, c'est la pauvreté de l'observation.

Le moteur de stratégie vit dans le processus `strategy` (4.4), séparé du noyau, avec droit
de redémarrage.

### 11.3 Description des actions — le livrable réutilisable

Un fichier de configuration décrit les actions de l'année : position, préconditions,
effets, points, durée estimée, risque, réversibilité. Le règlement change, ce fichier
change, le code ne bouge pas. C'est la mise en œuvre du principe P1.

*Objection :* ce moteur générique coûte trois à cinq fois plus cher qu'une stratégie
scriptée, et si le règlement introduit de fortes dépendances entre actions, des
préconditions ad hoc réapparaîtront dans le code.

**Filet obligatoire :** conserver un mode « séquence forcée », scripté, utilisable en
homologation, pendant un redémarrage du processus `strategy`, et lorsque le moteur produit
un comportement aberrant. Le sélecteur de stratégie de l'IHM existante en est déjà le
support.

### 11.4 Machine à états de match

Le règlement structure le déroulement bien plus finement que la v0.3 ne le reflétait. États
retenus :

| État | Déclencheur | Comportement |
|---|---|---|
| `ATTENTE` | Mise sous tension | Aucun mouvement. Diagnostic, état système, choix de couleur et de stratégie |
| `PREPARATION` | Commande explicite depuis l'IHM | Mouvements autorisés (H.1). Recalage par contact, vérification des actionneurs, retour en zone de départ |
| `PRET` | Fin de la préparation | Immobilité totale. Le bouton d'arrêt d'urgence peut être enfoncé puis relâché sans que rien ne bouge (13.2) |
| `MATCH` | Tirette | Stratégie active. `MATCH_T0` diffusé sur le CAN, les minuteries firmware s'arment |
| `FENETRE_PAMI` | Échéance paramétrée | Comportement défini en 14.6 |
| `REPLI` | Échéance absolue | Retour en zone d'arrivée. Ne dépend jamais de la fin d'une action |
| `RANGEMENT` | Échéance absolue | Actionneurs en position sûre, périmètre replié, hauteur conforme |
| `ARRET` | 100 s | Plus aucun mouvement. Actionneurs maintenus en position, pas dépuissancés (7.3) |

Les échéances de `REPLI` et de `RANGEMENT` sont **absolues et paramétrées**, jamais
déduites de la fin d'une action : c'est une source classique de perte de points. Les valeurs
attendront les règles annuelles ; l'ordre de grandeur est un repli vers 85 secondes et un
rangement vers 95.

**La séquence de fin est la partie que le règlement sanctionne le plus durement**, et elle
se joue en trois pénalités possibles. Bouger encore à 100 s coûte 50 points. Laisser tomber
une pièce en coupant la puissance d'un bras levé en coûte 20. Abîmer la table avec un
mécanisme resté déployé en coûte 30. D'où l'ordre : ranger d'abord, arrêter ensuite, ne
jamais couper.

`PREPARATION` est le seul état, avec `MATCH`, où le robot a le droit de bouger. Le passage
en `PRET` doit être explicite et visible sur l'IHM, parce qu'à partir de là tout mouvement
est un faux départ.

### 11.5 Procédure de préparation — grandes lignes

Le détail se figera avec les règles annuelles, mais la structure est déjà connue et elle
détermine ce que le logiciel doit automatiser. Trois minutes, deux personnes, et la couleur
d'équipe n'est connue qu'au moment de s'installer.

**Avant de monter sur la table, en zone d'attente.** Mise sous tension du robot, du mât et
du serveur. Les PAMI sont allumés et déjà connectés au serveur. C'est ce qui rend le budget
de trois minutes tenable : tout ce qui peut être fait avant l'est.

**Sur la table, en parallèle.** Une personne prend le robot, l'autre la zone de calcul puis
les PAMI, et la rejoint quand le robot est prêt.

| Personne A — robot | Personne B — mât puis PAMI |
|---|---|
| Lancer le mode match | Poser le mât sur sa moitié de plateforme |
| Choisir la couleur | Serrer la vis de fixation |
| Initialisation des actionneurs en position par défaut | Lancer le calibrage |
| Lancer le recalage, en désignant le coin utilisé | Sortir les PAMI et les placer un par un dans l'ordre |
| Attendre que les PAMI soient prêts | Armer chaque PAMI, qui se cale puis rejoint sa place |
| Amener le robot en position de départ | Rejoindre A |
| Poser la tirette | |

**Ce que cette séquence exige du logiciel**, et c'est là son intérêt à ce stade :

- Le recalage est **automatique une fois le coin désigné**. L'opérateur choisit un coin sur
  l'IHM et ne fait rien d'autre.
- L'initialisation des actionneurs se fait **avant** le recalage, en une commande.
- Le robot ne rejoint sa position de départ qu'à la fin, une fois les PAMI placés, pour ne
  pas les gêner.
- Le mât démarre en autonomie et se calibre seul, sans clavier ni câble sur la table.
- Chaque PAMI dispose d'un **bouton d'armement** qui déclenche son propre calage dans la
  zone définie, puis son déplacement vers sa position de départ.

**[OUVERT]** Le calage et le repositionnement des PAMI dépendent des zones de départ et de
la stratégie retenue, donc des règles annuelles. À reprendre après le 19 septembre.

---

## 12. Environnement de développement

| Élément | Choix | Statut |
|---|---|---|
| Système | Ubuntu Server 24.04.2 LTS arm64 | [PROPOSÉ] |
| ROS | ROS 2 Jazzy Jalisco | [PROPOSÉ] |
| Stockage | NVMe | [ACTÉ], non acquis |
| Image système | Clonée et versionnée | [PROPOSÉ] |
| Langage du noyau | C++ | [ACTÉ], conséquence de 4.3 et 8.5 |

**Mode essai et mode match officiel. [ACTÉ]**

F.6 interdit toute communication avec un système extérieur à la table pendant un match. La
télémétrie vers un PC de stand est donc illégale en match, alors qu'elle est indispensable
en mise au point : sans elle, on débogue à l'aveugle. Deux modes sont donc nécessaires, et
ils ne diffèrent que par ce qui se passe **entre la tirette et l'échéance des 100 secondes**.

| | Mode essai | Mode match officiel |
|---|---|---|
| Télémétrie Wi-Fi pendant le match | Active | Coupée |
| Clients Wi-Fi extérieurs à la table | Acceptés | Refusés par le point d'accès |
| Processus `tooling` | Maintenu | Tué au coup de tirette |
| Enregistrement local | Actif | Actif, en `tmpfs` |
| Commandes d'essai depuis l'IHM | Disponibles | Masquées, dont tout réglage d'évitement |

Le masquage des réglages d'évitement n'est pas cosmétique : H.4 punit de disqualification
la désactivation volontaire du système d'évitement. Un interrupteur atteignable par erreur
en match est un risque qu'il ne faut pas prendre.

*Risque assumé et non résolu :* un mode qui se règle à la main se règle mal un samedi
matin. Le mode courant doit donc figurer en bandeau permanent sur l'IHM, être inscrit au
journal au moment du départ, et figurer dans la procédure de préparation. Une bascule
automatique — expiration du mode essai après un délai, ou cavalier physique — est une
option à instruire (question 12 en 16.4) ; aucune ne doit **bloquer** un départ, conformément
à P6.

**Démarrage d'Ubuntu Server sur Pi 5.** Le Raspberry Pi 5 est officiellement certifié pour
Ubuntu 24.04 LTS et Canonical fournit une image préinstallée server arm64. Les Pi 4 et 5
embarquent une EEPROM de démarrage, et certaines versions d'Ubuntu exigent une date
d'EEPROM minimale : c'est la cause la plus probable d'un échec de démarrage. Mettre à jour
le micrologiciel depuis Raspberry Pi OS (`rpi-eeprom-update -a`) avant de reflasher, et
partir d'une image 24.04.2 ou postérieure.

**Jazzy plutôt que Lyrical Luth.** ROS 2 Lyrical Luth est sorti le 22 mai 2026 sur Ubuntu
26.04, supporté jusqu'en 2031. Le risque porte sur la maturité des paquets tiers — Nav2,
pilote lidar, `camera_ros`, `ros2_socketcan`, filtres de coûts. Jazzy est éprouvé et
documenté pour exactement cette combinaison matérielle.

*Objection :* Jazzy atteindra sa fin de support en 2029 et la migration devra être faite de
toute façon. Si les paquets nécessaires sont déjà disponibles en binaire sous Lyrical,
l'argument tombe. **La vérification prend une demi-heure et n'a pas encore été faite.**

**Conteneurisation.** Abandonnée pour un motif erroné — le problème venait de libcamera,
pas de Docker. La décision peut rester, mais le principe P5 doit alors être assuré par
clonage d'image.

---

## 13. Mise en œuvre envisagée des exigences non fonctionnelles

*Les exigences elles-mêmes sont en partie I, section 5.3. Ce qui suit est la manière dont
on envisage de les tenir, et à ce titre révisable.*

### 13.1 Robustesse d'exécution

| Exigence | Mise en œuvre |
|---|---|
| Quota disque par service | `LogsDirectory`, `SystemMaxUse` de journald |
| Redémarrage temporisé | `RestartSec` croissant, `StartLimitBurst` |
| Journalisation en mémoire pendant le match | `tmpfs`, vidage sur NVMe après |
| Chien de garde matériel de la Pi | Armé |
| Surveillance de l'espace disque | Alarme à 80 %, arrêt des enregistrements à 90 % |
| Politique par processus | Selon le tableau 4.4 |

### 13.2 Énergie et droit de coupure

La carte alimentation émet `batterie_faible` **avant** toute coupure. Pour une LiPo 4S, le
seuil usuel est de 3,4 V par cellule, soit environ 13,6 V.

**Budget énergétique : non contraignant.** Le robot dispose de deux packs LiPo 4S de
5500 mAh, soit environ 81 Wh chacun, et les matchs sont espacés de plusieurs heures. La
consommation de l'électronique de commande pendant l'attente — Pi 5 autour de 5 W au repos,
lidar 2 W, écran 2 W, chiffres estimés — représente quelques wattheures sur un cycle de
préparation. Aucun mode veille n'est donc exigé ; la remise en route de la couche 2 avant un
match serait un risque d'échec plus coûteux que l'énergie économisée. Décision consignée en
16.2.

**Relâche du bouton d'arrêt d'urgence. [ACTÉ]** H.1 tolère que le bouton soit enfoncé après
la préparation pour préserver les batteries et les actionneurs. La remise en puissance qui
suit est donc un **état normal du système**, pas un défaut, et elle se produit alors que le
robot est déjà placé et n'a plus le droit de bouger.

Exigence qui en découle, et le piège est concret : un servomoteur remis sous tension saute
vers sa dernière consigne ou vers zéro selon la carte, et ce mouvement après la préparation
est un faux départ à 50 points, forfait en cas de récidive. Après remise en puissance, les
actionneurs conservent leur position, aucune séquence d'initialisation ne s'exécute, et rien
ne démarre avant la tirette.

**Lecture de la tirette.** Elle se lit comme un état, pas comme un front, et le système
refuse de s'armer si le cordon est déjà absent au démarrage. Sinon un redémarrage de la Pi
pendant l'attente déclencherait un départ.

**Rails que la carte alimentation ne peut jamais couper. [ACTÉ]**

- **5 V Pi.** Une coupure brutale corrompt le système de fichiers NVMe, et fait perdre le
  journal qui aurait expliqué l'incident.
- **5 V commande du bus CAN**, qui alimente toutes les autres cartes. Le couper revient à
  aveugler le robot entier au moment précis où il faut diagnostiquer.

Le droit de coupure se limite donc aux **rails de puissance moteur et actionneurs**.

**Conséquence — [OUVERT], à trancher avec l'équipe électronique.** Ces deux rails
deviennent critiques et sans protection de dernier recours. Le problème se déplace en
amont, et deux réponses sont à instruire :

1. **Protection par branche sur le 5 V commande.** Aujourd'hui, une carte dont le
   régulateur se met en court-circuit fait tomber le rail, donc le bus, donc tout le robot.
   Comme on ne peut plus couper, il faut isoler au niveau du fautif : limiteur de courant
   électronique, ou au minimum fusible réarmable par branche. Ordre de grandeur : deux à
   trois euros par branche.
2. **Séparation des convertisseurs.** Les rails Pi et commande doivent venir de
   convertisseurs distincts de celui de la puissance moteur, pour qu'un pic de courant
   moteur ne réinitialise pas les microcontrôleurs. À vérifier sur la topologie actuelle.

**Mesure sans coupure.** L'INA3221 continue de mesurer ces deux rails. La carte alimentation
les surveille, émet `FAULT`, journalise, mais n'ouvre jamais. À écrire comme exigence
explicite, sinon quelqu'un ajoutera la coupure « par sécurité » dans deux ans.

**Deux seuils de surintensité sur les rails coupables. [ACTÉ]**

1. **Seuil matériel** via la broche d'alerte de l'INA3221, réglé nettement au-dessus du pic
   de démarrage moteur : coupure immédiate. Il ne doit attraper que le court-circuit franc.
   Une surveillance logicielle à 10 Hz laisserait passer 100 ms de court-circuit.
2. **Seuil intégral**, du type courant au carré fois temps : émet `FAULT` d'abord, ne coupe
   que si le dépassement persiste.

Les valeurs ne s'inventent pas : elles sortent d'un enregistrement du profil de courant sur
un match normal (6.2).

### 13.3 Détail des essais de dégradation V1 à V6

*Le plan de vérification complet est en partie I, section 6, qui en est la seule source. Ce
qui suit est le mode opératoire des six premiers essais, ceux qui éprouvent les modes
dégradés. Leur numérotation est celle de la partie I.*

Le mode dégradé n'a de valeur que s'il est éprouvé. Ces six essais sont reproduits avant
chaque compétition.

- **V1 — Terminaison brutale du processus `nav` en plein match.** Le robot finit son match en
  mode dégradé, le réflexe lidar reste actif.
- **V2 — Coupure du Wi-Fi et du mât en plein match.** Idem, et les PAMI partent quand même.
- **V3 — Match complet à disque presque plein.** Reproduit les conditions de l'incident.
- **V4 — Départ avec une carte absente du bus et une empreinte de protocole incohérente.** Le
  match démarre, l'anomalie est affichée et journalisée. Vérifie P6.
- **V5 — Terminaison de la Pi à 90 secondes de match.** Les cartes rangent leurs actionneurs
  et coupent le mouvement à 100 s toutes seules. Vérifie 7.3, et c'est le seul essai qui
  protège des 50 points de H.4.
- **V6 — Cycle complet de préparation.** Placement, recalage par contact, retour en zone de
  départ, bouton d'arrêt d'urgence enfoncé puis relâché, tirette. Aucun mouvement
  d'actionneur après la fin de la préparation. Chronométré, il doit tenir sous trois
  minutes avec de la marge.

### 13.4 Connexions et leurs replis, vue d'ensemble

Principe tenu partout dans ce document : chaque sous-système démarre en supposant la
connectivité disponible, mais aucun n'en dépend pour démarrer ou pour rester sûr. Cette
table n'introduit rien de nouveau, elle indexe où chaque cas est traité — le détail reste
dans la section citée, pas ici.

| Connexion | Garde-fou | Conséquence si absente | Renvoi |
|---|---|---|---|
| Robot → cartes STM32 (bus CAN) | Chien de garde par carte, freinage autonome au silence, empreinte de protocole | La carte silencieuse freine seule ; le reste du bus continue | 7.3, 8.4, LOG-EXS-06 |
| Noyau (`core`) → `nav` | Redémarrage à `RestartSec` croissant | Réflexe obstacle de la couche 1 suffit à finir le match | 4.4, V1 |
| Robot ↔ mât, pose | Traitée comme correction, jamais comme substitution ; source incohérente rejetée sans déplacer l'estimation | Robot continue sur odométrie seule | LOG-EXF-11, LOG-EXS-12, V13 |
| Robot ↔ mât, couleur | Robot autorité par défaut ; sélecteur de secours sur le mât | Vision du mât dégradée si aucune couleur confirmée — voir CDC mât 9.3 | 14.5 |
| Robot ↔ mât, hauteur de marqueur adverse | Aucun **[OUVERT]** | Non défini si jamais reçue | 16.4 #15 |
| Robot ↔ serveur PAMI, date de départ et état du monde | Trois niveaux de repli propres aux PAMI | PAMI basculent en niveau 2 ou 3, scénario par défaut | 14.2, 14.3 |
| Robot ↔ PAMI, position remontée (coopération) | Trois niveaux de coopération | Robot bascule sur trajectoires connues à l'avance, puis sur zone d'effacement | 14.6 |
| Robot ↔ opérateur, télémétrie Wi-Fi | Coupée en mode match officiel ; aucun participant DDS sur le Wi-Fi | Volontairement absente en match, aucune conséquence | 4.5, 12 |

Les connexions internes au mât (mât ↔ PAMI en détail, `pami-server` ↔ `vision`, mât ↔
opérateur) sont indexées dans le CDC mât, section 9.3, sur le même principe.

---

## 14. Contrat PAMI

### 14.1 Architecture retenue [ACTÉ]

Sept PAMI — six plus un — développés par une autre personne. Chacun embarque un
microcontrôleur Wi-Fi.

**Un serveur dédié aux PAMI, intégré au dispositif de calcul déporté** (1.4), donc posé sur
la plateforme prévue à cet effet, sur la table. Il porte la tirette physique des PAMI,
attribue les numéros, affiche l'état de connexion de chacun, collecte les journaux et sert
la page de supervision. Il embarque également le point d'accès Wi-Fi. C'est la reprise d'un
montage déjà éprouvé par le passé sur une autre équipe. L'attribution des numéros par le
serveur est le chemin nominal ; chaque PAMI peut aussi fixer le sien localement, voir 14.3.

**C'est cette localisation qui rend l'ensemble conforme à F.6** : tous les systèmes sont sur
la table et aucun ne communique avec l'extérieur pendant le match. Un serveur posé au stand,
ou un point d'accès appartenant à l'équipe et non homologué, ne le serait pas. F.6 autorise
explicitement le dispositif de calcul à porter le cordon de démarrage, ce qui règle la
question de la tirette PAMI.

Le serveur n'est jamais dans une boucle critique du robot principal. Le robot lui parle,
mais ne dépend pas de lui.

### 14.2 Le départ est une date, pas un ordre [ACTÉ]

**Exigence numéro un.** Le serveur n'envoie pas « pars maintenant » : il envoie **« le
match commence à T »**, dans une base de temps partagée établie à l'avance. Chaque PAMI
décompte ensuite sur son propre quartz.

Conséquence : une coupure Wi-Fi après le coup de tirette n'a plus aucun effet sur le
départ. Le réseau n'a besoin de tenir que jusqu'à la transmission de la date, pas pendant
les cent secondes qui comptent.

C'est le piège central de ce sous-système : si le départ est un message reçu en direct,
une coupure Wi-Fi coûte tous les points des PAMI.

### 14.3 Trois niveaux de repli [ACTÉ]

| Niveau | Situation | Comportement |
|---|---|---|
| 1 | Serveur joignable | Date de départ, plus état du monde enrichi |
| 2 | Serveur perdu après réception de la date | Scénario minuté complet, sur horloge locale |
| 3 | Jamais connecté | Tirette physique locale, couleur et numéro fixés par sélecteur physique, scénario par défaut |

Chaque PAMI possède son propre démarreur physique, un sélecteur de couleur d'équipe et un
sélecteur de numéro : de quoi jouer sans avoir jamais été connecté à quoi que ce soit.
Aucun des trois n'est utilisé en fonctionnement nominal, mais tous doivent exister et
**le niveau 3 doit être testé**, pas seulement écrit — c'est la même logique qui vaut pour
tout le reste du système : chaque sous-système démarre en supposant la connectivité
disponible, mais aucun n'en dépend pour démarrer (14.1, MAT 9.3).

La liaison Wi-Fi n'apporte que l'enrichissement — quelles zones sont déjà prises, où est
l'adversaire — jamais l'autorisation de bouger.

### 14.4 Transport [ACTÉ]

**Unicast UDP répété**, pas de multicast.

Motif, correction d'une recommandation antérieure : les trames multicast sur Wi-Fi ne sont
pas acquittées et sont émises au débit de base le plus bas ; dans une salle saturée, le
taux de perte est mauvais et non mesurable. Avec seulement sept destinataires, l'unicast
bénéficie de l'acquittement 802.11 et des retransmissions de la couche liaison. Sept
destinataires à 2 Hz font quatorze paquets par seconde, ce qui est du bruit.

Deux réflexes de mise en œuvre, à écrire dès le début :

- **numéro de séquence** dans chaque message ;
- **chaque message envoyé trois fois, espacé de vingt millisecondes**, le récepteur
  ignorant les doublons.

On obtient une robustesse suffisante sans jamais écrire de logique d'acquittement.

### 14.5 Message d'état du monde

Message compact, de l'ordre de 30 octets : zones occupées en champ de bits, obstacles,
horodatage. Diffusion à 2 Hz pendant les dernières secondes avant le départ des PAMI.

Le robot principal est l'autorité sur cet état. Le chemin peut passer par le serveur — le
saut supplémentaire coûte quelques millisecondes, négligeable à 2 Hz, et le serveur est de
toute façon l'endroit naturel pour la supervision et les journaux.

**Couleur d'équipe [ACTÉ].** Le message porte aussi la couleur active, dont le mât a besoin
autant pour sa propre vision (MAT 4.4) que pour les PAMI. Le robot est l'autorité par
défaut et l'émet dès qu'elle est choisie à la préparation (17.11). Si le mât ne l'a reçue
d'aucun robot, un sélecteur de secours sur sa propre page en fixe une : elle alimente la
vision et le canal vers les PAMI, mais n'est **jamais remontée au robot** — le mât ne fait
que pallier une absence, pas contredire l'autorité. Dès réception d'une couleur venant du
robot, le sélecteur s'efface et cette couleur prévaut, y compris sur une sélection de
secours déjà diffusée aux PAMI. Le cas d'une divergence à ce stade est jugé peu probable si
la liaison est correcte, mais il n'est pas nécessaire qu'elle le soit pour que chaque
système démarre : c'est le même principe que 14.3 pour les PAMI et que 14.1 pour le
serveur.

### 14.6 Évitement des PAMI par coopération [ACTÉ]

**Le lidar ne voit aucun PAMI.** F.7 les limite à 150 mm au départ et 350 mm déployés,
alors que le lidar est monté dans le mât de balise, au-dessus de 350 mm. Le robot principal
est donc aveugle à ses propres PAMI comme à ceux de l'adversaire.

Pour les PAMI adverses, F.7 tolère le non-évitement tant que le choc n'est ni volontaire ni
violent. Pour les nôtres, c'est un risque de casse et de points perdus.

**La détection par capteurs bas est écartée** : à cette hauteur, rien ne distingue un PAMI
d'un élément de jeu, et un robot qui freine devant chaque élément qu'il vient chercher ne
joue plus. Motif consigné en 16.2.

La réponse retenue est la coopération, sur trois niveaux qui suivent ceux de 14.3 :

1. **Position remontée en direct.** La liaison devient bidirectionnelle : chaque PAMI publie
   sa position, le robot les injecte comme obstacles dans sa costmap. C'est le seul niveau
   qui gère un PAMI dérouté ou bloqué.
2. **Trajectoires connues à l'avance.** Si les PAMI suivent un scénario fixe, le robot
   connaît leur position en fonction du temps et traite leur couloir comme une zone à
   éviter pendant la fenêtre. Aucune communication nécessaire.
3. **Effacement.** Pendant la fenêtre de déploiement, le robot se gare dans une zone
   convenue et ne bouge pas. Coûte du temps de match, mais ne peut pas échouer.

L'état `FENETRE_PAMI` de 11.4 sélectionne le niveau selon ce qui est disponible au moment
venu. Le niveau 3 est le comportement par défaut tant que les deux autres ne sont pas
validés sur table.

*Conséquence sur le contrat :* le message d'état du monde de 14.5 devient bidirectionnel, et
le format doit prévoir dès maintenant le champ de position remontée par chaque PAMI, même si
le niveau 1 n'est pas implémenté la première année.

---

## 15. Comparaison avec le logiciel précédent

Grille remplie le 19 septembre 2026, à partir de la sauvegarde de la Raspberry Pi de
l'édition précédente et des dépôts des deux firmwares Nucleo. Le dépouillement complet —
volumes, relevé du bus, défauts, plan de reprise — est dans `rapport-heritage-2026.md`, à la
racine du dossier de documentation. Ce qui suit en est le résumé.

Ce que la grille supposait et que la lecture corrige : **il n'y a pas un logiciel précédent,
il y en a deux**. Une branche ROS 2 de onze processus en conteneur, qui n'a jamais joué un
match et dans laquelle Nav2 n'est jamais instancié ; et une branche hors ROS d'un seul
processus, qui a joué. Le lidar, son filtre et le garde-fou d'obstacle sont commentés dans
le lanceur de la branche ROS, sous la mention explicite « noeuds commentés pour fixer le
crash loop » : la boucle de redémarrage de 2.1 y avait déjà été constatée et contournée par
suppression.

| Axe | Existant | Cible | Reprendre / Refaire |
|---|---|---|---|
| IHM tactile | Interface web servie par la Pi, affichée en kiosque plein écran sur l'écran tactile. Six onglets, un mode match, un éditeur de stratégie. Environ 4 900 lignes. L'affichage de batterie était alimenté par une trame que la carte alimentation n'émettait pas | Même base visuelle, sans reprendre les boutons et actions historiques ; serveur séparé, interfaces ROS définies par le noyau, onglets calibration et état système | Refaire le nœud et le contrat ; reprendre sélectivement le rendu |
| Structure des processus | Un processus multithread pour ce qui a joué ; onze processus en conteneur pour ce qui n'a pas joué | Trois couches, noyau composé en un processus | Refaire, en gardant le découpage fonctionnel du processus unique |
| Protocole CAN | Maison. Six opcodes descendants, deux montants. Décrit en quatre exemplaires divergents, dont l'un porte une divergence active d'unités | Maison + registre + passerelle ROS | Reprendre la sémantique, refaire la source |
| Plan d'ID CAN | Identifiants fixes, un couple par carte, sans champ | Découpage en champs | Refaire |
| Interface carte moteurs | Une file de seize points existe côté carte, mais la Pi n'en envoie qu'un à la fois et attend l'acquittement d'arrivée. Chaque point s'exécute en rotation, ligne droite, rotation ; aucune courbe, ni numéro de séquence, ni remplacement | File de waypoints remplaçable | Refaire la poursuite, garder la structure de file |
| Acquisition codeurs | A/B décodé en quadrature logicielle, par interruption sur les quatre fronts. De l'ordre de 21 000 interruptions par seconde à 0,8 m/s, calculé | A/B sur timer, module SPI | Refaire |
| Horodatage odométrie | Daté à la réception par la Pi. La trame d'odométrie transporte six octets, x, y et θ, et rien d'autre | Compteur STM32 + estimation continue du décalage | Refaire |
| Minuterie de fin de match | Aucune, ni sur la Pi ni sur les cartes. Le décompte des cent secondes n'existe que dans le navigateur, en affichage, et n'émet rien à échéance | Côté firmware, avec rangement préalable | Refaire |
| Chien de garde des cartes | Aucun. Sur silence de la Pi, la carte moteurs termine sa file puis reste en maintien | Freinage sur silence prolongé | Refaire |
| Recalage initial | Séquence de contact mural écrite puis mise en commentaire. Il ne subsiste qu'un recalage de pose à l'aveugle sur des coordonnées figées | Pendant les 3 min de préparation | Refaire ; la séquence commentée reste une base |
| Mode d'exécution | Unique, plus trois drapeaux de ligne de commande | Essai et match officiel | Refaire |
| Navigation | Aucune. Suivi séquentiel d'une liste de points, un à la fois | Nav2, planificateur seul | Refaire |
| Évitement | Arrêt et reprise sur cône lidar dépendant du mouvement, marge proportionnelle à la vitesse, hystérésis, filtrage par les bordures de table | Contournement, réflexe lidar en couche 1 | Reprendre la géométrie, refaire la décision |
| Localisation | Odométrie intégrée sur la carte moteurs, plus un recalage de pose déclenché à la main et appliqué sans filtre | Odométrie + contact + mât | Reprendre, compléter |
| Asservissement | Profil trapézoïdal et PI de vitesse par roue, gains identifiés sur la machine réelle | Idem, plus poursuite de point cible | Reprendre |
| Stratégie | Fichier de points ordonnés, plus un registre d'actions nommées | Moteur générique + configuration | Reprendre le registre et le format, refaire le moteur |
| Télémétrie d'alimentation | Émission en commentaire, acquisition analogique désactivée à la compilation. Aucune trame relevée sur le bus | Tension, courant, défaut par carte | Refaire |
| Gestion des journaux | Aucune. La sortie console part dans un fichier temporaire sans quota ni rotation, et le programme n'écrit rien d'autre | Quotas, tmpfs | Refaire |
| Politique de redémarrage | Aucune côté hors ROS : le processus tombe, tout tombe | Temporisation croissante, par processus | Refaire |
| Simulation | Aucune. Les modes dits « simulés » journalisent la commande quand une bibliothèque manque | Cinématique maison | Refaire |
| Tests | Un script de vérification des imports. Aucun essai de dégradation | Dix essais dont six de dégradation | Refaire |

Objectif : identifier ce qui est réutilisable tel quel. **Repartir d'une page blanche sur
du code qui a marché en compétition est un coût, pas une vertu** — l'IHM en est
l'illustration, et l'asservissement de la carte moteurs en est la seconde.

Ce que la grille donne comme ordre de grandeur : de l'ordre de 5 500 lignes réutilisables
sur les 10 750 du système qui a joué, dont 4 900 pour la seule interface. Le reste est du
code dont on reprend l'intention, pas le texte.

*Contre-argument à conserver.* Deux lignes de la colonne « existant » décrivaient des écrans
plutôt que des fonctions qui marchaient. La batterie affichait zéro pendant toute la
compétition, et les journaux ne survivaient pas à l'extinction. Une grille de comparaison
remplie depuis une interface est une grille remplie depuis ce qu'on voit, pas depuis ce qui
fonctionne ; c'est la raison pour laquelle les enregistrements de match de LOG-EXJ-01 à
LOG-EXJ-07 valent plus qu'un écran de diagnostic.

---

## 16. État des orientations

### 16.1 Acté

- L'architecture ne dépend pas du règlement annuel ; les actions de jeu sont de la donnée.
- La carte moteurs reste la source de vérité de la pose.
- Nav2 est retenu, pour l'évitement dynamique, les zones interdites et les objectifs.
- L'articulation Nav2 / carte moteurs se fait par flux de waypoints remplaçable.
- **Le noyau de match reste du ROS 2, dans un processus unique contenant plusieurs nœuds.**
- **Découpage en cinq processus, avec une politique de redémarrage par processus.**
- **Le noyau est écrit en C++.**
- **Le pilote lidar et le réflexe obstacle appartiennent à la couche 1.**
- **Le mât entre dans le périmètre 2027 et fait l'objet d'un CDC dédié.**
- **Le mode identification enregistre en RAM puis restitue par dump CAN, robot à l'arrêt.**
- **La base de temps STM32 / Pi est estimée en continu par filtre du minimum.**
- **La distance de sécurité est une formule paramétrée, pas une constante ; trois régimes
  de freinage.**
- **Principe P6 : rien ne bloque le départ d'un match.**
- **Les rails 5 V Pi et 5 V commande ne sont jamais coupables ; deux seuils de surintensité
  sur les rails de puissance.**
- **Contrat PAMI : serveur dédié, départ transmis comme une date, unicast UDP répété, trois
  niveaux de repli.**
- **Le serveur PAMI et le point d'accès Wi-Fi sont intégrés au dispositif de calcul déporté,
  sur la table — condition de conformité à F.6.**
- **La minuterie de fin de match est tenue par les firmwares ; rangement des actionneurs
  avant l'échéance, arrêt sans coupure de puissance.**
- **Le recalage par contact se fait pendant les trois minutes de préparation, pas pendant le
  match.**
- **Le réflexe obstacle filtre spatialement par les bordures de table.**
- **La calibration du mât est continue, avec gestion explicite des occultations.**
- **Deux modes d'exécution : essai et match officiel.**
- **Les PAMI sont évités par coopération, jamais par détection.**
- Modélisation physique limitée au minimum utile, par identification expérimentale.
- Le CAN reste à 500 kbit/s ; seul le plan d'identifiants est refait.
- **Simulateur cinématique maison retenu.**
- Stockage sur NVMe.
- Codeurs remplacés par un module à sortie A/B et SPI.
- L'IHM tactile existante est reprise et étendue.
- Nouveau cahier des charges, comparé à l'existant avant réécriture.
- **Registre de trames : DBC avec `cantools`, tranché par essai réel (8.3).**

### 16.2 Rejeté et reporté

| Option | Statut | Motif |
|---|---|---|
| Noyau de match écrit hors ROS, exécutif maison | **[REJETÉ]** | Plusieurs semaines de coût pour traiter un symptôme ; le diagnostic de 2.1 désigne un exécutif mal configuré. Le regroupement en processus obtient l'isolation utile sans quitter ROS |
| Streaming d'identification à 1 kHz sur le CAN pendant déplacement | **[REJETÉ]** | 3000 à 4000 trames par seconde contre 3800 de saturation. Remplacé par tampon RAM et dump à l'arrêt |
| Remontée d'identification par USB | **[REJETÉ]** | Sans objet une fois le dump CAN retenu ; garde le CAN comme unique bus et permet l'affichage en direct sur l'IHM |
| Diffusion multicast UDP vers les PAMI | **[REJETÉ]** | Trames multicast non acquittées et émises au débit de base sur Wi-Fi. L'unicast répété vers sept destinataires est plus fiable |
| **Fil matériel ALERT sur le bus** | **[REPORTÉ ÉQUIPE]** | Avis défavorable du responsable logiciel : complexité et contrainte de câblage supplémentaires alors que le CAN couvre l'essentiel du besoin. Dossier complet conservé en annexe A |
| **Fil matériel SYNC sur le bus** | **[REPORTÉ ÉQUIPE]** | Idem, et le gain sur la synchronisation logicielle est inférieur à l'erreur d'odométrie. Annexe A |
| Gazebo | **[REPORTÉ]** | Une à deux semaines plus une dépendance. À revoir en décembre ou si le partage du robot bloque l'équipe |
| Homographie pour la calibration du mât | **[REJETÉ]** | Erreur de parallaxe sur une balise en hauteur. Résolution `solvePnP` sur les quatre tags à la place |
| **Localisation par amers passifs sur supports de balise fixe** | **[REJETÉ]** | Triangulation déjà expérimentée par le passé : précision jugée insuffisante. Un arbitre penché sur la table est vu par le lidar et pollue l'extraction. Et aucune balise fixe ne sera fabriquée cette année |
| **Balises fixes** | **[REJETÉ]** | Hors périmètre 2027 |
| **Capteurs de distance bas pour détecter les PAMI** | **[REJETÉ]** | À cette hauteur rien ne distingue un PAMI d'un élément de jeu ; un robot qui freine devant chaque élément qu'il vient chercher ne joue plus. Remplacé par la coopération (14.6) |
| **Contrôle de zone interdite dans le firmware de la carte moteurs** | **[REJETÉ]** | Nav2 émet des coordonnées correctes, et s'il tombe la carte termine sa file puis s'arrête sans sortir du chemin planifié. *Contre-argument conservé :* le risque n'est pas Nav2 mort mais Nav2 vivant et faux — costmap mal configurée, pose corrompue par un `SET_POSE` erroné, ou `GOTO` émis directement par la stratégie sans passer par le planificateur. L'infraction vaut forfait et non pénalité. Repris sous une forme moins coûteuse en 16.4, question 11 |
| **Mode veille pendant la préparation** | **[REJETÉ]** | Deux packs de 5500 mAh et des matchs espacés de plusieurs heures rendent le gain négligeable ; la relance de la couche 2 juste avant un match est un risque d'échec supérieur |
| **Format maison (YAML + générateur) pour le registre de trames** | **[REJETÉ]** | Essai réel : aucun gain net démontré face à `cantools`, une anomalie produite dès l'écriture du générateur de démonstration, et un export DBC restant à développer pour la compatibilité SavvyCAN. Détail en 8.3 et fiche 17.3 |

### 16.3 Vue d'état du système sur l'IHM [ACTÉ]

Conséquence directe de P6 et de 8.4. Un onglet dédié, avec une ligne par carte :

| Colonne | Contenu |
|---|---|
| Carte | Nom |
| Présence | Vue sur le bus ou non |
| Empreinte de protocole | Conforme ou divergente |
| Version de firmware | Chaîne remontée par `HELLO` |
| Dernière trame | Horodatage de la dernière réception |
| État déclaré | Nominal, dégradé, en défaut, plus le dernier code `FAULT` |

Plus un bandeau global en trois couleurs. **Le coup de tirette reste actif quel que soit le
contenu de cet écran**, et l'état complet des préconditions au moment du départ part dans
le journal — c'est ce qui permet, au dépouillement, de comprendre pourquoi un bras n'a rien
fait de tout le match.

### 16.4 À trancher

| # | Question | Qui | Échéance |
|---|---|---|---|
| ~~1~~ | ~~Registre de trames : DBC ou format maison, après essai sur cinq trames~~ — **tranché** : DBC, voir 8.3 | Logiciel | Clos |
| 2 | Jazzy ou Lyrical Luth, après vérification des paquets | Logiciel | 3 jours |
| 3 | Gamme de microcontrôleurs pour les cartes refaites | Électronique | Avant routage |
| 4 | Fils ALERT et SYNC : câbler, réserver la piste, ou abandonner | Équipe | Avant routage |
| 5 | Protection par branche du 5 V commande ; séparation des convertisseurs | Électronique | Avant routage |
| ~~6~~ | ~~Où vit l'IHM : processus séparé dans le langage existant, ou affichage d'état critique réécrit dans le noyau~~ — **tranché** : couche et processus séparés ; `core` publie l'état critique et valide les commandes, l'IHM ne possède aucun accès direct au matériel. Le portage de l'ancien serveur et la reprise des vues restent à réaliser, voir 17.5 | Logiciel | Clos |
| 7 | LED de défaut mémorisée par carte | Électronique | Avant routage |
| 8 | Capteurs de distance de secours sur carte capteur | Électronique | Avant routage |
| 9 | Seuil entre freinage doux et freinage maximal | Logiciel | Après identification |
| 10 | Gazebo | Logiciel | Décembre |
| 11 | Contrôle de zone interdite dans la passerelle CAN de la Pi | Logiciel | 1 mois |
| 12 | Politique de bascule entre mode essai et mode match officiel | Logiciel | 1 mois |
| ~~13~~ | ~~Mât : tranche colorée ou tag ArUco comme source principale~~ — **tranché** : tranche colorée, l'ArUco n'étant lisible que sur la moitié proche (CDC mât 3.2 et 3.3) | Logiciel | Clos |
| ~~14~~ | ~~Où se saisissent la couleur d'équipe et la hauteur de marqueur adverse : IHM du robot ou page du mât~~ — **tranché** : IHM du robot, transmises au mât ; garde-fou de secours sur la page du mât pour la couleur seule (14.5, CDC mât 10) | Logiciel | Clos |
| 15 | Repli si le mât ne reçoit jamais la hauteur de marqueur adverse : valeur par défaut ou dernière connue (CDC mât 10) | Logiciel | Avec 17.11 |

---

## 17. Points à avancer

Chaque fiche est autonome : elle peut être traitée sans le reste du document.

### 17.1 Mode identification sur la carte moteurs

**Pourquoi maintenant.** Aucun paramètre physique n'est mesurable sans lui, et toute la
section 6 en dépend. Ne dépend ni du règlement ni du rapport précédent. Le plan
d'identifiants en champs (8.2) reste ouvert, mais l'outillage du registre (8.3) est
désormais tranché : les quatre trames `IDENT_*` se décrivent directement en DBC.

**À produire.** Trames `IDENT_START`, `IDENT_LIVE`, `IDENT_DUMP`, `IDENT_BLOCK` ;
générateur de consigne (échelon, rampe, créneau) ; tampon circulaire en RAM à 500 Hz ;
restitution par blocs indexés avec accusé ; exclusion mutuelle avec une file de waypoints
active.

**Échéance : 2 semaines.**

### 17.2 Poursuite de point cible et remplacement de file

**Pourquoi maintenant.** C'est le travail firmware principal de la saison et il conditionne
toute l'architecture de navigation.

**À produire.** Suivi de file avec distance d'anticipation, remplacement sans à-coup sur
nouveau numéro de séquence, deux modes de fin de file, trois régimes de freinage (5.5).

**Point de vérification numéro un.** Recevoir une nouvelle file à 10 Hz ne doit provoquer
aucun arrêt. À tester au banc avant toute intégration.

**Échéance : 6 semaines.**

### 17.3 Registre de trames et plan d'identifiants CAN

**Pourquoi maintenant.** Le responsable logiciel écrit les trois firmwares, donc peut le
figer seul. Tout le reste du protocole en dépend, et le brochage des cartes aussi.

**État : format tranché.** L'essai comparatif de 8.3 a été mené pour de vrai sur cinq
trames représentatives (`ODOM`, `GOTO`, `PATH_POINT`, `IDENT_BLOCK`, `FAULT`) : DBC décrit
en `option_a.dbc`, C généré et compilé par `cantools`, décodage vérifié dans SavvyCAN y
compris la table de valeurs de l'énumération et le signal brut 48 bits d'`IDENT_BLOCK`.
Format maison écarté après avoir produit une anomalie réelle dans le générateur de
démonstration. **DBC + `cantools` retenu pour tout le registre.**

**Reste à produire.** La table complète des identifiants en champs (8.2, encore
[PROPOSÉ]), le format de chaque charge utile au-delà des cinq trames testées, la politique
de reprise sur erreur de bus.

**Échéance : 1 semaine**, pour le plan d'identifiants restant.

### 17.4 Bring-up de la Raspberry Pi

**Pourquoi maintenant.** Débloque la caméra et la couche 2 entière. Environ une journée de
travail pour un problème qui a coûté des semaines.

**À produire.** Mise à jour EEPROM, Ubuntu Server 24.04.2, fork Raspberry Pi de libcamera
compilé, `camera_ros`, image disque clonée et versionnée, variables de découverte DDS
(4.5) fixées dans l'image.

**En parallèle.** Vérifier la disponibilité binaire sous Lyrical de : Nav2, pilote RPLIDAR,
`camera_ros`, `ros2_socketcan`, filtres de coûts. Une demi-heure, et cela tranche la
question 2 de la section 16.4.

**Échéance : 1 semaine.**

### 17.5 Reprise de l'IHM

**Pourquoi maintenant.** C'est le plus gros morceau de code réutilisable identifié, et
l'onglet de calibration est nécessaire à la campagne d'identification.

**Question de technologie : fermée.** L'IHM existante est déjà une interface web servie par
la Pi, affichée en kiosque plein écran sur l'écran tactile et atteignable depuis un PC en
Wi-Fi. C'est exactement la seconde voie envisagée ici, et elle est réalisée. Le couplage au
protocole est confiné à une table déclarative côté navigateur et à la trentaine de points
d'entrée du serveur ; le rendu, le tracé de l'aire de jeu, le mode match et l'éditeur de
stratégie n'en connaissent rien. La voie retenue est donc **reprendre la base visuelle et refaire le comportement**.

**Décision d'architecture issue de l'audit du 23 septembre 2026.** L'IHM reste dans une
couche et un processus distincts du noyau `core`. Elle ne sera pas ajoutée au workspace ROS
tant que son portage n'est pas terminé. Le dossier existant reste sous `logiciel/legacy/`
comme référence de travail, pas comme package actif.

Le front HTML, CSS et JavaScript sert de base visuelle. Les boutons et actions hérités de
l'édition précédente sont retirés avant toute reprise fonctionnelle : ils correspondent à
des contrats ROS et à des commandes matériel qui ne sont plus la source de vérité. Le
nouveau serveur sera reconstruit autour des interfaces publiées par `core`, sans accès
direct aux cartes ni aux fichiers de configuration du robot.

Le premier travail de portage est l'audit et la sécurisation du serveur : aucune commande
physique ne doit être autorisée par le seul navigateur, le mode d'exécution doit être
contrôlé côté serveur, les accès réseau doivent être limités selon le mode, et les
opérations d'écriture doivent être bornées et journalisées. Les routes historiques
manquantes, les accès fichiers et la concurrence entre FastAPI et ROS seront traités dans
la même passe.

*Contre-argument, et il n'est pas mineur.* Le serveur existant est écrit dans un autre
langage que le noyau (4.3), et 16.3 place l'affichage d'état critique en couche 1. Le
serveur sera donc un processus séparé : le noyau publie l'état critique et valide les
commandes autorisées ; l'IHM le consomme et n'a aucun droit de commande direct vers le
matériel. Cette séparation coûte un contrat ROS supplémentaire, mais évite de faire entrer
le serveur web et ses dépendances dans le processus qui ne doit jamais tomber.

Dans les deux cas : le rendu doit être **suspendu pendant le match**, et l'IHM appartient à
la couche 1 pour l'affichage d'état critique, à la couche 3 pour le reste.

**Ordre de réalisation :** sécurité du serveur et contrat ROS, nœud minimal sans commandes
historiques, puis reprise progressive des vues utiles et création des onglets calibration
et état système.

### 17.6 Format du fichier de description des actions

**Pourquoi maintenant.** La structure est indépendante du règlement ; seul le contenu
attendra le 19 septembre. C'est la clé de la réutilisabilité pluriannuelle.

**À produire.** Schéma du fichier : position, préconditions, effets, points, durée estimée,
risque, réversibilité. Plus un jeu d'actions fictives pour tester le moteur avant la
publication du règlement.

**Échéance : 1 mois.**

### 17.7 Références matérielles à confirmer

| Élément | À confirmer |
|---|---|
| Module codeur | Référence exacte, résolution, mode SPI ou A/B retenu |
| Driver Cytron | Référence, mode de commande (PWM+DIR ou autre) |
| HAT CAN | Modèle, CAN classique ou CAN FD |
| STM32C09x | Référence exacte des dix puces |
| Robot | Masse, dimensions, hauteur de montage du lidar |
| Carte moteurs | Configuration d'horloge du firmware : HSE ou HSI (voir 7.3) |
| ~~Table~~ | ~~Position exacte des quatre tags ArUco~~ — **clos** : 100 mm de côté, à ±900 et ±400 mm du centre (CDC mât 3.4) |

Point clos : la fente optique du lidar dans le mât de balise. La configuration retenue —
mât de 70 mm de diamètre, fente de moins de 20 mm, support de balise tenu par VelcroTM sans
vis — a déjà passé l'homologation lors d'une édition précédente. Aucune question à poser au
comité d'arbitrage.

**Échéance : 3 jours.**

### 17.8 Éléments non provisionnés au budget

| Élément | Ordre de grandeur | Remarque |
|---|---|---|
| SSD NVMe | 25–40 € | Seule une carte SD est achetée. Pas sur le chemin critique : le `tmpfs` de 13.1 mitige déjà l'incident fondateur |
| HAT M.2 | 12–20 € | Vérifier l'empilement avec le HAT CAN |
| Mât caméra complet | **415–610 €, estimé** | Chiffré dans le CDC mât, 12.2 : calculateur, **deux** caméras, point d'accès, alimentation autonome, structure, capteur inertiel éventuel |
| Microcontrôleurs G4 | ~5 € pièce | Si la migration est retenue (1.3) |
| Protection par branche du 5 V commande | 2–3 € par branche | Si l'option 1 de 13.2 est retenue |

**Échéance : 1 mois.**

### 17.9 Cahier des charges PAMI

**Pourquoi maintenant.** Sept PAMI développés par une autre personne ; le contrat doit être
stable tôt, et il est indépendant du règlement.

**À produire.** Document séparé reprenant la section 14, plus : le protocole
d'enregistrement d'un PAMI auprès du serveur, l'attribution des numéros, le format du
scénario minuté par défaut, la procédure de test du niveau 3, et le format de la position
remontée par chaque PAMI (14.6) même si elle n'est pas exploitée la première année.

**Dépendance nouvelle.** Le serveur vit dans le dispositif de calcul déporté. Le CDC PAMI
doit donc spécifier le boîtier minimal — serveur, point d'accès, tirette — qui peut être
homologué **sans la partie vision**, pour que le retard du mât ne devienne pas celui des
PAMI.

**Échéance : 3 semaines.**

### 17.10 Cahier des charges du mât — rédigé

**Pourquoi maintenant.** Le développement commence, et le plan de la section 10.4 est
indépendant du règlement.

**État.** Rédigé, en document séparé. Il contient le dimensionnement optique chiffré, le
choix des caméras et du calculateur, l'alimentation et l'architecture logicielle. Il n'est
jamais cité ici par son numéro de version : les renvois se font par identifiant d'exigence
ou par section.

**Résultat qui remonte dans ce document :** une caméra unique ne peut pas couvrir la table,
les coins proches se trouvant à 60,5° de l'axe optique pour un champ horizontal de ±51°.
Deux caméras sont nécessaires, et le tag ArUco d'un robot n'est lisible que dans un rayon
d'environ 1,5 m autour du mât, ce qui confirme le suivi de la tranche colorée comme source
principale.

**Entrée encore nécessaire.** Photo du montage précédent. La taille et la position des
quatre tags de table sont closes, voir le CDC mât, section 3.4.

**Échéance : sans objet, à faire vivre avec le développement.**

### 17.11 Procédure de préparation en trois minutes — rédigée

**Pourquoi maintenant.** H.1 donne trois minutes pour tout installer, et le dépassement
coûte 50 points puis un forfait en cas de récidive. Cette procédure n'est pas de
l'intendance : elle **détermine ce que le logiciel doit automatiser**, donc elle doit être
écrite avant de coder l'IHM et la machine à états.

**État.** Rédigée, en document séparé : `docs/procedure-preparation-3min.md`. Deux
personnes en parallèle, dans l'ordre : pose du robot, pose des PAMI, pose et vissage du
dispositif de calcul, choix de la couleur d'équipe, saisie de la hauteur de marqueur
adverse, choix de la stratégie, bascule en mode match officiel (12), lancement du recalage
par contact, retour en zone de départ, passage en `PRET`, mise en place du cordon de
tirette. Chaque ligne porte ce qui est manuel et ce qui est automatique.

**Résultat qui remonte dans ce document :** le lieu de saisie de la couleur et de la
hauteur (question 14 de 16.4, MAT section 10) est tranché en l'écrivant — voir 14.5.

**Ce qui reste ouvert.** Le repli si le mât ne reçoit jamais la hauteur de marqueur
(question 15 de 16.4) et le mécanisme de bascule mode essai / mode match (question 12).

**Échéance : sans objet, à faire vivre avec le développement.**

### 17.12 Format d'enregistrement de match

**Pourquoi maintenant.** C'est la seule partie du sujet rejeu qui ne se rattrape pas. Le
lecteur et le pont vers le simulateur peuvent attendre ; l'instrumentation doit être en place
avant le premier essai sur table.

**À produire.** Choix du format selon les critères de 19.3, inventaire nominatif des flux à
enregistrer, mécanisme de datation commune, et procédure de vidage après match.

**Dépendance.** Se traite en même temps que le registre de trames (17.3), les deux décrivant
les mêmes données.

**Échéance : avec le registre de trames.**

### 17.13 Plan de vérification des exigences fonctionnelles

**Pourquoi maintenant.** Le plan de la partie I, section 6, couvre la sûreté et
l'exploitation mais pas les treize exigences fonctionnelles de 5.2. Sans fiche dédiée, elles
n'auront jamais de preuve, et c'est la moitié du document.

**À produire.** Un essai par exigence fonctionnelle, ou par groupe cohérent, avec critère de
réussite chiffré quand il existe. La plupart s'exécutent au banc ou sur table sans matériel
particulier.

**Dépendance.** Les critères chiffrés d'LOG-EXF-02 attendent les règles annuelles ; le reste non.

**Échéance : 1 mois.**

---

## 18. Jalons

Le planning reste global tant que l'équipe n'est pas constituée. L'ordre de dépendance
compte plus que les dates.

| Repère | Livrable |
|---|---|
| Immédiat | Brochage du connecteur de bus arrêté — bloque le routage de toutes les cartes |
| Immédiat | Configuration d'horloge du firmware moteurs vérifiée (HSE) |
| Semaine 1 | Bring-up Pi complet, image clonée ; arbitrage distribution ROS ; plan d'identifiants restant (8.2) |
| Semaine 2 | Contrat carte moteurs figé ; mode identification |
| Semaine 2 | Procédure de préparation en trois minutes rédigée et chronométrée à blanc |
| Semaine 3 | Décision sur l'IHM ; grille de comparaison remplie ; CDC PAMI rédigé (CDC mât : fait) |
| **19 septembre 2026** | **Règlement dévoilé à la Rentrée de la Robotique** |
| Semaine 4 | Campagne d'identification de la base roulante ; rédaction de la couche métier |
| Semaine 6 | Poursuite de point cible et remplacement de file validés au banc |
| Octobre | Nav2 en simulation cinématique, flux de waypoints validé |
| Novembre | Premiers déplacements avec évitement sur table réelle ; réflexe lidar validé |
| Décembre | Moteur de stratégie sur actions réelles ; arbitrage Gazebo |
| Janvier–Mars | Intégration, mât, PAMI, essais V1 à V6 de dégradation |
| Avril | Homologation à blanc |
| **5–8 mai 2027** | **Concours, La Roche-sur-Yon** |

---

## 19. Enregistrement, rejeu et capitalisation — orientations

Réponse aux exigences de la partie I, section 5.7.

### 19.1 Inventaire des flux et volumétrie

Estimation pour un match de cent secondes.

| Flux | Débit | Volume |
|---|---|---|
| Trafic complet du bus de terrain, trames brutes horodatées | 580 trames/s | ~1,4 Mo |
| Mesures de distance, tours complets | 10 Hz, 500 points | ~2 Mo |
| Positions issues du dispositif déporté, deux robots | 30 Hz | ~150 ko |
| État interne : machine à états, file de points, pose estimée | 20 Hz | < 1 Mo |
| Décisions de stratégie : candidates, scores, choix retenu | sur événement | < 100 ko |
| Messages PAMI | 2 Hz | quelques ko |
| Images, si retenues, à basse cadence | 5 img/s | ~20 Mo |
| **Total** | | **5 à 30 Mo** |

Débit d'écriture de l'ordre de 300 ko/s, une compétition entière sous le gigaoctet. La
volumétrie n'est donc jamais un motif de ne pas enregistrer quelque chose.

Écriture en mémoire pendant le match, vidage sur le stockage après le coup de sifflet, ce
qui satisfait LOG-EXJ-07 et reste cohérent avec LOG-EXS-09.

### 19.2 La base de temps est le prérequis

LOG-EXJ-04 n'est pas une commodité de format. Sans datation commune, un enregistrement n'est pas
un enregistrement mais une collection de flux qui ne se recouvrent pas : une mesure de
distance prise à un instant, une odométrie datée par une autre horloge, une position du mât
par une troisième. Au rejeu, les trois racontent des histoires différentes et l'outil devient
trompeur.

Le travail d'estimation du décalage entre horloges — carte moteurs, calculateur, dispositif
déporté — conditionne donc l'existence même du rejeu, et pas seulement la précision du
recalage.

### 19.3 Format

Critères, par ordre d'importance : indexé par le temps pour permettre le parcours libre
d'LOG-EXJ-11 ; auto-descriptif, pour qu'un fichier de novembre reste lisible en avril après
changement de structures ; **indépendant de l'intergiciel**, pour que la décision
d'architecture de la partie II reste réouvrable sans perdre les archives.

Ce dernier point est décisif : le format d'enregistrement doit survivre à un changement
d'avis sur tout le reste.

### 19.4 Le lecteur

Ce qui doit être affiché, au-delà de la liste d'LOG-EXJ-09 : le chemin planifié en plus de la
trace parcourue, l'action en cours et sa progression, les grandeurs électriques par rail, la
charge du bus et ses compteurs d'erreur, l'écart d'horloge estimé, la santé de chaque
processus.

Deux affichages valent particulièrement l'effort. **L'écart entre la position adverse vue par
le lidar et celle donnée par le dispositif déporté** : quand les deux divergent, on sait
immédiatement lequel a menti. Et **le panneau de décision** : à chaque instant de choix, les
actions candidates avec leur score. Sans lui, on voit ce que le robot a fait ; avec lui, on
voit pourquoi.

Si un visualiseur existant lit le format retenu avec ligne de temps, tracés et vue en plan,
l'essentiel du lecteur s'obtient en configuration plutôt qu'en code, et il ne reste à écrire
que le panneau de décision. C'est le critère qui devrait départager les formats candidats.

### 19.5 Le pont vers le simulateur

C'est la partie qui rapporte le plus pour le moins d'effort, et elle est à sens unique :
**du match vers le simulateur, jamais l'inverse.** Un match enregistré produit un fichier de
scénario que le simulateur consomme comme n'importe quel autre.

Contenu du scénario, conformément à LOG-EXJ-13 :

| Élément | Origine | Rôle dans le simulateur |
|---|---|---|
| Couleur, pose de départ, stratégie employée | Configuration enregistrée | Conditions initiales |
| Trajectoire de l'adversaire, échantillonnée | Dispositif déporté et mesures de distance | Rejouée en boucle ouverte |
| Chronologie des actions exécutées, avec début, fin et issue | État interne enregistré | Référence de comparaison |
| **Durées réellement mesurées de chaque action** | État interne enregistré | Alimente le modèle d'actions |
| Événements : pauses, blocages, recalages, alertes | Journal | Reproduits ou comptabilisés |
| Score final | Saisi après le match | Étalon |

**Le gain principal est la quatrième ligne.** Aujourd'hui, les durées du fichier de
description des actions sont des estimations. Après une compétition, ce sont des mesures. Le
simulateur cesse d'être un jouet dont on connaît d'avance la réponse et devient un banc
d'essai calibré sur le réel — c'est l'objet d'LOG-EXJ-15, et cela sert directement la
réutilisabilité pluriannuelle.

Limites à connaître avant d'y croire. L'adversaire rejoué en boucle ouverte est une
approximation qui se dégrade avec la durée : exploitable sur dix à vingt secondes de
divergence, sans valeur au-delà. Le simulateur n'a aucun modèle mécanique : dans un scénario,
la pince ne lâche jamais sa pièce. Et le résultat répond à « un autre ordre aurait-il marqué
plus, toutes choses égales par ailleurs », pas à « ce qui se serait passé ».

### 19.6 Ordre de réalisation

| Étape | Contenu | Effort estimé | Urgence |
|---|---|---|---|
| 1 | Enregistrement complet au format retenu | 2 à 3 jours | **Ne se rattrape pas** |
| 2 | Lecteur graphique, essentiellement par configuration | 2 à 4 jours | Quand on veut |
| 3 | Panneau de décision | 3 à 5 jours | Quand la stratégie décide |
| 4 | Conversion en scénario et comparaison au réel | 3 à 5 jours | Après la première compétition |

**Seule l'étape 1 est urgente**, et pour une raison qui n'a rien à voir avec sa difficulté :
un match non instrumenté est irrécupérable, alors que le lecteur peut être écrit en février
sur des matchs de novembre.

## Annexe II-A — Dossier ALERT / SYNC

Cette annexe conserve l'instruction complète de deux options matérielles écartées par le
responsable logiciel, pour que la décision puisse être reprise en réunion d'équipe sans
refaire l'analyse.

### A.1 Ce qui était proposé

Ajouter un ou deux conducteurs au faisceau du bus, qui transporte aujourd'hui 5 V, GND,
CAN_H et CAN_L :

- **ALERT**, ligne en collecteur ouvert câblée en OU, tirée au repos par une résistance.
  N'importe quelle carte peut la forcer à zéro ; toutes les autres le voient en quelques
  microsecondes.
- **SYNC**, impulsion courte émise par la Pi à 1 Hz, capturée par chaque carte sur un timer
  en mode capture, front descendant, pour mesurer directement le décalage d'horloge.

### A.2 L'argument de latence ne tient pas

Une trame `PAUSE` prioritaire à 500 kbit/s attend au pire la fin de la trame en cours,
260 µs, puis passe en 260 µs. On est sous la milliseconde. Le fil réagit en une dizaine de
microsecondes. **La différence vaut 0,8 mm à 0,8 m/s.**

Le seul argument qui tenait était l'**indépendance de panne** : le fil fonctionne quand le
contrôleur CAN est passé en bus-off, quand un firmware boucle dans une interruption, quand
un connecteur est à moitié déserti, quand la Pi redémarre.

### A.3 Cas d'usage recensés pour ALERT

| Carte | Situation | Ce qui se passe sans le fil |
|---|---|---|
| Alimentation | Court-circuit franc, avant ouverture du relais | La carte moteurs continue d'envoyer du PWM sur un pont sans alimentation ; l'intégrateur part en butée et le redémarrage donne un à-coup |
| Alimentation | Chute de tension sous le seuil critique | Reset en plein mouvement au lieu d'un freinage commandé |
| Moteurs | Perte d'une voie codeur, module SPI muet | L'odométrie devient fausse sans alarme, et le robot croit se déplacer correctement. Pire mode de panne du système |
| Moteurs | Écart de poursuite excessif, patinage, blocage | Émission d'une trame CAN et espoir qu'elle passe |
| Capteurs | Bras déployé au-dessus de la table, actionneur en butée | Déplacement avec mécanisme coincé, risque de casse |
| Arrêt d'urgence | Bouton enfoncé | Coupure brutale sans cause journalisée |

Les trois lignes qui portaient réellement la proposition : perte de codeur, actionneur
coincé, arrêt d'urgence journalisé.

### A.4 Ce qui a été retenu à la place

Le CAN redevient l'unique chemin de signalisation, avec les trames `FAULT` prioritaires
(8.4) et la LED de défaut mémorisée par carte comme diagnostic de dernier recours (8.4,
[PROPOSÉ]). Pour l'horloge, la synchronisation logicielle par filtre du minimum (7.3), dont
la précision d'environ une milliseconde est un ordre de grandeur sous l'erreur d'odométrie.

### A.5 Objections retenues contre les fils

Deux conducteurs de plus à sertir sur chaque carte, un connecteur à changer partout, et un
mode de panne non surveillé supplémentaire : une ligne ALERT bloquée à zéro immobilise le
robot sans que le CAN ne signale rien, et **elle empêche le départ par construction
matérielle**, ce qui contredit frontalement P6.

Sur SYNC, le gain est inférieur à l'erreur d'odométrie et n'a donc pas de justification
mesurable.

### A.6 Option intermédiaire, si l'équipe rouvre le sujet

Passer le connecteur à six positions, router les pistes vers un GPIO libre sur chaque
carte, et **ne pas sertir les conducteurs dans le faisceau**. Coût immédiat : une piste et
deux broches de connecteur. Si le besoin apparaît en cours de saison, c'est un sertissage
et non une refonte de cartes.

Si un seul fil devait être câblé, ce serait ALERT, pas SYNC.

### A.7 Points électriques, si la décision est reprise

- Capture sur front descendant, activement piloté ; en collecteur ouvert le front montant
  dépend de la résistance de tirage et il est mou.
- Le faisceau transporte du 5 V : résistance série de 330 Ω et diode de clamp vers 3,3 V
  sur l'entrée de la Pi, sous peine de détruire le GPIO sur une erreur de câblage.
- Une masse de garde entre les nouvelles lignes et la paire CAN dans le brochage du
  connecteur.
- La mémorisation d'un défaut se fait sur la LED, jamais sur la ligne : la ligne suit
  l'état vivant de la condition, pour qu'un défaut fugitif n'immobilise pas le robot
  définitivement.

---

## Annexe II-B — Amorce de conversation

Pour reprendre le travail avec un assistant, fournir ce document, préciser si la question
porte sur une exigence (partie I) ou sur une orientation technique (partie II), et citer la
fiche concernée en section 17 de la partie II. Les sujets les plus utiles à traiter en premier, par ordre de
dépendance : la procédure de préparation (17.11), le cahier des charges du mât (17.10) dont
dépend désormais le serveur PAMI, le mode identification (17.1) — le registre de trames et
le plan d'identifiants (17.3) étant désormais tranchés pour leur format —, le cahier des
charges PAMI (17.9), la poursuite de point cible (17.2), puis le format du fichier d'actions
(17.6).