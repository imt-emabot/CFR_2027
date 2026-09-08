# PAMI

Sept PAMI — six plus un — chacun embarquant un microcontrôleur Wi-Fi (CDC logiciel,
section 14.1). Tout ce qui constitue les PAMI : électronique, mécanique, logiciel.

- [`elec/`](elec/) — électronique embarquée des PAMI.
- [`meca/`](meca/) — mécanique des PAMI.
- [`logiciel/`](logiciel/) — firmware embarqué.

Rien n'existe encore dans ce dépôt : ces dossiers fixent l'emplacement attendu. Le
contrat que les PAMI doivent respecter côté réseau et côté stratégie (départ sur date,
trois niveaux de repli, transport UDP unicast répété, évitement coopératif) est décrit
dans `docs/cdc/cdc-logiciel-robot-v1_0.md`, section 14 — document propriétaire, à ne pas
recopier ici (règle 5 de `docs/cdc/conventions-cdc.md`).
