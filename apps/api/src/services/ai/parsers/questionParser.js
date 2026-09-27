import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

const questionOutputSchema = z.array(
  z.object({
    questionText: z.string().min(5),
    topic: z.string(),
    difficulty: z.string()
  })
).min(1).max(10); // usually we ask for 3-5

export const parseQuestions = (rawOutput, requestedCount = 3) => {
  try {
    // Attempt to strip markdown fences if the AI erroneously included them
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    
    // Validate schema
    const validatedData = questionOutputSchema.parse(parsedJson);
    
    if (validatedData.length !== requestedCount) {
      throw new Error(`Expected exactly ${requestedCount} questions, but received ${validatedData.length}.`);
    }

    return validatedData;
  } catch (error) {
    console.error('Failed to parse AI question output:', error);
    throw new ApiError(500, 'AI generated invalid question data structure');
  }
};
