---
title: "Étude du moteur de locomotion"
subtitle: "Maverick Hex Planetary Gearbox Motor — rapport 13,7:1"
date: "23 septembre 2026"
lang: fr
---

# Objet et statut

Ce document évalue le moteur envisagé pour la locomotion du robot principal. Il ne vaut pas
encore validation du choix : les données constructeur et les mesures sur le moteur réel
doivent être séparées des hypothèses de simulation.

**Statut : à l'étude.** Les calculs donnent un ordre de grandeur pour dimensionner le
contrôle et la mécanique. Ils ne remplacent ni la fiche technique complète ni un essai sur
banc avec la roue, le sol et la batterie retenus.

## 1. Moteur étudié

**Référence :** Maverick Hex Planetary Gearbox Motor with Encoder, réducteur `13,7:1`.

- [Page constructeur Studica](https://www.studica.co/maverick-with-planetary-gearbox-1371-6mm-hex-shaft)
- [Photographie disponible dans le dépôt](Maverick-Gearbox-Information.webp)

### Données visibles dans la page constructeur

| Paramètre | Valeur | Statut |
|---|---:|---|
| Tension nominale | `12 V DC` | constructeur |
| Courant au blocage | `11 A` | constructeur |
| Rapport du réducteur | `13,7:1` | constructeur |
| Arbre de sortie | hexagonal, `6 mm` | constructeur |
| Diamètre du corps | `37 mm` | constructeur |
| Câble de puissance | PP45, `45 cm`, `14 AWG` | constructeur |
| Câble encodeur | `45 cm`, `22 AWG`, quatre conducteurs | constructeur |

### Tableau constructeur des rapports planétaires

Le tableau extrait de la documentation Studica complète les caractéristiques de la page
produit. Les valeurs associées au rapport étudié sont donc des données constructeur :
`445,26 tr/min`, `1,73 N.m` et `328,8 CPR` pour le rapport `13,7:1`.

| Rapport | Vitesse à vide | Couple de blocage | Encodeur |
|---:|---:|---:|---:|
| `1,00:1` | `6100,00 tr/min` | `0,13 N.m` | `24 CPR` |
| `3,70:1` | `1648,65 tr/min` | `0,47 N.m` | `88,8 CPR` |
| `5,20:1` | `1173,08 tr/min` | `0,66 N.m` | `124,8 CPR` |
| `13,70:1` | `445,26 tr/min` | `1,73 N.m` | `328,8 CPR` |
| `19,20:1` | `317,71 tr/min` | `2,42 N.m` | `460,8 CPR` |
| `26,90:1` | `226,77 tr/min` | `3,39 N.m` | `645,6 CPR` |
| `50,90:1` | `119,84 tr/min` | `6,41 N.m` | `1221,6 CPR` |
| `71,20:1` | `85,67 tr/min` | `8,97 N.m` | `1708,8 CPR` |
| `99,50:1` | `61,31 tr/min` | `12,54 N.m` | `2388 CPR` |
| `139,10:1` | `43,85 tr/min` | `17,53 N.m` | `3338,4 CPR` |
| `188,60:1` | `32,34 tr/min` | `23,76 N.m` | `4526,4 CPR` |

L'inductance d'induit n'est pas fournie dans ce tableau. La valeur `0,8 mH` reste donc une
hypothèse à mesurer ou à confirmer dans une fiche électrique séparée.

## 2. Hypothèses du robot

| Paramètre | Valeur utilisée | Statut |
|---|---:|---|
| Masse totale | `8 kg` | hypothèse de simulation |
| Nombre de roues motrices | `2` | architecture actuelle |
| Diamètre de roue | `3 in = 76,2 mm` | hypothèse de simulation |
| Rayon de roue | `R = 38,1 mm` | calculé |
| Batterie | LiPo 4S, `14,8 V` nominal, `16,8 V` pleine charge | hypothèse |
| Rendement du réducteur | `eta = 0,61` | estimation, à mesurer ou documenter |
| Inertie rotor + premiers étages | `1,5e-5 kg.m²` | estimation non sourcée |

Les résultats sont sensibles à la masse, au diamètre réellement en charge, au rendement et
à l'adhérence. Ces paramètres devront être mesurés avant de fixer les limites de vitesse et
d'accélération du contrôleur.

## 3. Paramètres électromécaniques calculés

Les calculs ci-dessous utilisent `12 V`, `11 A`, `r = 13,7`, `eta = 0,61` et les valeurs
du tableau constructeur pour le rapport étudié.

### 3.1 Résistance et constantes moteur

- **Résistance d'induit ($R_a$) :** $R_a = 12/11 \approx 1,09\ \Omega$.
- **Inductance d'induit ($L_a$) :** $\approx 0,8\text{ mH}$, hypothèse typique non confirmée.
- **Constante de vitesse ($K_e$) :** $\approx 0,0188\text{ V/(rad/s)}$, calculée à partir de
       `6100 tr/min` à `12 V` sur l'arbre moteur.
- **Constante de couple moteur ($K_t$) :** $\approx 0,0188\text{ N.m/A}$, déduite de
       `1,73 N.m` au blocage en sortie, avec `r = 13,7` et `eta = 0,61`.
- **Constante de couple en sortie ($K_{t,out}$) :** $K_{t,out} = K_t r \eta \approx 0,157\text{ N.m/A}$.
- **Rapport de réduction ($r$) :** `13,7:1`, donnée constructeur.

### 3.2 Encodeur et odométrie

Le tableau montre que `328,8 CPR = 24 CPR × 13,7`. La valeur est donc cohérente avec un
encodeur de `24 CPR` sur l'arbre moteur et `328,8 CPR` par tour de sortie du réducteur.
Pour l'odométrie, avec une roue de `76,2 mm` :

$$
N_m = \frac{328,8}{2\pi \times 0,0381}
\approx 1\,373,5\ \text{impulsions/m}.
$$

La résolution géométrique attendue est donc environ `1 373,5 impulsions/m` en sortie de
réducteur. Il reste à confirmer expérimentalement si `CPR` désigne une période de voie, un
compte en quadrature ou un nombre de fronts comptés par le contrôleur. Cette distinction
change la résolution logicielle par un facteur pouvant aller jusqu'à quatre.

## 4. Inertie équivalente ramenée aux moteurs

Pour un robot de masse $M = 8\text{ kg}$ équipé de deux roues de rayon
$R = 0,0381\text{ m}$ :

### 4.1 Translation

$$
J_{trans} = M R^2
       = 8 \times 0,0381^2
       \approx 0,0116\text{ kg.m}^2
$$

Cette valeur représente l'inertie de translation équivalente ramenée à l'axe des roues.

Par roue motrice :

$$
J_{roue} = \frac{J_{trans}}{2}
         \approx 5,80 \times 10^{-3}\text{ kg.m}^2
$$

Ramenée à l'arbre moteur avant le réducteur :

$$
J_{ramenee} = \frac{J_{roue}}{r^2}
             = \frac{5,80 \times 10^{-3}}{13,7^2}
             \approx 3,09 \times 10^{-5}\text{ kg.m}^2
$$

### 4.2 Modèle simplifié

En ajoutant l'inertie estimée du rotor et des premiers étages du planétaire
($J_{rotor} \approx 1,5 \times 10^{-5}\text{ kg.m}^2$) :

$$
J_{eq} = J_{ramenee} + J_{rotor}
       \approx 4,59 \times 10^{-5}\text{ kg.m}^2
$$

Ce modèle ne comprend pas explicitement l'inertie des roues, les pertes du réducteur, la
rotation du robot ni les déformations du contact au sol. Il convient pour un premier ordre,
pas pour valider un correcteur final.

## 5. Modélisation pour l'asservissement

La constante de temps électrique estimée est :

$$
\tau_e = \frac{L_a}{R_a}
       \approx \frac{0,8\text{ mH}}{1,09\ \Omega}
       \approx 0,73\text{ ms}
$$

Elle est négligeable devant la constante mécanique estimée dans ce modèle.

La fonction de transfert simplifiée est :

$$
\frac{\Omega_{rotor}(s)}{U(s)}
= \frac{K_m}{1 + \tau_m s}
$$

avec :

$$
K_m \approx \frac{1}{K_e}
    \approx 53,2\ \text{rad/(s.V)}
$$

et :

$$
\tau_m = \frac{R_a J_{eq}}{K_t K_e}
       \approx 0,142\text{ s}
$$

Pour une vitesse linéaire cible $v$ et une accélération cible $a$, le feedforward de
tension estimé est :

$$
U(t) = \left(\frac{r}{R}K_e\right)v(t)
     + \left(\frac{M R R_a}{2rK_t\eta}\right)a(t)
     \approx 6,76v(t) + 1,06a(t)
$$

Les coefficients `6,76` et `1,06` sont des estimations de modèle. Ils doivent être
remplacés ou corrigés après identification sur le robot réel.

## 6. Simulation dynamique des déplacements

Hypothèses de simulation : accélération et décélération constantes à
$a = 3,5\text{ m/s}^2$, vitesse maximale $v_{max} = 2,0\text{ m/s}$.

### 6.1 Cas d'accélération maximale

Temps pour passer de `0` à `2,0 m/s` :

$$
t_{acc} = \frac{v}{a}
        = \frac{2,0}{3,5}
        \approx 0,57\text{ s}
$$

Distance parcourue pendant cette accélération :

$$
d_{acc} = \frac{v^2}{2a}
        = \frac{2,0^2}{2 \times 3,5}
        \approx 0,57\text{ m}
$$

Freinage d'urgence contrôlé à $5,0\text{ m/s}^2$ depuis `2,0 m/s` :

$$
d_{stop} = \frac{v^2}{2a}
        = \frac{2,0^2}{2 \times 5,0}
        = 0,40\text{ m}
$$

et $t_{stop} = v/a = 0,40\text{ s}$.

### 6.2 Distances types

| Distance | Profil idéal | Vitesse maximale | Temps idéal | Courant |
|---:|---|---:|---:|---|
| `0,30 m` | Triangulaire | `1,02 m/s` | `0,59 s` | À mesurer |
| `0,80 m` | Triangulaire | `1,67 m/s` | `0,96 s` | À mesurer |
| `1,50 m` | Trapézoïdal | `2,00 m/s` | `1,32 s` | À mesurer |
| `2,00 m` | Trapézoïdal | `2,00 m/s` | `1,57 s` | À mesurer |

Les temps et vitesses du tableau sont cohérents avec un profil idéal à accélération
constante. Les courants `4,2 A` et `1,1 A` de la version initiale ne sont pas démontrés
par les données disponibles : ils dépendent des pertes, du rendement réel, de la charge,
de l'adhérence et de la tension instantanée.

À `2,0 m/s`, une roue de `76,2 mm` tourne à environ `501 tr/min`, soit environ `6867
tr/min` sur l'arbre moteur. Cela dépasse le régime à vide à `12 V` (`445,26 tr/min` en
sortie), mais devient théoriquement possible à la tension nominale d'une LiPo 4S si les
pertes et la charge restent faibles. `2,0 m/s` reste donc une limite de simulation, pas une
performance acquise.

