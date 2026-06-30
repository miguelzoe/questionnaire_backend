import { Router } from 'express';
import { createSubmission, getSubmission, listSubmissions, patchSubmissionExamensComplementaires, patchSubmissionResponses, } from '../controllers/submissionController.js';
const router = Router();
router.post('/', createSubmission);
router.get('/', listSubmissions);
router.get('/:id', getSubmission);
router.patch('/:id/examens-complementaires', patchSubmissionExamensComplementaires);
router.patch('/:id', patchSubmissionResponses);
export default router;
