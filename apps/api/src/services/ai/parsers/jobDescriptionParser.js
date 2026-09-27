import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const jobDescriptionSchema = z.object({
  role: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  experienceRequirements: z.string().default(''),
  keywords: z.array(z.string()).default([])
});

export const parseJobDescription = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return jobDescriptionSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI job description output:', error);
    throw new ApiError(500, 'AI generated invalid job description data structure');
  }
};
