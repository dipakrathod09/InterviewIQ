import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const resumeSchema = z.object({
  summary: z.string(),
  skills: z.object({
    technical: z.array(z.string()).default([]),
    programmingLanguages: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    databases: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([])
  }),
  education: z.array(z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    duration: z.string().optional()
  })).default([]),
  experience: z.array(z.object({
    title: z.string().optional(),
    organization: z.string().optional(),
    duration: z.string().optional(),
    highlights: z.array(z.string()).default([])
  })).default([]),
  projects: z.array(z.object({
    name: z.string().optional(),
    technologies: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([])
  })).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  improvementSuggestions: z.array(z.string()).default([])
});

export const parseResume = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return resumeSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI resume output:', error);
    throw new ApiError(500, 'AI generated invalid resume data structure');
  }
};
