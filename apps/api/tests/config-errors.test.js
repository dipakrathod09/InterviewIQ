import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validateJwtSecret } from '../src/config/jwtSecret.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { ApiError } from '../src/utils/ApiError.js';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

describe('JWT configuration', () => {
  it.each([undefined, '', '   ', 'supersecretkey', 'supersecretkey_change_me_in_production', 'your_super_secret_jwt_key', 'replace_with_secure_random_secret', 'short'])('rejects unsafe production configuration %s', secret => {
    expect(() => validateJwtSecret(secret, 'production')).toThrow();
  });
  it('requires explicit dev configuration and accepts long non-placeholder production secret', () => {
    expect(() => validateJwtSecret(undefined, 'development')).toThrow();
    expect(validateJwtSecret('explicit-local-secret', 'development')).toBe('explicit-local-secret');
    expect(validateJwtSecret('9ee1b7a6038d46f092c6c84295a731be', 'production')).toHaveLength(32);
  });
  it.each(['', 'replace_with_secure_random_secret'])('fails actual production startup before listening with unsafe secret', secret => {
    const child = spawnSync(process.execPath, ['src/server.js'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: secret, AI_PROVIDER: 'mock' },
      encoding: 'utf8', timeout: 10000,
    });
    expect(child.status).not.toBe(0);
    expect(child.stderr).toContain('JWT_SECRET');
    expect(child.stdout).not.toContain('Server running');
  });
  it('loads production environment with an explicit random signing secret', () => {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./src/config/env.js'); console.log('config accepted')"], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: randomBytes(32).toString('hex') },
      encoding: 'utf8', timeout: 10000,
    });
    expect(child.status).toBe(0);
    expect(child.stdout).toContain('config accepted');
  });
});
describe('error categories', () => {
  const app = express();
  app.use(express.json());
  app.post('/json', (req, res) => res.json(req.body));
  app.get('/internal', () => { throw new Error('sensitive internal diagnostic'); });
  app.get('/duplicate', () => { throw Object.assign(new Error('database detail'), { code: 11000 }); });
  app.get('/forbidden', () => { throw new ApiError(403, 'Forbidden'); });
  app.use(errorHandler);
  it('handles malformed JSON, duplicate-key conflict and forbidden errors', async () => {
    expect((await request(app).post('/json').set('Content-Type','application/json').send('{')).status).toBe(400);
    const duplicate = await request(app).get('/duplicate');
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({ code: 'CONFLICT', message: 'Resource already exists' });
    expect((await request(app).get('/forbidden')).status).toBe(403);
  });
  it('hides production stacks and internal messages', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app).get('/internal');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, code: 'INTERNAL_ERROR', message: 'Server Error' });
    } finally { process.env.NODE_ENV = previous; }
  });
});
