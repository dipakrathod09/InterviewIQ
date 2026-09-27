export const buildResumePrompt = (rawText) => {
  return `
You are an expert technical recruiter and resume reviewer.
Analyze the following resume text and extract the key information.

CRITICAL CONSTRAINT: Only extract information that is explicitly present in the resume text below.
Do NOT invent, assume, or hallucinate any employers, education, skills, projects, or certifications
that are not mentioned. If a field has no supporting evidence, return an empty array or omit it.
Clearly distinguish between observed facts (present in the resume) and recommendations
(your suggestions for improvement).

RESUME TEXT:
"${rawText}"

Identify the candidate's skills, strengths, weaknesses, and areas for improvement.
Return exactly one JSON object. Do not include markdown fences, prose, or explanation outside the JSON.

Expected JSON schema:
{
  "summary": "string (Short 1-paragraph summary of the candidate's profile)",
  "skills": {
    "technical": ["string"],
    "programmingLanguages": ["string"],
    "frameworks": ["string"],
    "databases": ["string"],
    "tools": ["string"],
    "softSkills": ["string"]
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "duration": "string"
    }
  ],
  "experience": [
    {
      "title": "string",
      "organization": "string",
      "duration": "string",
      "highlights": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "technologies": ["string"],
      "highlights": ["string"]
    }
  ],
  "strengths": ["string (max 3)"],
  "weaknesses": ["string (max 3, e.g., 'Lack of quantified metrics')"],
  "missingInformation": ["string (max 3, e.g., 'Missing GitHub link')"],
  "improvementSuggestions": ["string (max 3 actionable tips to improve the resume)"]
}
`;
};
