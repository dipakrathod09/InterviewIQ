import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const matchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  partialMatches: z.array(z.string()).default([]),
  preparationPriorities: z.array(z.string()).default([]),
  explanation: z.string()
});

export const parseMatch = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return matchSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI match output:', error);
    throw new ApiError(500, 'AI generated invalid match data structure');
  }
};
