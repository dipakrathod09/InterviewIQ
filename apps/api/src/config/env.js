import dotenv from 'dotenv';
import { validateJwtSecret } from './jwtSecret.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve .env relative to this file so it works regardless of cwd
dotenv.config({ path: resolve(__dirname, '../../.env') });

const aiProvider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
if (!['mock', 'gemini'].includes(aiProvider)) {
  if (aiProvider === 'openai') {
    throw new Error('AI_PROVIDER=openai is configured but OpenAI is currently unsupported/not-implemented.');
  }
  throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}. Allowed values: mock, gemini`);
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/interview-iq',
  JWT_SECRET: validateJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV || 'development'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_PROVIDER: aiProvider,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  // Rate Limits
  API_RATE_LIMIT_WINDOW_MS: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  API_RATE_LIMIT_MAX: parseInt(process.env.API_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'test' ? '10000' : '100'), 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'test' ? '10000' : '10'), 10),
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'test' ? '10000' : '15'), 10),
  AI_DAILY_REQUEST_LIMIT: parseInt(process.env.AI_DAILY_REQUEST_LIMIT || '50', 10),
};
