# Questionnaire Backend (Node.js) - Deploy Render

Backend minimal pour recevoir les réponses du formulaire via HTTP.

## Endpoints

- `GET /health` → health check
- `POST /api/submissions` → enregistre une soumission
- `GET /api/submissions?limit=50&offset=0` → liste (optionnel, protégé si `ADMIN_API_KEY` est défini)

## Format attendu (depuis votre front)

Dans votre composant React, vous envoyez:

```js
const payload = {
  patientAge,
  selectedPathologies,
  responses,
};

await fetch('http://localhost:5000/api/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

Le backend accepte ce JSON tel quel et le stocke.

## Stockage

- **Recommandé (Render)**: PostgreSQL via `DATABASE_URL` (les réponses sont stockées en `JSONB`).
- **Fallback (local)**: si `DATABASE_URL` n'est pas défini, les soumissions sont ajoutées dans `data/submissions.ndjson`.

## Lancer en local

```bash
cd questionnaire-backend
cp .env.example .env
npm i
npm run dev
# serveur sur http://localhost:5000
```

Test rapide:

```bash
curl -X POST http://localhost:5000/api/submissions \
  -H 'Content-Type: application/json' \
  -d '{"patientAge": 25, "selectedPathologies": ["Asthme"], "responses": {"exemple": "ok"}}'
```

## Déployer sur Render (simple)

1. Poussez ce dossier sur GitHub.
2. Sur Render: **New → Web Service** → sélectionnez le repo.
3. Build command: `npm ci`
4. Start command: `npm start`
5. Ajoutez les variables d'environnement:
   - `DATABASE_URL` (depuis votre Postgres Render)
   - `ALLOWED_ORIGINS` (ex: `https://votre-frontend.onrender.com`)
   - `ADMIN_API_KEY` (optionnel)

## Côté Front

Sur Render, remplacez `http://localhost:5000` par l'URL de votre service backend:

```js
await fetch('https://<votre-backend>.onrender.com/api/submissions', { ... })
```
