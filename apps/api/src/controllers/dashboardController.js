import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboardService.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user._id);
  res.status(200).json(stats);
});

export const getInsights = asyncHandler(async (req, res) => {
  const insights = await dashboardService.getInsights(req.user._id);
  res.status(200).json(insights);
});
