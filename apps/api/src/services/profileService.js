import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { aiProvider } from './ai/aiProvider.js';
import { extractTextFromPdf, hasPdfSignature } from './resume/pdfExtractionService.js';


export const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const uploadResumePdf = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Layer 2: magic-byte validation (MIME header already checked by Multer)
  if (!hasPdfSignature(file.buffer)) {
    throw new ApiError(400, 'The uploaded file does not appear to be a valid PDF');
  }

  // Extract and normalise text (throws ApiError on failure)
  const rawText = await extractTextFromPdf(file.buffer);

  // Store extracted text + file metadata; clear stale AI analysis and match
  user.resume = {
    rawText,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    uploadedAt: new Date(),
    // Clear all previous AI analysis fields
    analyzedAt: undefined,
    summary: undefined,
    skills: undefined,
    strengths: undefined,
    weaknesses: undefined,
    missingInformation: undefined,
    improvementSuggestions: undefined,
  };
  user.matchAnalysis = undefined;

  await user.save();

  return {
    originalFileName: user.resume.originalFileName,
    fileSize: user.resume.fileSize,
    uploadedAt: user.resume.uploadedAt,
    textLength: rawText.length,
  };
};

export const updateResume = async (userId, rawText) => {

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Analyze first — if AI fails, we do NOT corrupt existing data
  const analyzed = await aiProvider.analyzeResume({ rawText });

  // Explicitly preserve rawText (the parser may not always include it)
  user.resume = {
    ...analyzed,
    rawText,
    analyzedAt: new Date(),
  };

  // Stale match is no longer valid — clear it
  user.matchAnalysis = undefined;

  await user.save();

  return user.resume;
};

export const updateJobDescription = async (userId, rawText) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Analyze first — if AI fails, we do NOT corrupt existing data
  const analyzed = await aiProvider.analyzeJobDescription({ rawText });

  user.jobDescription = {
    ...analyzed,
    rawText,
    analyzedAt: new Date(),
  };

  // Stale match is no longer valid — clear it
  user.matchAnalysis = undefined;

  await user.save();

  return user.jobDescription;
};

export const generateMatchAnalysis = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (!user.resume?.analyzedAt || !user.jobDescription?.analyzedAt) {
    throw new ApiError(400, 'Both Resume and Job Description must be analyzed first');
  }

  const context = {
    resume: user.resume,
    jobDescription: user.jobDescription
  };

  const matchAnalysis = await aiProvider.matchResumeToJob(context);
  matchAnalysis.analyzedAt = new Date();

  user.matchAnalysis = matchAnalysis;
  await user.save();

  return user.matchAnalysis;
};
