# Correction API admin questionnaires

Endpoints à tester après déploiement Render :

1. `GET /health`
2. `GET /api/debug/db`
3. `GET /api/submissions`
4. `PATCH /api/submissions/:id/examens-complementaires`

Variables Render obligatoires :

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
PORT=5000
SHOW_ERROR_DETAILS=true
```

Commande de build Render recommandée :

```bash
npm install && npm run build
```

Commande de start Render recommandée :

```bash
npm start
```

Le script `prestart` exécute automatiquement `prisma migrate deploy` avant `node dist/server.js`.
