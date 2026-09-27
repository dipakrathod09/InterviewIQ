export const buildOverallFeedbackPrompt = (sessionContext) => {
  const {
    targetRole,
    experienceLevel,
    techStack,
    questions
  } = sessionContext;

  const stackString = techStack && techStack.length > 0 ? techStack.join(', ') : 'General';

  // Summarize questions and scores for the AI
  const qaSummary = questions.map((q, idx) => {
    return `
Question ${idx + 1}: ${q.questionText}
Topic: ${q.topic}
Score: ${q.evaluation?.score || 0}/10
Strengths: ${q.evaluation?.strengths?.join(', ') || 'None'}
Weaknesses: ${q.evaluation?.gaps?.join(', ') || 'None'}
    `;
  }).join('\\n');

  return `
You are an elite technical interviewer and strict career coach. You just finished interviewing a candidate for a ${experienceLevel} ${targetRole} position.
The candidate's tech stack is: ${stackString}. Be direct, constructive, and actionable. Do not use generic chatbot pleasantries.

Here is the summary of the candidate's performance across the questions:
${qaSummary}

Evaluate the candidate's overall performance. Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "summary": "string (1-2 paragraphs summarizing overall performance)",
  "strengths": [array of strings (max 5)],
  "weaknesses": [array of strings (max 5)],
  "missingConcepts": [array of strings (max 5)],
  "improvementPriorities": [array of strings (max 3 most important areas to focus on)],
  "nextSteps": [array of strings (actionable steps for their next study session)]
}
`;
};
