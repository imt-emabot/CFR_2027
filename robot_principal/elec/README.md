# Électronique — robot principal

Cartes du robot principal, toutes refaites pour la saison 2027 (CDC logiciel, section 1.3).

- `alim/` — carte alimentation (STM32) : entrée LiPo 4S, sorties 5 V/12 V, mesure par
  INA3221, coupure par relais.
- `carte_bat/` — carte de gestion de la batterie.

À venir, pas encore dans le dépôt (CDC logiciel, section 1.3) :

- **carte moteurs** (STM32) — source de vérité de la pose du robot, code à réviser voire
  réécrire.
- **cartes capteurs / actionneurs** (STM32C09x) — refondues chaque année selon les actions
  de jeu.

Le choix de gamme de microcontrôleurs pour ces cartes est encore ouvert (section 1.3).
