import { PrismaClient } from '@prisma/client';
let prisma = null;
const getPrismaClient = () => {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
};
const asRecord = (value) => {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};
const extractPatientName = (data) => {
    const topLevelName = typeof data.patientName === 'string' ? data.patientName.trim() : '';
    const responseName = typeof data.responses?.nom === 'string' ? String(data.responses.nom).trim() : '';
    return topLevelName || responseName || 'Anonyme';
};
const mergeResponses = (current, patch) => {
    const currentRecord = asRecord(current);
    return {
        ...currentRecord,
        ...patch,
    };
};
export const saveSubmission = async (data) => {
    return getPrismaClient().patientSubmission.create({
        data: {
            patientAge: data.patientAge,
            patientName: extractPatientName(data),
            selectedPathologies: data.selectedPathologies,
            responses: data.responses,
        },
    });
};
export const getAllSubmissions = async (limit = 100) => {
    return getPrismaClient().patientSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};
export const getSubmissionById = async (id) => {
    return getPrismaClient().patientSubmission.findUnique({
        where: { id },
    });
};
export const updateSubmissionResponses = async (id, patch) => {
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
