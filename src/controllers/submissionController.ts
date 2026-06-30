import type { Request, Response } from 'express';
import * as dbService from '../services/databaseService.js';
import type { SubmissionPayload, SubmissionResponsesPatch } from '../types/questionnaire.js';

const formatBackendError = (error: any) => {
  const safeError: Record<string, unknown> = {
    name: error?.name,
    code: error?.code,
    message: error?.message,
    meta: error?.meta,
  };

  return Object.fromEntries(
    Object.entries(safeError).filter(([, value]) => value !== undefined && value !== null)
  );
};

const shouldShowErrorDetails = () => process.env.SHOW_ERROR_DETAILS === 'true';


const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const extractPatientCode = (record: Record<string, unknown>) => {
  const code = record.codePatient;
  return typeof code === 'string' && code.trim() ? code.trim() : null;
};

const extractPatientAgeLabel = (record: Record<string, unknown>, patientAge: number) => {
  const label = record.ageLabel;
  if (typeof label === 'string' && label.trim()) return label.trim();
  const months = Number(record.ageMonths);
  const unit = record.ageUnit;
  if (unit === 'months' && Number.isFinite(months) && months > 0) return `${months} mois`;
  if (record.age80Plus === true || record.age80Plus === 'true') return '80 ans et plus';
  return `${patientAge} ans`;
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
};

const normalizePayload = (body: unknown): SubmissionPayload | null => {
  if (!isPlainObject(body)) {
    return null;
  }

  const patientAge = toFiniteNumber(body.patientAge);
  const patientAgeMonths = toFiniteNumber(body.patientAgeMonths);
  const patientAgeLabel = typeof body.patientAgeLabel === 'string' ? body.patientAgeLabel.trim() : null;

  const selectedPathologies = Array.isArray(body.selectedPathologies)
    ? body.selectedPathologies.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  const responses = isPlainObject(body.responses) ? { ...body.responses } : null;
  const patientName = typeof body.patientName === 'string' ? body.patientName : undefined;

  if (!Number.isFinite(patientAge) || patientAge < 0 || !responses) {
    return null;
  }

  if (Number.isFinite(patientAgeMonths) && patientAgeMonths >= 0) {
    responses.ageMonths = Math.round(patientAgeMonths);
  }
  if (patientAgeLabel) {
    responses.ageLabel = patientAgeLabel;
  }

  return {
    patientAge: Math.round(patientAge),
    patientAgeMonths: Number.isFinite(patientAgeMonths) ? Math.round(patientAgeMonths) : null,
    patientAgeLabel,
    selectedPathologies,
    responses,
    patientName,
  };
};

const normalizePatch = (body: unknown): SubmissionResponsesPatch | null => {
  if (!isPlainObject(body)) {
    return null;
  }

  if (isPlainObject(body.responses)) {
    return body.responses;
  }

  return body;
};

const examKeyPattern = /^(exam_|asthme_efr_|efr_|vems_percent|cvf_percent|ratio_vems_cvf|dem2575|dem2575_percent|variation_vems|variation_dem2575|cpt_percent|vr_percent|variation_ax|tvo_spiro|type_obstruction|reversibilite_vems|restriction|hyperinflation|atteinte_peripherique|reversibilite_oscillo|atteinte_distale|profil_fonctionnel_global)/;

const normalizeExamPatch = (body: unknown): SubmissionResponsesPatch | null => {
  const patch = normalizePatch(body);
  if (!patch) return null;

  const filtered: SubmissionResponsesPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (examKeyPattern.test(key)) {
      filtered[key] = value;
    }
  }

  return Object.keys(filtered).length ? filtered : null;
};

const mapSubmissionForList = (item: Awaited<ReturnType<typeof dbService.getAllSubmissions>>[number]) => {
  const responses = isPlainObject(item.responses) ? item.responses : {};
  return {
    ...item,
    patientCode: extractPatientCode(responses),
    patientAgeLabel: extractPatientAgeLabel(responses, item.patientAge),
    responses,
  };
};

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const payload = normalizePayload(req.body);

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Données du formulaire manquantes ou invalides.',
      });
    }

    const result = await dbService.saveSubmission(payload);

    return res.status(201).json({
      success: true,
      message: 'Questionnaire enregistré avec succès',
      id: result.id,
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({
      success: false,
      error: 'Une erreur interne est survenue lors de la sauvegarde.',
      details: shouldShowErrorDetails() ? formatBackendError(error) : undefined,
    });
  }
};

export const listSubmissions = async (req: Request, res: Response) => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;
    const items = await dbService.getAllSubmissions(limit);

    return res.status(200).json({
      success: true,
      count: items.length,
      items: items.map(mapSubmissionForList),
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({
      success: false,
      error: 'Impossible de récupérer les questionnaires.',
      details: shouldShowErrorDetails() ? formatBackendError(error) : undefined,
    });
  }
};

export const getSubmission = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide.' });
    }

    const item = await dbService.getSubmissionById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Questionnaire introuvable.' });
    }

    return res.status(200).json({
      success: true,
      item: mapSubmissionForList(item),
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({
      success: false,
      error: 'Impossible de récupérer ce questionnaire.',
      details: shouldShowErrorDetails() ? formatBackendError(error) : undefined,
    });
  }
};

export const patchSubmissionResponses = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide.' });
    }

    const patch = normalizePatch(req.body);
    if (!patch) {
      return res.status(400).json({ success: false, error: 'Corps de mise à jour invalide.' });
    }

    const item = await dbService.updateSubmissionResponses(id, patch);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Questionnaire introuvable.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Questionnaire mis à jour avec succès.',
      item: mapSubmissionForList(item),
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({
      success: false,
      error: 'Impossible de mettre à jour ce questionnaire.',
      details: shouldShowErrorDetails() ? formatBackendError(error) : undefined,
    });
  }
};

export const patchSubmissionExamensComplementaires = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide.' });
    }

    const patch = normalizeExamPatch(req.body);
    if (!patch) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée valide d’examens complémentaires à mettre à jour.',
      });
    }

    const item = await dbService.updateSubmissionResponses(id, patch);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Questionnaire introuvable.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Examens complémentaires mis à jour avec succès.',
      item: mapSubmissionForList(item),
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({
      success: false,
      error: 'Impossible de mettre à jour les examens complémentaires.',
      details: shouldShowErrorDetails() ? formatBackendError(error) : undefined,
    });
  }
};
