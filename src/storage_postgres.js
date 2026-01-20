const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const isProd = process.env.NODE_ENV === 'production';

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Sur Render, SSL est souvent requis pour les connexions externes.
      // On active SSL en production par défaut.
      ssl: isProd ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function initPostgres() {
  const p = getPool();

  // Table simple: payload en JSONB
  await p.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip TEXT,
      user_agent TEXT,
      payload JSONB NOT NULL
    );
  `);

  await p.query(`CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at DESC);`);
  console.log('✅ STORAGE=postgres');
}

async function pgStoreSubmission({ id, payload, meta }) {
  const p = getPool();
  const ip = meta?.ip || null;
  const userAgent = meta?.userAgent || null;

  const result = await p.query(
    `INSERT INTO submissions (id, ip, user_agent, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at;`,
    [id, ip, userAgent, payload]
  );

  const row = result.rows[0];
  return { id: row.id, createdAt: row.created_at };
}

async function pgListSubmissions({ limit, offset }) {
  const p = getPool();
  const result = await p.query(
    `SELECT id, created_at, ip, user_agent, payload
     FROM submissions
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  return result.rows.map(r => ({
    id: r.id,
    createdAt: r.created_at,
    meta: { ip: r.ip, userAgent: r.user_agent },
    payload: r.payload
  }));
}

module.exports = {
  initPostgres,
  pgStoreSubmission,
  pgListSubmissions
};
