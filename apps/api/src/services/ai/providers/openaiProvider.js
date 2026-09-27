import { ApiError } from '../../../utils/ApiError.js';
import { env } from '../../../config/env.js';

class OpenAIProvider {
  constructor() {
    this.apiKey = env.OPENAI_API_KEY;
  }

  _verifyReady() {
    if (!this.apiKey) {
      throw new ApiError(500, 'OpenAI API key is not configured');
    }
  }

  async generateQuestions(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.generateQuestions not implemented yet');
  }

  async evaluateAnswer(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.evaluateAnswer not implemented yet');
  }

  async generateOverallFeedback(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.generateOverallFeedback not implemented yet');
  }

  async generateDashboardInsights(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.generateDashboardInsights not implemented yet');
  }

  async analyzeResume(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.analyzeResume not implemented yet');
  }

  async analyzeJobDescription(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.analyzeJobDescription not implemented yet');
  }

  async matchResumeToJob(context) {
    this._verifyReady();
    throw new Error('OpenAIProvider.matchResumeToJob not implemented yet');
  }
}

export default new OpenAIProvider();
