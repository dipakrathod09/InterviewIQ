export const buildJobDescriptionPrompt = (rawText) => {
  return `
You are an expert technical recruiter. Analyze the following job description text and extract the key information.

JOB DESCRIPTION TEXT:
"${rawText}"

Identify the role, required skills, preferred skills, responsibilities, and experience requirements.
Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "role": "string (The job title, e.g., 'Senior Frontend Engineer')",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "responsibilities": ["string (max 5 key responsibilities)"],
  "experienceRequirements": "string (e.g., '3+ years' or 'Bachelor\\'s degree')",
  "keywords": ["string (max 10 relevant keywords for ATS matching)"]
}
`;
};
