# Historique des cahiers des charges

Les modifications sont consignées ici et non dans le corps des documents.

## logiciel — 19 septembre 2026

Passe de confrontation à l'héritage 2026. Aucune exigence n'est créée, modifiée ni retirée ;
toutes les modifications portent sur la partie II. Le dépouillement complet est dans
`rapport-heritage-2026.md`.

| Section | Avant | Après |
|---|---|---|
| 15 | Grille vide, « un rapport logiciel de l'édition précédente existe mais n'a pas encore été fourni » | Grille remplie sur lecture du code et des deux firmwares. Trois axes ajoutés : chien de garde des cartes, télémétrie d'alimentation, asservissement |
| 15 | Implicite : un logiciel précédent | Deux branches distinctes, dont une seule a joué. Nav2 n'a jamais été instancié dans aucune des deux |
| 2.1 | Diagnostic de la boucle de redémarrage, non corroboré | Corroboré par quatre nœuds commentés dans le lanceur sous la mention « noeuds commentés pour fixer le crash loop ». La branche ROS a fini sans évitement |
| 7.3 | « Vérifier que le firmware tourne sur le HSE » | Aucune configuration d'horloge dans le dépôt : hypothèse de l'oscillateur interne, estimée. Mode opératoire précisé — sonde débranchée. Borne mesurée sur le relevé de bus : les deux cartes divergent d'environ 800 ppm entre elles, soit 80 ms sur un match |
| 17.5 | Question ouverte sur la technologie de l'IHM | Fermée : interface web déjà servie par la Pi en kiosque. Voie retenue, reprendre et étendre |
| 16.4, question 6 | « Reprise ou réécriture de l'IHM selon sa technologie » | Reformulée : où vit l'IHM, processus séparé ou affichage d'état dans le noyau |

### Faits établis qui ne changent pas le texte des exigences

La trame de télémétrie d'alimentation n'a jamais été émise en 2026 : l'appel est en
commentaire et l'acquisition analogique désactivée à la compilation. Aucune trame 0x020 sur
les 106 585 relevées au `candump`. L'affichage de batterie de l'IHM montrait zéro.

L'arrêt d'urgence coupe les trois relais, 5 V compris, mais les rails de commande 5 V ne
passent pas par un relais — vérifié sur la carte. LOG-EXS-08 est tenue, et F.4.c le tolère.
Ce qui manque est l'autre moitié de LOG-EXS-07 : aucune détection de défaut électrique
caractérisé, la seule cause de coupure est le bouton.

Aucun chien de garde, aucune minuterie de fin de match, aucune trame de version et aucun
code de défaut dans les deux firmwares lus.

Divergence d'unités active entre la Pi et la carte moteurs sur la commande de rotation
relative : milliradians émis, degrés relus. Illustration de LOG-EXD-02.

Charge du bus mesurée en configuration 2026 : 49,8 trames par seconde en moyenne, 53 au pic
sur une seconde, soit environ 1,3 % de la capacité retenue en 8.1.

## logiciel/v1.0 et mat/v0.3 — 4 septembre 2026

Passe de mise en cohérence entre le CDC logiciel et le CDC mât, et mise en place du
dispositif de traçabilité. Aucun choix technique n'a été rouvert.

### Corrections de fond

