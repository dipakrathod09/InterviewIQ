import { ApiError } from '../../../utils/ApiError.js';
import { env } from '../../../config/env.js';
import { GoogleGenAI } from '@google/genai';
import { buildQuestionPrompt } from '../prompts/questionPrompt.js';
import { parseQuestions } from '../parsers/questionParser.js';
import { buildEvaluationPrompt } from '../prompts/evaluationPrompt.js';
import { parseEvaluation } from '../parsers/evaluationParser.js';
import { buildOverallFeedbackPrompt } from '../prompts/overallFeedbackPrompt.js';
import { parseOverallFeedback } from '../parsers/overallFeedbackParser.js';
import { buildDashboardInsightsPrompt } from '../prompts/dashboardInsightsPrompt.js';
import { parseDashboardInsights } from '../parsers/dashboardInsightsParser.js';
import { buildResumePrompt } from '../prompts/resumePrompt.js';
import { parseResume } from '../parsers/resumeParser.js';
import { buildJobDescriptionPrompt } from '../prompts/jobDescriptionPrompt.js';
import { parseJobDescription } from '../parsers/jobDescriptionParser.js';
import { buildMatchPrompt } from '../prompts/matchPrompt.js';
import { parseMatch } from '../parsers/matchParser.js';



// Transient HTTP status codes from Gemini API that are worth retrying
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
const MAX_RETRIES = 3;

/**
 * Exponential backoff retry wrapper around the Gemini SDK.
 * Handles transient errors (rate limits, server overload) gracefully.
 */
const generateWithRetry = async (ai, params, attempt = 1) => {
  try {
    return await ai.models.generateContent(params);
  } catch (error) {
    const statusCode = error?.status || error?.error?.code;
    const isRetryable = RETRYABLE_STATUS_CODES.includes(statusCode);

    if (isRetryable && attempt <= MAX_RETRIES) {
      const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.warn(`[GeminiProvider] Attempt ${attempt} failed with ${statusCode}. Retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return generateWithRetry(ai, params, attempt + 1);
    }

    throw error;
  }
};

class GeminiProvider {
  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  _verifyReady() {
    if (!this.apiKey) {
      throw new ApiError(500, 'Gemini API key is not configured');
    }
  }

  async generateQuestions(context) {
    this._verifyReady();
    const prompt = buildQuestionPrompt(context);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.7 }
      });
      return parseQuestions(response.text, context.questionCount || 3);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to generate questions from AI provider');
    }
  }

  async evaluateAnswer(context) {
    this._verifyReady();
    const prompt = buildEvaluationPrompt(context);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.2 }
      });
      return parseEvaluation(response.text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to evaluate answer from AI provider');
    }
  }

  async generateOverallFeedback(context) {
    this._verifyReady();
    const prompt = buildOverallFeedbackPrompt(context);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.3 }
      });
      return parseOverallFeedback(response.text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to generate overall feedback from AI provider');
    }
  }

  async generateDashboardInsights(context) {
    this._verifyReady();
    const prompt = buildDashboardInsightsPrompt(context);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.4 }
      });
      return parseDashboardInsights(response.text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate insights from AI provider');
    }
  }

  async analyzeResume(context) {
    this._verifyReady();
    const prompt = buildResumePrompt(context.rawText);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.2 }
      });
      const parsed = parseResume(response.text);
      parsed.rawText = context.rawText;
      parsed.analyzedAt = new Date();
      return parsed;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to analyze resume from AI provider');
    }
  }

  async analyzeJobDescription(context) {
    this._verifyReady();
    const prompt = buildJobDescriptionPrompt(context.rawText);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.2 }
      });
      const parsed = parseJobDescription(response.text);
      parsed.rawText = context.rawText;
      parsed.analyzedAt = new Date();
      return parsed;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to analyze job description from AI provider');
    }
  }

  async matchResumeToJob(context) {
    this._verifyReady();
    const prompt = buildMatchPrompt(context);
    try {
      const response = await generateWithRetry(this.ai, {
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.2 }
      });
      return parseMatch(response.text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new ApiError(502, 'Failed to generate match analysis from AI provider');
    }
  }
}

export default new GeminiProvider();
