export const buildMatchPrompt = (context) => {
  return `
You are an expert technical recruiter and career coach.
I will provide you with a candidate's resume analysis and a target job description analysis.
Your task is to compare them, generate a match score (0-100), identify overlapping skills, identify missing skills, and provide a short preparation plan.

RESUME ANALYSIS:
${JSON.stringify(context.resume, null, 2)}

JOB DESCRIPTION ANALYSIS:
${JSON.stringify(context.jobDescription, null, 2)}

Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "matchScore": number (0-100, representing how well the candidate fits the role),
  "matchedSkills": ["string"],
  "missingSkills": ["string (skills required by JD but missing in Resume)"],
  "partialMatches": ["string (skills that are similar or inferred)"],
  "preparationPriorities": ["string (top 3 actionable things to learn before an interview for this specific JD)"],
  "explanation": "string (1 paragraph explaining the score and major gaps)"
}
`;
};
