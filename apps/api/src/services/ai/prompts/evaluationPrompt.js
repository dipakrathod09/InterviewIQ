export const buildEvaluationPrompt = (context) => {
  const {
    targetRole,
    experienceLevel,
    techStack,
    questionText,
    userAnswer
  } = context;

  const stackString = techStack && techStack.length > 0 ? techStack.join(', ') : 'General';

  return `
You are an expert technical interviewer and a strict, professional career coach evaluating a candidate for a ${experienceLevel} ${targetRole} position.
The candidate's tech stack is: ${stackString}. Maintain a highly professional, objective, and constructive tone. Do not use generic chatbot pleasantries.

You asked the following interview question:
"${questionText}"

The candidate provided the following answer:
"${userAnswer}"

Evaluate this answer strictly and objectively. Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "score": number (0-10, overall quality),
  "technicalAccuracy": number (0-10),
  "completeness": number (0-10),
  "communication": number (0-10),
  "problemSolving": number (0-10),
  "depth": number (0-10),
  "strengths": [array of strings (max 3)],
  "gaps": [array of strings (max 3, technical mistakes or poorly explained parts)],
  "missingConcepts": [array of strings (max 3, important concepts they failed to mention)],
  "improvementTips": [array of strings (max 3, actionable advice)],
  "modelAnswer": "string (A concise, ideal answer to the question for this seniority level)"
}
`;
};
