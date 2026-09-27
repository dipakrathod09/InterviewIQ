import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const overallFeedbackSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  improvementPriorities: z.array(z.string()),
  nextSteps: z.array(z.string())
});

export const parseOverallFeedback = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return overallFeedbackSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI overall feedback:', error);
    throw new ApiError(500, 'AI generated invalid overall feedback data structure');
  }
};
