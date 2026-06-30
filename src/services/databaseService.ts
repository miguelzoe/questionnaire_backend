import { PrismaClient, Prisma } from '@prisma/client';
import type { SubmissionPayload, SubmissionResponsesPatch } from '../types/questionnaire.js';

let prisma: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
};

const extractPatientName = (data: SubmissionPayload): string => {
  const topLevelName = typeof data.patientName === 'string' ? data.patientName.trim() : '';
  const responseName = typeof data.responses?.nom === 'string' ? String(data.responses.nom).trim() : '';

  return topLevelName || responseName || 'Anonyme';
};

const mergeResponses = (
  current: Prisma.JsonValue | null,
  patch: SubmissionResponsesPatch,
): Prisma.InputJsonValue => {
  const currentRecord = asRecord(current);
  return {
    ...currentRecord,
    ...patch,
  } as Prisma.InputJsonValue;
};

export const saveSubmission = async (data: SubmissionPayload) => {
  return getPrismaClient().patientSubmission.create({
    data: {
      patientAge: data.patientAge,
      patientName: extractPatientName(data),
      selectedPathologies: data.selectedPathologies,
      responses: data.responses as Prisma.InputJsonValue,
    },
  });
};

export const getAllSubmissions = async (limit = 100) => {
  return getPrismaClient().patientSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const getSubmissionById = async (id: number) => {
  return getPrismaClient().patientSubmission.findUnique({
    where: { id },
  });
};

export const updateSubmissionResponses = async (id: number, patch: SubmissionResponsesPatch) => {
  const existing = await getSubmissionById(id);
  if (!existing) {
    return null;
  }

  const mergedResponses = mergeResponses(existing.responses, patch);
  const patchName = typeof patch.nom === 'string' ? patch.nom.trim() : '';

  return getPrismaClient().patientSubmission.update({
    where: { id },
    data: {
      patientName: patchName || existing.patientName,
      responses: mergedResponses,
    },
  });
};
