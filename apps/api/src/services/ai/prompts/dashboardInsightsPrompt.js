export const buildDashboardInsightsPrompt = (statsContext) => {
  return `
You are an AI career and interview coach. Based on the candidate's historical interview performance data, provide actionable insights.

Candidate Data:
Total Completed Interviews: ${statsContext.completedInterviews}
Average Score: ${statsContext.averageScore}/10
Weakest Topics: ${JSON.stringify(statsContext.weakTopics)}
Strongest Topics: ${JSON.stringify(statsContext.strongTopics)}

Evaluate their progress and give them a short coaching summary. Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "summary": "string (Short encouraging summary of their overall progress)",
  "focusAreas": [array of strings (max 3 areas they should focus on based on weak topics)],
  "recommendedNextStep": "string (A single clear actionable next step, e.g. 'Start a Focused Practice on React')",
  "reasoning": "string (Why you recommended this next step)"
}
`;
};
