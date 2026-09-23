# CFR_2027

Dépôt de l'équipe EMA_Bot pour la Coupe de France de Robotique 2027.

> **Dépôt public.** Tout fichier ajouté ici peut être lu, copié et archivé par des tiers.
> Ne jamais y ajouter de mot de passe, clé privée, jeton, identifiant personnel non
> nécessaire ou document dont la redistribution n'est pas autorisée.

Avant chaque publication importante, vérifier les secrets, les droits de redistribution des
règlements et autres documents externes, ainsi que les fichiers CAO ou données que l'équipe
ne souhaite pas rendre publics.

## Présentation publique

Ce dépôt rassemble le développement de l'équipe : cahiers des charges, électronique,
mécanique et logiciels du robot principal, du mât et des PAMI. Il est organisé par
sous-système pour permettre à un lecteur extérieur de comprendre le projet sans connaître
l'historique de l'équipe.

Le projet est en cours de développement. Les éléments marqués comme étude, hypothèse,
proposé ou héritage ne constituent pas une solution validée.

### État du projet

- Cahiers des charges logiciel et mât : en cours de consolidation.
- Workspace ROS 2 : squelette colcon présent pour le robot principal.
- Navigation et locomotion : architecture et protocole CAN en conception.
- IHM : héritage 2026 conservé dans `legacy/`, portage non commencé.
- Électronique et mécanique : dossiers de conception en cours de développement.

## Démarrage rapide

Pour consulter le projet, aucun outil particulier n'est nécessaire. Pour travailler sur les
cahiers des charges :

```bash
pip install -r docs/cdc/requirements.txt
python3 docs/cdc/verif_cdc.py
```

Pour construire le workspace ROS 2 du robot principal avec l'installation Lyrical locale :

```bash
cd robot_principal/logiciel
source /opt/ros/lyrical/setup.bash
colcon build --symlink-install
```

## Licence et réutilisation

Le projet vise une publication du code et de la documentation avec des conditions
différenciées pour les usages non commerciaux et commerciaux. Une interdiction d'utilisation
commerciale n'est pas compatible avec la définition de l'open source de l'OSI ; tant que la
licence n'est pas arrêtée et publiée, le projet doit être décrit comme **source-available**,
et non comme open source.

Aucune licence ne doit être déduite de ce README. Les fichiers restent soumis à leurs droits
respectifs jusqu'à la publication d'un fichier `LICENSE`. Le choix devra notamment préciser
le traitement séparé du code, des documents, des schémas électroniques, des modèles CAO et
des images. Une licence source-available non commerciale, ou une double licence avec une
offre commerciale séparée, pourra être étudiée avec un avis juridique.

## Structure du dépôt

La racine est organisée par sous-système physique, pour qu'on aille directement où l'on
veut : chacun se divise en `elec/`, `meca/`, `logiciel/`.

- [`robot_principal/`](robot_principal/) — le robot principal.
- [`mat/`](mat/) — le dispositif de calcul et d'observation déporté.
- [`pami/`](pami/) — les sept PAMI.
- [`commun/`](commun/) — ce qui s'applique à plusieurs sous-systèmes (normes électriques,
  outils de fabrication).
- [`docs/cdc/`](docs/cdc/) — cahiers des charges (logiciel robot, mât) et l'outillage de
  traçabilité qui les vérifie (`verif_cdc.py`, `cdc.yaml`). Voir
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
