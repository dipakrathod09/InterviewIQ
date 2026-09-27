import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const evaluationOutputSchema = z.object({
  score: z.number().min(0).max(10),
  technicalAccuracy: z.number().min(0).max(10),
  completeness: z.number().min(0).max(10),
  communication: z.number().min(0).max(10),
  problemSolving: z.number().min(0).max(10),
  depth: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  improvementTips: z.array(z.string()),
  modelAnswer: z.string()
});

export const parseEvaluation = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return evaluationOutputSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI evaluation output:', error);
    throw new ApiError(500, 'AI generated invalid evaluation data structure');
  }
};