| Sujet | Avant | Après |
|---|---|---|
| Erreur de hauteur de marqueur | « plusieurs centimètres au coin lointain » (LOG) contre « plus de 15 cm » (MAT) | 163 mm, calculé : 80 × 2500 / 1230. Au-delà du seuil de rejet de 15 cm, donc le mât devient muet sans le dire |
| Budget du mât | 150–300 € (LOG 1.4), 325–470 € (LOG 17.8), 390–550 € (MAT 12.2) | 415–610 €, somme exacte des lignes. La borne haute de 550 € était fausse de 60 € |
| Coût de la structure du mât | 104–185 €, borne basse absente de la table 8.3 | 126–185 € |
| Filtrage de la calibration | LOG 10.2 demandait un filtre lent, que MAT 5 démontre faux contre les vibrations | LOG 10.2 aligné : rejet en amont, filtrage faible en aval, renvoi vers MAT 5 |
| Nombre de PAMI | « les 6 PAMI », « six plus un », « sept » | sept, soit six plus un, partout |
| Essais de dégradation | quatre annoncés, six listés, dix dans le plan de la partie I | plan unique en partie I (V1 à V13) ; LOG 13.3 devient le mode opératoire de V1 à V6 |
| Base de 220 mm (MAT 5) | valeur v0.1 périmée, corrigée en 1.1 mais réutilisée dans le raisonnement | 320 mm |
| Fréquences propres (MAT 5.1) | « 5 à 20 Hz », incohérent avec la table 8.3 | 16 à 51 Hz pour les tripodes, 7 Hz pour l'option PVC à jambe unique |
| Renvoi LOG 6.5 | `EXE-14`, identifiant inexistant, et contradiction avec 5.7 | `LOG-EXJ-14`, avec rappel que l'exploration a lieu dans le simulateur, pas dans le lecteur |
| Citations de version croisées | LOG citait « CDC mât v0.1 », MAT citait « CDC logiciel v0.4 » | supprimées, règle générale posée |
| Marge de masse du mât | « 110 mm de marge » | 110 g |
| Trame d'essai `CMD_VEL` (LOG 8.3) | trame inexistante, rejetée par le choix 4.2 | `GOTO` |

### Points fermés ailleurs, mis à jour

Taille et position des quatre tags de table, closes par MAT 3.4, retirées des entrées
manquantes de LOG 10.4, 17.7 et 17.10. Choix du calculateur du mât, tranché. Suivi de la
tranche colorée contre ArUco, tranché (question 13 de LOG 16.4 close). Nécessité de deux
caméras, remontée dans LOG 10.4. Échéances de LOG 16.4 alignées sur les fiches 17.
Rédaction du CDC mât retirée des jalons.

### Exigences ajoutées

| Identifiant | Objet |
|---|---|
| MAT-MXF-12 | Datation dans une base de temps dont le décalage avec le robot est estimable en continu — contrepartie de LOG-EXJ-04, qui n'en avait aucune |
| MAT-MXP-06 | Budget de latence de bout en bout, que le CDC logiciel supposait à 100–200 ms sans l'exiger |

Essais M6b et M10 ajoutés au plan du mât. Essais V11 à V13 ajoutés au plan du logiciel,
pour couvrir LOG-EXS-06, 07, 08, 11 et 12, jusque-là sans preuve. Fiche LOG 17.13 ouverte
pour le plan de vérification des exigences fonctionnelles, qui n'existait pas.

### Exigences retirées

`LOG-EXP-06` et `LOG-EXE-08`, voir `cdc.yaml:retires`.

### Structure

Identifiants d'exigence préfixés par leur document — 115 occurrences dans le CDC logiciel,
87 dans le CDC mât. Colonne « Principe » renommée « Origine » dans les deux tableaux de
sûreté, qui contenaient des besoins. Niveau de titre de LOG 17.12 corrigé. Renvoi vers une
« section 0 » inexistante corrigé dans MAT 12.1. Table des points ouverts du mât
renumérotée. Hypothèse de hauteur de cible à 440 mm explicitée dans MAT 2. Exigence
MAT-MXS-08 rendue explicite sur l'extinction entre les matchs.

### Ce qui n'a délibérément pas été fait

La déduplication des quatre zones de recouvrement identifiées — calibration du mât, relevé
du règlement, principes directeurs, procédure de préparation — est reportée à la révision
qui suivra la publication des règles annuelles du 19 septembre. Les documents sont d'ici là
protégés par les liens de `cdc.yaml` et par le contrôle des constantes.
