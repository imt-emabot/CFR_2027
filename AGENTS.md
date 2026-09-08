# Instructions pour tout assistant travaillant sur ce dépôt

Ce dépôt contient l'ensemble du projet de l'équipe pour la Coupe de France de
Robotique 2027 : cahiers des charges (`docs/cdc/`), électronique, mécanique et outils
logiciels. Voir `README.md` pour la structure complète.

**Avant de lire, modifier ou créer un document `.md` sous `docs/cdc/`, lire
`docs/cdc/conventions-cdc.md` et l'appliquer intégralement.** Ce n'est pas une préférence
de style : les identifiants, les liens entre documents et les valeurs partagées sont
contrôlés automatiquement, et une modification qui ne respecte pas ces conventions
fait échouer le contrôle.

Rappel des cinq règles :

1. Les identifiants d'exigence portent le préfixe de leur document : `LOG-EXS-04`,
   `MAT-MXP-01`.
2. Un identifiant retiré n'est jamais réattribué ; il est inscrit dans `cdc.yaml:retires`.
3. Une exigence dont le sens change est retirée et remplacée, jamais modifiée en place.
4. Aucun document n'est cité par son numéro de version ; on cite un identifiant ou une
   section.
5. Un sujet a un document propriétaire unique ; les autres renvoient au lieu de recopier.

Avant et après toute modification :

```
python3 docs/cdc/verif_cdc.py            # doit sortir « Aucune erreur »
python3 docs/cdc/verif_cdc.py --matrice  # régénère matrice-tracabilite.md
```

Sur un `LIEN SUSPECT`, relire l'exigence dérivée **avant** d'acquitter avec
`--empreintes`. L'acquittement ne vérifie rien.

Committer les documents, `cdc.yaml` et la matrice ensemble.
