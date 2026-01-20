const fs = require('fs');
const path = require('path');

const { initPostgres, pgStoreSubmission, pgListSubmissions } = require('./storage_postgres');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NDJSON_PATH = path.join(DATA_DIR, 'submissions.ndjson');

let mode = 'file';

async function initStorage() {
  if (process.env.DATABASE_URL) {
    mode = 'postgres';
    await initPostgres();
    return;
  }

  // Mode fichier (fallback)
  mode = 'file';
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NDJSON_PATH)) fs.writeFileSync(NDJSON_PATH, '', 'utf8');
  console.log('ℹ️ STORAGE=file (DATABASE_URL non défini)');
}

async function storeSubmission({ id, payload, meta }) {
  const createdAt = new Date().toISOString();

  if (mode === 'postgres') {
    return pgStoreSubmission({ id, payload, meta });
  }

  const record = {
    id,
    createdAt,
    meta,
    payload
  };

  // Append une ligne JSON par soumission
  await fs.promises.appendFile(NDJSON_PATH, JSON.stringify(record) + '\n', 'utf8');
  return { id, createdAt };
}

async function listSubmissions({ limit, offset }) {
  if (mode === 'postgres') {
    return pgListSubmissions({ limit, offset });
  }

  // Mode fichier: lecture simple (OK en dev / petits volumes)
  if (!fs.existsSync(NDJSON_PATH)) return [];
  const raw = await fs.promises.readFile(NDJSON_PATH, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const parsed = lines.map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  // Tri récent -> ancien
  parsed.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return parsed.slice(offset, offset + limit);
}

module.exports = {
  initStorage,
  storeSubmission,
  listSubmissions
};
