# Logiciel — PAMI

Firmware des sept PAMI. Le départ reçu du serveur est une date, jamais un ordre direct ;
trois niveaux de repli selon la disponibilité du serveur et du réseau (CDC logiciel,
section 14.2 et 14.3). Transport UDP unicast, numéro de séquence, chaque message envoyé
trois fois espacé de vingt millisecondes (section 14.4).

Au niveau de repli 3 (jamais connecté), le firmware lit le sélecteur de couleur et le
sélecteur de numéro plutôt que les valeurs reçues du serveur (section 14.3). En
fonctionnement nominal, ces sélecteurs ne sont pas lus ; ils doivent l'être quand même,
testés, pas seulement câblés.
