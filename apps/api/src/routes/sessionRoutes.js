import express from 'express';
import { createSessionSchema, answerSchema } from '../validation/sessionSchemas.js';
import { createSession, getSessions, getSession, generateQuestions, submitAnswer, completeSession } from '../controllers/sessionController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All session routes must be protected
router.use(authenticate);

router.post('/', validate(createSessionSchema), createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/:id/generate', aiLimiter, generateQuestions);
router.post('/:id/answer', aiLimiter, validate(answerSchema), submitAnswer);
router.patch('/:id/complete', aiLimiter, completeSession);

export default router;
