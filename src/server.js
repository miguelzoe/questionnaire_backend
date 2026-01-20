/*
  Backend minimal pour recevoir les soumissions du questionnaire.
  - POST /api/submissions
  - GET  /api/submissions (optionnel, protégé par ADMIN_API_KEY si défini)
  - GET  /health

  Stockage:
  - Si DATABASE_URL est défini => PostgreSQL (recommandé sur Render)
  - Sinon => fichier local data/submissions.ndjson (utile en local)
*/

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const { storeSubmission, listSubmissions, initStorage } = require('./storage');

const app = express();
app.set('trust proxy', 1); // important sur Render (reverse proxy)

const PORT = process.env.PORT || 5000;

// ---- CORS (simple et configurable) ----
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Autorise les appels sans origin (curl, server-to-server)
    if (!origin) return cb(null, true);

    // Si aucune liste n'est fournie, on autorise tout (mode ultra simple)
    if (allowedOrigins.length === 0) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin non autorisée'));
  }
}));

// JSON assez large (vos réponses peuvent être volumineuses)
app.use(express.json({ limit: '5mb' }));

// ---- Health check ----
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'questionnaire-backend', time: new Date().toISOString() });
});

// ---- Endpoint attendu par votre front ----
// Dans QuestionnairePatient.tsx, l'envoi se fait vers:
//   fetch('http://localhost:5000/api/submissions', { method:'POST', body: JSON.stringify(payload) })
// payload = { patientAge, selectedPathologies, responses }
app.post('/api/submissions', async (req, res) => {
  try {
    const payload = req.body;

    // validation minimale (sans compliquer)
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Payload JSON invalide.' });
    }

    const id = crypto.randomUUID();

    const meta = {
      ip: (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim(),
      userAgent: req.headers['user-agent'] || ''
    };

    const saved = await storeSubmission({ id, payload, meta });
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /api/submissions error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement.' });
  }
});

// ---- Liste (optionnel) ----
// Si ADMIN_API_KEY est défini, il faut envoyer le header: x-api-key: <clé>
app.get('/api/submissions', async (req, res) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
      const provided = req.headers['x-api-key'];
      if (!provided || provided !== adminKey) {
        return res.status(401).json({ error: 'Non autorisé.' });
      }
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const items = await listSubmissions({ limit, offset });
    return res.json({ limit, offset, count: items.length, items });
  } catch (err) {
    console.error('GET /api/submissions error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la lecture.' });
  }
});

// ---- Démarrage ----
(async () => {
  try {
    await initStorage();
    app.listen(PORT, () => {
      console.log(`✅ Server ready on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err);
    process.exit(1);
  }
})();
