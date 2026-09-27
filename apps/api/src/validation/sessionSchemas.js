import { z } from 'zod';

// Only fields supported by the existing setup flow are client-controlled.
// Document IDs have no implemented resource/ownership lookup yet.
export const createSessionSchema = z.object({
  targetRole: z.string().trim().min(1).max(200),
  interviewType: z.enum(['Technical', 'Behavioral', 'Project-Based', 'Mixed']),
  experienceLevel: z.enum(['Student', 'Entry Level', '1-3 Years', '3+ Years']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  techStack: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  interviewMode: z.enum(['Normal', 'Focused Practice', 'Adaptive Practice', 'Personalized']).default('Normal'),
  focusTopic: z.string().trim().max(200).optional(),
  questionCount: z.union([z.literal(3), z.literal(5), z.literal(10)]).default(3).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.interviewMode === 'Focused Practice' && !data.focusTopic) {
    ctx.addIssue({ code: 'custom', path: ['focusTopic'], message: 'Focus topic is required for Focused Practice' });
  }
});

export const answerSchema = z.object({
  questionId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid questionId'),
  answerText: z.string().trim().min(1, 'Answer text is required').max(20000),
}).strict();
