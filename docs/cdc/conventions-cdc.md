---
title: "Conventions des cahiers des charges"
subtitle: "Coupe de France de Robotique 2027"
date: "4 septembre 2026"
lang: fr
---

Ce fichier est la référence unique pour écrire, modifier ou créer un cahier des charges de
ce projet. Il s'adresse autant à un humain qu'à un assistant. **Toute personne ou tout outil
qui touche à un `.md` de ce dépôt applique ce qui suit**, sans exception et sans le
renégocier au cas par cas.

Le contrôle automatique est `verif_cdc.py`. Il ne génère rien : les documents restent écrits
à la main. Il lit, il compare, il refuse. Une modification qui le fait échouer n'est pas
terminée.

# 1. Ce qui est sous gestion, et ce qui ne l'est pas

| Sous gestion | Libre |
|---|---|
| Partie I de chaque document : besoins, contraintes, exigences, plan de vérification | Partie II : analyses, calculs, orientations, options écartées |
| Les identifiants cités partout, y compris en partie II | La prose, les tableaux de comparaison, les annexes |
| Les valeurs déclarées dans `cdc.yaml:constantes` | Tout le reste des chiffres |
| Les liens entre exigences de documents différents | Les renvois de section internes |

La partie II est le journal de conception. Sa valeur est d'être libre. On n'y impose que deux
choses : les identifiants cités doivent exister, et les valeurs partagées doivent être les
bonnes.

# 2. Identifiants

## 2.1 Forme

```
<DOC>-<CAT>-<NN>          exemple : LOG-EXS-04, MAT-MXP-01
```

`DOC` est le préfixe à trois lettres du document, déclaré dans `cdc.yaml`. `CAT` est la
catégorie d'exigence, `NN` un numéro à deux chiffres, séquentiel dans la catégorie.

Les catégories en vigueur, à reprendre à l'identique dans tout nouveau document :

| Suffixe | Contenu |
|---|---|
| `xxR` | Exigences réglementaires |
| `xxF` | Exigences fonctionnelles |
| `xxS` | Exigences de sûreté et de dégradation |
| `xxP` | Exigences de performance |
| `xxE` | Exigences d'exploitation |
| `xxD` | Exigences de développement et de pérennité |
| `xxJ` | Exigences d'enregistrement, de rejeu et de capitalisation, si le document en a |

Les besoins (`B1`…), les principes (`P1`…, `Q1`…) et les essais (`V1`…, `M1`…) sont locaux au
document. Dans le corps du document qui les définit, on les écrit sans préfixe. **Cités depuis
un autre document, ils portent le préfixe** : `LOG-P3`, jamais `P3`.

## 2.2 Trois règles inviolables

**Un identifiant retiré n'est jamais réattribué.** Il est inscrit dans `cdc.yaml:retires`
avec sa date et son motif. Le vérificateur refuse un trou de numérotation non déclaré,
parce qu'un trou muet est indistinguable d'un oubli.

**Une exigence dont le sens change est retirée et remplacée par un nouvel identifiant.** On
ne modifie en place qu'une reformulation à sens constant. C'est la règle qui donne leur
valeur aux liens : sans elle, un identifiant ne désigne plus rien de stable.

**Aucun document n'est cité par son numéro de version.** On cite un identifiant d'exigence ou
une section. La version vit dans les étiquettes du dépôt, pas dans le texte. Cette règle
n'est pas une préférence de style : elle supprime par construction la classe d'erreurs où
deux documents se renvoient à des versions mortes.

# 3. Liens entre documents

Quand une exigence d'un document dépend d'une exigence d'un autre, le lien est inscrit dans
`cdc.yaml:liens` :

```yaml
- de: MAT-MXP-01
  vers: LOG-EXS-12
  motif: "Le seuil d'erreur admissible du mât est fixé par le test d'innovation du robot"
  empreinte: 3f9c1a04
  valide_le: "2026-09-04"
```

`empreinte` est la signature de l'énoncé de la cible au moment où le lien a été relu et
accepté. Si `LOG-EXS-12` change, le vérificateur écrit :

```
LIEN SUSPECT — MAT-MXP-01 dérive de LOG-EXS-12, dont l'énoncé a changé
depuis la validation du 2026-09-04. Relire MAT-MXP-01, puis revalider.
```

C'est le seul mécanisme du dispositif qui détecte une dérive silencieuse plutôt qu'une
rupture franche, et c'est celui pour lequel tout le reste existe. **Ne jamais revalider une
empreinte sans avoir relu l'exigence source.** `--empreintes` acquitte, il ne vérifie rien.

Une exigence qui reprend le même sujet des deux côtés d'une interface a toujours un lien.
En cas de doute, écrire le lien : un lien de trop coûte une relecture, un lien manquant coûte
une divergence qu'on découvre en compétition.

# 4. Propriété du contenu

Un sujet a un document propriétaire et un seul. Les autres n'en gardent que ce dont leur
lecteur a besoin sans ouvrir le document propriétaire, plus un renvoi.

| Sujet | Propriétaire |
|---|---|
| Calibration du mât, chaîne de vision, dimensionnement optique, hauteur de marqueur | CDC mât |
| Contrat d'interface consommé par le robot : pose, datation, confiance, seuil de rejet | CDC logiciel |
| Protocole PAMI, niveaux de repli, transport | CDC logiciel, section 14, jusqu'à l'ouverture du CDC PAMI |
| Règlement général : relevé et pénalités | CDC logiciel, partie I, section 3.1 |
| Plan de vérification d'un document | Sa propre partie I, section 6 |

