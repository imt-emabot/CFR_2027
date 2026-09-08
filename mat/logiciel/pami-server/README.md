# pami-server

Point d'accès applicatif, tirette physique et enregistrement des PAMI, attribution des
numéros, diffusion de la date de départ, page de supervision, journaux (CDC mât, section
9.1). Processus vital : ne doit jamais tomber à cause de `vision`.

Renvois : contrat PAMI, dont le départ est une date et non un ordre, et les trois niveaux
de repli (CDC logiciel, section 14). Message d'état du monde et transport UDP unicast
répété (CDC logiciel, section 14.4 et 14.5 ; CDC mât, section 6.4).

Porte le sélecteur de couleur de secours sur sa page de supervision, utilisé seulement si
aucun robot n'a jamais transmis de couleur. Relaie la couleur active — reçue du robot en
priorité, sélecteur de secours sinon — à `vision` pour sa calibration et aux PAMI ; jamais
l'inverse, une sélection de secours ne remonte jamais vers le robot (CDC logiciel, section
14.5 ; CDC mât, section 10).
