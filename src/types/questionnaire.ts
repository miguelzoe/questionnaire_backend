export interface SubmissionPayload {
  patientAge: number;
  selectedPathologies: string[];
  responses: Record<string, unknown>;
  patientName?: string | null;
  patientAgeMonths?: number | null;
  patientAgeLabel?: string | null;
}

export interface SubmissionListQuery {
  limit?: number;
}

export interface SubmissionResponsesPatch {
  [key: string]: unknown;
}