Quand un document reprend du contenu d'un autre, il l'annonce et il renvoie. Il ne le
recopie pas. La duplication non annoncée est ce qui a produit les divergences de la v0.9.

# 5. Constantes partagées

Une valeur qui apparaît dans plus d'un document, ou dans plus d'un endroit d'un même
document, est déclarée dans `cdc.yaml:constantes` avec la liste des littéraux périmés qu'elle
remplace. Le vérificateur refuse la réapparition d'un littéral périmé.

Une mention historique légitime — « provisionnait initialement 150 à 300 € » — est autorisée
en l'inscrivant dans `exceptions`, jamais en retirant l'interdit.

# 6. Plan de vérification

Toute exigence dont la colonne de vérification contient `E` est couverte par au moins un
essai du plan de son document, ou inscrite dans `cdc.yaml:couverture_exemptee` avec le motif.
Une exemption sans motif n'est pas une exemption.

Les exigences vérifiées uniquement par `I` sont contrôlées par inspection à la revue de
document et n'ont pas besoin d'essai. Chaque document le dit explicitement sous son plan.

# 7. Versions et publication

Une version se matérialise par une étiquette de dépôt, `logiciel/v1.0`, `mat/v0.3`. Le
numéro écrit dans le frontmatter d'un document est le sien, et n'est jamais celui d'un autre.

L'historique des changements se lit dans le dépôt, pas dans le corps du texte. Les notes du
type « correction par rapport à la v0.1 » sont admises tant qu'un lecteur peut en tirer un
motif utile, et retirées dès qu'elles ne renvoient plus qu'à une version que personne n'a
lue.

# 8. Procédure — modifier un document existant

1. Lancer `python3 verif_cdc.py`. S'il échoue déjà, ne rien ajouter avant d'avoir compris
   pourquoi.
2. Faire la modification. Si elle change le **sens** d'une exigence, ne pas la modifier en
   place : retirer l'ancien identifiant dans `cdc.yaml:retires`, en créer un nouveau.
3. Relire les liens entrants de toute exigence touchée — `matrice-tracabilite.md`, colonne
   « liens entrants ».
4. Relancer `verif_cdc.py`. Traiter chaque erreur. Pour un lien suspect : relire l'exigence
   dérivée, l'ajuster si nécessaire, puis `verif_cdc.py --empreintes`.
5. Régénérer la matrice : `verif_cdc.py --matrice`.
6. Committer les documents, `cdc.yaml` et la matrice ensemble. Jamais séparément : c'est ce
   qui rend le diff lisible.

# 9. Procédure — créer un nouveau cahier des charges

1. Choisir un préfixe de trois lettres libre et l'inscrire dans `cdc.yaml:documents`, avec
   les catégories et le préfixe d'essais.
2. Reprendre la structure des documents existants, qui est délibérée :
   - un préambule « Comment lire ce document » et la section « Identifiants et renvois » ;
   - **partie I** — objet et périmètre, besoins numérotés, contraintes subies, principes
     directeurs, exigences par catégorie, plan de vérification, « ce qui n'est pas une
     exigence » ;
   - **partie II** — analyses, calculs, orientations avec leur statut, points ouverts.
3. Règle d'écriture qui sépare les deux parties : une phrase qui nomme une bibliothèque, un
   protocole, un composant ou une structure de programme appartient à la partie II. Une
   phrase qu'un arbitre ou un essai pourrait vérifier sans savoir comment le système est
   fait appartient à la partie I.
4. Statuts admis en partie II : `[ACTÉ]`, `[PROPOSÉ]`, `[OUVERT]`, `[REJETÉ]`, `[REPORTÉ]`.
   `[ACTÉ]` signifie « retenu à ce stade et non remis en cause depuis », pas « décidé ».
   Un `[REJETÉ]` conserve son motif : c'est ce qui permet de rouvrir sans refaire l'analyse.
5. Écrire les liens vers les documents existants **avant** de considérer le document comme
   rédigé. Un CDC sans lien entrant ni sortant est presque toujours un CDC qui duplique.
6. Lancer `verif_cdc.py --empreintes --matrice`.

# 10. Ce que le vérificateur contrôle

| Code | Contrôle |
|---|---|
| C1 | Unicité des identifiants sur l'ensemble des documents |
| C2 | Aucun identifiant retiré n'est réutilisé comme exigence active |
| C3 | Aucun trou de numérotation non déclaré |
| C4 | Tout identifiant cité existe, et porte son préfixe de document |
| C5 | Toute exigence en `E` est couverte par un essai ou exemptée avec motif ; tout essai ne couvre que des exigences existantes |
| C6 | Colonne d'origine renseignée (avertissement) |
| C7 | Aucune valeur périmée d'une constante partagée |
| C8 | Aucun document cité par son numéro de version |
| C9 | Empreintes des liens inter-documents à jour |

Ce qu'il ne contrôle pas, et qu'aucun outil ne contrôlera : qu'une exigence soit juste,
qu'elle soit utile, et qu'elle dise ce qu'on croit qu'elle dit.
