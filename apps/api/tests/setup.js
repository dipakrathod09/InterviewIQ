import { randomBytes } from 'node:crypto';
// Never use developer credentials or a paid provider in this suite.
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'mock';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';
