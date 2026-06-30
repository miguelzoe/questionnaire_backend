# Corrections API - Admin et examens complémentaires

## Backend Express / Prisma

- Renforcement de la récupération des formulaires remplis par l'admin via `GET /api/submissions` et `GET /api/submissions/:id`.
- Ajout du libellé d'âge `patientAgeLabel` dans les réponses admin, utile pour les enfants de 1 à 24 mois et les patients de 80 ans et plus.
- Ajout de la prise en compte facultative de `patientAgeMonths` et `patientAgeLabel` lors de l'enregistrement.
- Ajout d'une route sécurisée et ciblée pour les examens complémentaires :

```http
PATCH /api/submissions/:id/examens-complementaires
```

- La route dédiée ne conserve que les champs d'examens complémentaires : `exam_*`, EFR, VEMS, CVF, DEM25-75, réversibilité, obstruction, restriction, hyperinflation, atteinte périphérique, etc.
- Le `PATCH /api/submissions/:id` général reste disponible pour compatibilité.

## Fichiers modifiés

- `src/controllers/submissionController.ts`
- `src/routes/submissionRoutes.ts`
- `src/types/questionnaire.ts`
- `dist/controllers/submissionController.js`
- `dist/routes/submissionRoutes.js`
- `dist/types/questionnaire.js`
