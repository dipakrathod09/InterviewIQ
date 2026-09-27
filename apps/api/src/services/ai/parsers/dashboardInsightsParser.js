import { z } from 'zod';

const dashboardInsightsSchema = z.object({
  summary: z.string(),
  focusAreas: z.array(z.string()),
  recommendedNextStep: z.string(),
  reasoning: z.string()
});

export const parseDashboardInsights = (rawOutput) => {
  try {
    let cleanedOutput = rawOutput.trim();
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanedOutput);
    return dashboardInsightsSchema.parse(parsedJson);
  } catch (error) {
    console.error('Failed to parse AI dashboard insights:', error);
    // Do not throw ApiError here, as the prompt specifies we must fallback gracefully on the dashboard
    throw new Error('AI generated invalid insights structure');
  }
};
