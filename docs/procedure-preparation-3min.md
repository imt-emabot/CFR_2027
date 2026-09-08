# Procédure de préparation — trois minutes

Fiche 17.11 du CDC logiciel. Cette procédure n'est pas de l'intendance : elle détermine ce
que le logiciel doit automatiser, donc elle est écrite avant de coder l'IHM et la machine à
états. Le détail se figera avec les règles annuelles du 19 septembre 2026, mais la structure
ci-dessous ne dépend pas d'elles.

Document propriétaire des exigences citées ici : CDC logiciel (`cdc-logiciel-robot-v1_0.md`)
et CDC mât (`cdc-mat-v0_3.md`). Ce document ne fait qu'organiser leur exécution dans le temps
et n'introduit aucune exigence nouvelle.

## Cadre

Trois minutes, à deux personnes, chronomètre en main (H.1, LOG-EXE-01). Aucun ordinateur
extérieur n'est nécessaire (LOG-EXE-04). Pénalités qui bornent directement cette procédure :

| Manquement | Sanction | Exigence qui s'en protège |
|---|---|---|
| Dépassement des trois minutes | Match retardé, tension sur l'équipe suivante | LOG-EXE-01 |
| Mouvement entre la fin de la préparation et le signal de départ | −50 points (faux départ), forfait si récidive | LOG-EXR-05 |
| Robot hors de sa zone de départ à la fin de la préparation | −50 points (changement de zone) | LOG-EXR-06 |
| Départ déclenché autrement que par le cordon de tirette | Non homologué | LOG-EXR-11 |

## Avant de monter sur la table

Hors budget des trois minutes — c'est ce qui rend le budget tenable (CDC logiciel, 11.5 ;
CDC mât, section 11) :

- Mise sous tension du robot, du mât et du serveur PAMI.
- Les PAMI sont allumés et déjà connectés au serveur.
- Rien ne doit être câblé, tapé au clavier ou configuré une fois sur la table.

## Sur la table — les trois minutes

Deux personnes en parallèle. Personne A reste au robot du début à la fin ; Personne B
s'occupe du mât puis rejoint les PAMI. Colonne **M/A** : manuel ou automatique une fois
déclenché.

| # | Personne A — robot | M/A | Personne B — mât puis PAMI | M/A |
|---|---|---|---|---|
| 1 | Bascule en mode match officiel, bandeau vérifié (section 12) | M | Poser le mât sur sa moitié de plateforme, engager la tige M8 dans la rainure | M |
| 2 | Choisir la couleur d'équipe sur l'IHM | M | Serrer l'écrou papillon | M |
| 3 | Saisir la hauteur de marqueur adverse sur l'IHM (transmise au mât, voir *Point tranché* ci-dessous) | M | Lancer le calibrage — se termine en quelques secondes | M puis A |
| 4 | Choisir la stratégie : moteur automatique ou séquence forcée (11.3) | M | Sortir les PAMI, les placer un par un dans l'ordre | M |
| 5 | Initialisation des actionneurs en position par défaut, en une commande, avant le recalage | M puis A | Armer chaque PAMI : calage dans sa zone puis déplacement vers sa position de départ | M puis A |
| 6 | Lancer le recalage par contact, en désignant le coin utilisé ; ramène le robot dans sa zone de départ (LOG-EXR-06) | M puis A | Rejoindre Personne A | M |
| 7 | Attendre que les PAMI soient prêts | — | — | — |
| 8 | Amener le robot en position de départ | M | | |
| 9 | Bouton d'arrêt d'urgence enfoncé puis relâché : aucun mouvement ne doit se produire (13.2) | M | | |
| 10 | Passage en `PRET`, affiché explicitement sur l'IHM (11.4) | M | | |
| 11 | Poser le cordon de tirette | M | | |

Aucune étape côté mât ne doit dépasser vingt secondes (CDC mât, section 11). Le même seuil
sert de signal d'alarme côté robot (17.11) : toute étape qui le dépasse doit soit être
automatisée, soit être faite avant d'arriver sur scène.

## Point tranché par cette procédure

**Question 14 de LOG 16.4 / point 6 de MAT 13 : couleur d'équipe et hauteur de marqueur se
saisissent sur l'IHM du robot, transmises au mât, jamais sur sa page — sauf garde-fou pour
la couleur.** Écrit dans les deux CDC (LOG 14.5, MAT 10 et 9.3).

La séquence côté mât n'admet « aucun câble, aucun clavier, aucune manipulation sur la
table » une fois le mât posé (CDC mât, section 11) : y ajouter une saisie y contredirait.
Mais le principe tenu partout dans ce système est que chaque sous-système démarre en
supposant la connectivité disponible, sans jamais en dépendre pour démarrer (LOG 14.1,
14.3, MAT 9.3). D'où trois niveaux, du nominal au totalement isolé :

| Niveau | Couleur | Où |
|---|---|---|
| 1 — nominal | Choisie sur l'IHM du robot (ligne 2 ci-dessus), transmise au mât dès sélection | Robot → mât → PAMI |
| 2 — mât isolé du robot | Sélecteur de secours sur la page du mât ; alimente la vision et les PAMI, ne remonte jamais au robot | Mât → PAMI seulement |
| 3 — PAMI isolé de tout | Sélecteur physique de couleur (et de numéro) sur le PAMI lui-même (CDC logiciel, 14.3) | Local au PAMI |

La hauteur de marqueur adverse n'a que le niveau 1 : aucun repli n'est défini si le mât ne
la reçoit jamais **[OUVERT]**, contrairement à la couleur.

## Ce qui reste ouvert

- **Mécanisme de bascule mode essai / mode match officiel** (LOG 16.4 #12) : cette procédure
  suppose un choix manuel et visible en bandeau. Le choix entre bascule manuelle,
  expiration automatique après délai, ou cavalier physique reste à trancher (échéance 1
  mois) ; aucune option ne doit **bloquer** un départ, conformément à P6.
- **Calage et repositionnement des PAMI** : dépendent des zones de départ et de la stratégie
  retenue, donc des règles annuelles. À reprendre après le 19 septembre (CDC logiciel, 11.5).
- **Repli sur la hauteur de marqueur adverse.** La couleur a désormais un garde-fou (voir
  ci-dessus) ; la hauteur n'en a aucun. Si le mât ne la reçoit jamais, personne n'a encore
  dit s'il utilise une valeur par défaut ou la dernière connue (CDC mât, section 10).
- **Chronométrage réel.** Les durées de ce document sont la structure attendue, pas des
  mesures : aucune n'est encore chronométrée. L'essai V6 du plan de vérification (« cycle de
  préparation complet, chronométré, incluant coupure et remise en puissance ») est le
  moment de le faire, et de corriger cette page en conséquence.
