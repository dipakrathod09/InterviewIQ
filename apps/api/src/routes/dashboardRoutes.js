import express from 'express';
import { getStats, getInsights } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/insights', aiLimiter, getInsights);

export default router;
