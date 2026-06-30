import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import submissionRoutes from './routes/submissionRoutes.js';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/submissions', submissionRoutes);

// Alias utiles si l’interface admin appelle une ancienne URL.
app.use('/api/admin/submissions', submissionRoutes);
app.use('/api/questionnaires', submissionRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serveur opérationnel ✅',
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  });
});

/**
 * Diagnostic Render/PostgreSQL/Prisma.
 * À tester avant /api/submissions si l’admin affiche
 * « Impossible de récupérer les questionnaires ».
 */
app.get('/api/debug/db', async (_req, res) => {
  try {
    await prisma.$connect();

    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );

    let submissionsCount: number | null = null;
    let patientSubmissionError: unknown = null;

    try {
      submissionsCount = await prisma.patientSubmission.count();
    } catch (error: any) {
      patientSubmissionError = {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        meta: error?.meta,
      };
    }

    return res.status(200).json({
      success: true,
      database: 'connected',
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      tables: tables.map((table) => table.table_name),
      patientSubmissionTableFound: tables.some((table) => table.table_name === 'PatientSubmission'),
      submissionsCount,
      patientSubmissionError,
    });
  } catch (error: any) {
    console.error('Erreur diagnostic DB:', error);
    return res.status(500).json({
      success: false,
      database: 'disconnected',
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      name: error?.name,
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    });
  }
});

export default app;
