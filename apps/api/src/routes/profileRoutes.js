import express from 'express';
import { getProfile, submitResume, submitJobDescription, getMatchAnalysis, uploadResumePdf } from '../controllers/profileController.js';
import { authenticate } from '../middleware/authenticate.js';
import { resumeUpload, handleUploadError } from '../middleware/resumeUpload.js';

import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);

// PDF upload — multipart/form-data, field name: resume
router.post('/resume/upload', resumeUpload.single('resume'), handleUploadError, uploadResumePdf);

// Text-based resume analysis (keeps existing paste-text path)
router.post('/resume', aiLimiter, submitResume);
router.post('/job-description', aiLimiter, submitJobDescription);
router.get('/match', aiLimiter, getMatchAnalysis);

export default router;
