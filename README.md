# CFR_2027

Dépôt de l'équipe EMA_Bot pour la Coupe de France de Robotique 2027.

## Structure du dépôt

La racine est organisée par sous-système physique, pour qu'on aille directement où l'on
veut : chacun se divise en `elec/`, `meca/`, `logiciel/`.

- [`robot_principal/`](robot_principal/) — le robot principal.
- [`mat/`](mat/) — le dispositif de calcul et d'observation déporté.
- [`pami/`](pami/) — les sept PAMI.
- [`commun/`](commun/) — ce qui s'applique à plusieurs sous-systèmes (normes électriques,
  outils de fabrication).
- [`docs/cdc/`](docs/cdc/) — cahiers des charges (logiciel robot, mât) et l'outillage de
  traçabilité qui les vérifie (`verif_cdc.py`, `cdc.yaml`). Voir `AGENTS.md` et
  `docs/cdc/conventions-cdc.md` avant de toucher à un de ces documents.
- [`docs/`](docs/) — schémas et documents transverses au projet (hors CDC).
- [`archive/`](archive/) — fichiers obsolètes ou de test conservés sans usage actif.
- [`AGENTS.md`](AGENTS.md) — instructions pour tout assistant (humain ou IA) travaillant sur
  ce dépôt.
- [`.claude/skills/`](.claude/skills/) — compétences Claude Code spécifiques au projet.

Dans chaque sous-système, l'architecture et ses motifs vivent dans le CDC correspondant ;
les dossiers de code n'en sont que la structure, jamais une recopie (règle 5 de
`docs/cdc/conventions-cdc.md`).

## Vérification des cahiers des charges

Dépendance requise une seule fois, dans un environnement virtuel au choix :

```
pip install -r docs/cdc/requirements.txt
```

Avant et après toute modification d'un CDC :

```
python3 docs/cdc/verif_cdc.py
```

Pour activer le contrôle automatique au commit :

```
git config core.hooksPath .githooks
```