## 7. Vérifications avant décision

1. Conserver le tableau constructeur comme référence et obtenir la définition exacte de
       `CPR` dans la documentation de l'encodeur.
2. Mesurer la résolution effective en quadrature à l'arbre de sortie et le sens des voies
       A/B.
3. Mesurer la résistance, le courant à vide, le courant au blocage bref et la vitesse sous
   charge.
4. Mesurer le diamètre effectif de la roue sous charge et le rendement de la transmission.
5. Mesurer accélération, décélération, distance d'arrêt et courant sur le robot réel.
6. Vérifier que le moteur, le driver, les câbles et la batterie supportent les courants de
   démarrage des deux moteurs sans chute de tension excessive.

## 8. Avis synthétique

**Points solides :** les calculs de cinématique sont cohérents, la résistance estimée est
correcte, l'inertie de translation ramenée au rotor est correctement calculée et le modèle
sépare désormais les données constructeur, les hypothèses et les résultats.

**Points faibles :** l'inductance, l'inertie rotor et le rendement restent supposés ; la
définition exacte de `CPR` doit être confirmée pour éviter une erreur d'un facteur quatre
dans l'odométrie. Les courants de la simulation initiale étaient présentés avec une
précision excessive. La vitesse de `2,0 m/s` est ambitieuse pour ce moteur et doit être
validée expérimentalement.

**Conclusion de travail :** le moteur reste un candidat crédible pour la locomotion, mais
le choix ne doit pas être déclaré validé avant la fiche technique complète et un essai sur
banc.
