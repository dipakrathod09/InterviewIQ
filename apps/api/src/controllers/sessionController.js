import { asyncHandler } from '../utils/asyncHandler.js';
import * as interviewService from '../services/interviewService.js';

export const createSession = asyncHandler(async (req, res) => {
  const session = await interviewService.createSession(req.user._id, req.body);
  res.status(201).json(session);
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await interviewService.getUserSessions(req.user._id);
  res.status(200).json(sessions);
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await interviewService.getSessionById(req.params.id, req.user._id);
  res.status(200).json(session);
});

export const generateQuestions = asyncHandler(async (req, res) => {
  const session = await interviewService.generateQuestionsForSession(req.params.id, req.user._id);
  res.status(200).json(session);
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answerText } = req.body;
  const result = await interviewService.evaluateAnswerForSession(req.params.id, req.user._id, questionId, answerText);
  res.status(200).json(result);
});

export const completeSession = asyncHandler(async (req, res) => {
  const session = await interviewService.completeSession(req.params.id, req.user._id);
  res.status(200).json(session);
});
