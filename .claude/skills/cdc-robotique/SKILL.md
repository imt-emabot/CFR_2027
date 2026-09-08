---
name: cdc-robotique
description: Applique les conventions de rédaction, d'identification et de traçabilité des cahiers des charges du projet Coupe de France de Robotique 2027. Déclenche cette compétence dès qu'il s'agit de lire, modifier, relire, compléter ou créer un cahier des charges de ce projet — CDC logiciel du robot, CDC du dispositif de calcul déporté (mât), CDC PAMI, ou tout nouveau CDC —, dès qu'une exigence est ajoutée, reformulée ou retirée, dès qu'un identifiant du type LOG-EXS-04 ou MAT-MXP-01 apparaît dans l'échange, et dès que Quentin demande de vérifier la cohérence entre plusieurs documents du projet. Ne l'applique pas aux autres documents techniques ni aux échanges de conception qui ne touchent pas au texte d'un CDC.
---

# Cahiers des charges — Coupe de France de Robotique 2027

## Avant toute chose

Lire `docs/cdc/conventions-cdc.md`. **C'est la source ; ce fichier n'en est que
le rappel opérationnel.** En cas de divergence entre les deux, `docs/cdc/conventions-cdc.md`
gagne, et il faut le signaler.

Lire aussi `docs/cdc/cdc.yaml`, qui liste les documents sous gestion, les identifiants
retirés, les constantes partagées et les liens inter-documents.

## Les cinq règles qui ne se négocient pas

1. **Identifiant préfixé par le document.** `LOG-EXS-04`, `MAT-MXP-01`. Jamais `EXS-04` seul,
   sauf pour les besoins, principes et essais cités dans leur propre document.
2. **Un identifiant retiré n'est jamais réattribué.** Il va dans `cdc.yaml:retires` avec sa
   date et son motif.
3. **Une exigence dont le sens change est retirée et remplacée**, pas modifiée en place.
   Seule la reformulation à sens constant est autorisée. Cette règle est la condition de
   validité de tout le reste.
4. **Aucun document n'est cité par son numéro de version.** On cite un identifiant ou une
   section.
5. **Un sujet a un document propriétaire unique.** Les autres renvoient. Ne jamais recopier
   du contenu d'un CDC dans un autre sans l'annoncer et sans renvoyer.

## Ce qu'il faut faire à chaque modification

1. `python3 docs/cdc/verif_cdc.py` avant de commencer. S'il échoue déjà, comprendre pourquoi
   avant d'ajouter quoi que ce soit.
2. Modifier.
3. Ouvrir `docs/cdc/matrice-tracabilite.md` et relire les **liens entrants** de chaque
   exigence touchée. Si l'un d'eux devient faux, l'exigence dérivée est à ajuster dans
   l'autre document, dans la même passe.
4. `python3 docs/cdc/verif_cdc.py`. Traiter chaque erreur, elles sont toutes réelles.
5. Sur un `LIEN SUSPECT` : **relire l'exigence dérivée avant d'acquitter.**
   `verif_cdc.py --empreintes` acquitte sans rien vérifier ; l'utiliser sans avoir relu vide
   le dispositif de son sens.
6. `python3 docs/cdc/verif_cdc.py --matrice`.
7. Proposer les documents, `cdc.yaml` et la matrice ensemble.

## Pour créer un nouveau cahier des charges

Suivre la section 9 de `docs/cdc/conventions-cdc.md`. Points où l'on se trompe :

- Le préfixe de trois lettres et les catégories vont dans `cdc.yaml:documents` **avant**
  d'écrire la première exigence.
- La séparation partie I / partie II se teste phrase par phrase : ce qu'un arbitre ou un
  essai pourrait vérifier sans savoir comment le système est fait va en partie I ; ce qui
  nomme une bibliothèque, un protocole, un composant ou une structure de programme va en
  partie II.
- `[ACTÉ]` veut dire « retenu à ce stade et non remis en cause depuis », jamais « décidé ».
- Un `[REJETÉ]` garde son motif. C'est ce qui permet de rouvrir sans refaire l'analyse.
- Écrire les liens vers les documents existants avant de considérer le document comme
  rédigé. Un CDC sans lien est presque toujours un CDC qui duplique.

## Ce qu'il ne faut pas faire

- Réécrire un document en entier pour le « mettre au propre ». Les modifications sont
  ponctuelles et vérifiables ; une réécriture globale perd de l'information et rend le diff
  illisible.
- Supprimer une analyse de la partie II parce qu'elle porte sur une option écartée. Le motif
  d'un rejet est ce qui a le plus de valeur dans six mois.
- Uniformiser la prose. La partie II est un journal de conception, pas une spécification.
- Ajouter une exigence sans origine, sans mode de vérification, ou sans essai correspondant.
- Inventer un chiffre. Si une valeur n'est ni mesurée ni calculable à partir du document,
  l'écrire comme estimée et le dire.

## Style

Ces documents distinguent systématiquement le vérifié de l'estimé, donnent le motif d'un
choix et ce qui le ferait reconsidérer, et gardent les contre-arguments. Écrire dans le même
registre : phrases courtes, prose et tableaux, pas de gras d'emphase décoratif, pas de
section « Conclusion ».
