import { env } from '../../config/env.js';
import mockProvider from './providers/mockProvider.js';
import geminiProvider from './providers/geminiProvider.js';
import openaiProvider from './providers/openaiProvider.js';

let activeProvider;

switch (env.AI_PROVIDER.toLowerCase()) {
  case 'gemini':
    console.log('🤖 AI Provider initialized: Gemini');
    activeProvider = geminiProvider;
    break;
  case 'openai':
    console.log('🤖 AI Provider initialized: OpenAI');
    activeProvider = openaiProvider;
    break;
  case 'mock':
  default:
    console.log('🤖 AI Provider initialized: Mock');
    activeProvider = mockProvider;
    break;
}

export const aiProvider = activeProvider;
