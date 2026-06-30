# Correctifs intégrés — Backend questionnaire allergies

## Principales mises à jour
- Recréation de la base source TypeScript (`src/`) à partir du backend compilé.
- Ajout d'un `tsconfig.json` propre.
- Validation plus robuste du payload entrant.
- Nom du patient facultatif avec fallback automatique sur `responses.nom` puis `Anonyme`.
- Conservation du modèle existant sans casser la structure : les réponses détaillées restent stockées en JSON.
- Ajout d'une route `GET /api/submissions` pour consultation simple.
- Healthcheck JSON sur `GET /health`.
- Initialisation Prisma rendue paresseuse pour éviter un crash au démarrage si la base ou le moteur Prisma n'est pas prêt.
- `schema.prisma` mis à jour pour préparer une génération multi-environnement.

## Point d'attention
- Le conteneur hors ligne n'a pas pu télécharger les binaires Prisma supplémentaires. Après décompression sur la machine cible, exécuter `npx prisma generate` une fois pour régénérer le client avec le bon moteur.
