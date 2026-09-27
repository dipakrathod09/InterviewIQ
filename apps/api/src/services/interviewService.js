import { InterviewSession } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { aiProvider } from './ai/aiProvider.js';
import * as dashboardService from './dashboardService.js';
import { createSessionSchema, answerSchema } from '../validation/sessionSchemas.js';
import { assertObjectId } from '../utils/objectId.js';

export const createSession = async (userId, sessionData) => {
  const allowedFields = createSessionSchema.parse(sessionData);
  const session = await InterviewSession.create({
    ...allowedFields,
    userId,
    status: 'created',
  });

  return session;
};

export const getUserSessions = async (userId) => {
  // Sort by creation date descending
  return await InterviewSession.find({ userId }).sort({ createdAt: -1 });
};

export const getSessionById = async (sessionId, userId) => {
  assertObjectId(sessionId, 'sessionId');
  const session = await InterviewSession.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new ApiError(404, 'Session not found or you do not have permission to access it');
  }

  return session;
};

export const updateSessionStatus = async (sessionId, userId, status) => {
  assertObjectId(sessionId, 'sessionId');
  const session = await InterviewSession.findOneAndUpdate(
    { _id: sessionId, userId },
    { status },
    { new: true }
  );

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  return session;
};

export const generateQuestionsForSession = async (sessionId, userId) => {
  const session = await getSessionById(sessionId, userId);

  if (session.status !== 'created') {
    throw new ApiError(400, 'Questions have already been generated for this session');
  }

  const sessionObject = session.toObject();
  
  // Globally fetch user to attach profile context if available
  const user = await User.findById(userId);
  if (user?.resume?.analyzedAt) {
    sessionObject.resumeContext = user.resume;
  }
  if (user?.jobDescription?.analyzedAt) {
    sessionObject.jobDescriptionContext = user.jobDescription;
  }

  if (session.interviewMode === 'Personalized') {
    if (!user?.resume?.analyzedAt) {
      throw new ApiError(400, 'Analyze your resume before starting a personalized interview.');
    }
    if (!user?.jobDescription?.analyzedAt) {
      throw new ApiError(400, 'Add and analyze a job description first.');
    }
    if (!user?.matchAnalysis?.analyzedAt) {
      throw new ApiError(400, 'Run Resume ↔ JD Match before starting a personalized interview.');
    }

    const stats = await dashboardService.getStats(userId);
    const performance = stats.overview.totalInterviews > 0 ? {
      weakTopics: stats.weakTopics,
      recentScores: stats.recentScores,
      interviewTypePerformance: stats.interviewTypePerformance,
      difficultyPerformance: stats.difficultyPerformance,
      sourceSessionCount: stats.overview.totalInterviews
    } : { sourceSessionCount: 0 };

    sessionObject.personalizedContext = {
      resume: {
        summary: user.resume.summary,
        skills: user.resume.skills,
        strengths: user.resume.strengths,
        projects: user.resume.projects
      },
      jobDescription: {
        role: user.jobDescription.role,
        requiredSkills: user.jobDescription.requiredSkills,
        preferredSkills: user.jobDescription.preferredSkills,
        responsibilities: user.jobDescription.responsibilities,
        keywords: user.jobDescription.keywords
      },
      match: {
        matchScore: user.matchAnalysis.matchScore,
        matchedSkills: user.matchAnalysis.matchedSkills,
        missingSkills: user.matchAnalysis.missingSkills,
        partialMatches: user.matchAnalysis.partialMatches,
        preparationPriorities: user.matchAnalysis.preparationPriorities
      },
      performance
    };
    
    // Save lightweight snapshot on InterviewSession to explain what context was used
    session.personalizedContext = {
      resumeAnalyzedAt: user.resume.analyzedAt,
      jobDescriptionAnalyzedAt: user.jobDescription.analyzedAt,
      matchAnalyzedAt: user.matchAnalysis.analyzedAt,
      weakTopics: performance.weakTopics || [],
      preparationPriorities: user.matchAnalysis.preparationPriorities,
      missingSkills: user.matchAnalysis.missingSkills,
      sourceSessionCount: performance.sourceSessionCount
    };
  }

  if (session.interviewMode === 'Adaptive Practice') {
    const stats = await dashboardService.getStats(userId);
    if (stats.overview.totalInterviews === 0 || stats.topicAverages.length === 0) {
      throw new ApiError(400, 'Not enough historical data for Adaptive Practice. Please complete at least one interview first.');
    }
    
    // Sort ascending by average score to find weaknesses
    const weakTopics = [...stats.topicAverages].sort((a, b) => a.average - b.average).slice(0, 3).map(t => t.topic);
    sessionObject.adaptiveContext = weakTopics;
  }

  // Pass the enriched session doc as context to the AI provider
  const questions = await aiProvider.generateQuestions(sessionObject);

  session.questions = questions;
  session.status = 'in_progress';
  
  await session.save();

  return session;
};

export const evaluateAnswerForSession = async (sessionId, userId, questionId, userAnswer) => {
  const answer = answerSchema.parse({ questionId, answerText: userAnswer });
  userAnswer = answer.answerText;
  const session = await getSessionById(sessionId, userId);

  if (session.status !== 'in_progress') {
    throw new ApiError(400, 'Session is not in progress');
  }

  const question = session.questions.id(questionId);
  if (!question) {
    throw new ApiError(404, 'Question not found in session');
  }

  // Prevent overwriting an already-evaluated answer
  if (question.userAnswer && question.evaluation?.score !== undefined) {
    throw new ApiError(409, 'This question has already been answered and evaluated');
  }

  const evaluationContext = {
    targetRole: session.targetRole,
    experienceLevel: session.experienceLevel,
    techStack: session.techStack,
    questionText: question.questionText,
    userAnswer
  };

  // Evaluate BEFORE touching session state so a failed AI call leaves no corruption
  const evaluation = await aiProvider.evaluateAnswer(evaluationContext);

  question.userAnswer = userAnswer;
  question.evaluation = evaluation;

  await session.save();

  return { question };
};

export const completeSession = async (sessionId, userId) => {
  const session = await getSessionById(sessionId, userId);

  if (session.status === 'completed') {
    return session;
  }

  if (session.status !== 'in_progress') {
    throw new ApiError(400, 'Session cannot be completed');
  }

  // Every question must have a non-blank answer AND a valid evaluation with a numeric score
  const invalidQuestions = session.questions.filter(q => {
    const hasAnswer = typeof q.userAnswer === 'string' && q.userAnswer.trim().length > 0;
    const hasEvaluation = q.evaluation && typeof q.evaluation.score === 'number';
    return !hasAnswer || !hasEvaluation;
  });

  if (invalidQuestions.length > 0) {
    throw new ApiError(400, `Cannot complete session. ${invalidQuestions.length} question(s) are missing a valid answer or evaluation.`);
  }

  // Calculate overall score
  const totalScore = session.questions.reduce((acc, q) => acc + q.evaluation.score, 0);
  const avgScore = totalScore / session.questions.length;
  session.overallScore = parseFloat(avgScore.toFixed(1));

  // Generate overall feedback
  const overallFeedback = await aiProvider.generateOverallFeedback(session.toObject());
  session.overallFeedback = overallFeedback;
  
  session.status = 'completed';
  session.completedAt = new Date();

  await session.save();

  return session;
};
