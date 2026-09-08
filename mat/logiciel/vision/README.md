# vision

Deux flux caméra, calibration continue, détection couleur et détection ArUco
opportuniste, émission des poses vers le robot (CDC mât, section 9.1 et 9.2). Processus
secondaire : peut mourir sans faire tomber `pami-server`.

Renvois : dimensionnement optique et limites de l'ArUco (section 3), caméras et
horodatage par ligne (section 4), calibration continue (section 5), modes dégradés
(section 9.3).

Reçoit la couleur active de `pami-server` (robot en priorité, sélecteur de secours sinon)
pour fixer ses fenêtres de seuillage ; ne la choisit jamais elle-même (section 10).
