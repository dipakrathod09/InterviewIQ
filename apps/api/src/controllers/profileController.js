import { asyncHandler } from '../utils/asyncHandler.js';
import * as profileService from '../services/profileService.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user._id);
  res.status(200).json(profile);
});

export const uploadResumePdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'No file uploaded. Field name must be "resume".' });
  }
  const result = await profileService.uploadResumePdf(req.user._id, req.file);
  res.status(200).json(result);
});

export const submitResume = asyncHandler(async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ message: 'rawText is required' });
  const result = await profileService.updateResume(req.user._id, rawText);
  res.status(200).json(result);
});

export const submitJobDescription = asyncHandler(async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) return res.status(400).json({ message: 'rawText is required' });
  const result = await profileService.updateJobDescription(req.user._id, rawText);
  res.status(200).json(result);
});

export const getMatchAnalysis = asyncHandler(async (req, res) => {
  const result = await profileService.generateMatchAnalysis(req.user._id);
  res.status(200).json(result);
});
