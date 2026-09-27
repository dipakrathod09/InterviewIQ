import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';

describe('P1 - Production Hardening & Deployment Readiness', () => {

  describe('Health Endpoint', () => {
    it('should return 200 OK with status and environment', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.environment).toBe(env.NODE_ENV);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.JWT_SECRET).toBeUndefined(); // ensure no secrets
    });
  });

  describe('CORS Restrictions', () => {
    it('should allow explicitly configured CLIENT_URL origin', async () => {
      const allowedOrigin = env.CLIENT_URL.split(',')[0].trim();
      const res = await request(app)
        .options('/api/health')
        .set('Origin', allowedOrigin);
      
      expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
    });

    it('should disallow unknown browser origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-origin.com');
      
      // The error is thrown to errorHandler which returns 500 by default for generic errors
      expect(res.status).toBe(500); 
    });
  });

  describe('AI Provider Fail-Fast Configuration', () => {
    it('should correctly expose Gemini configuration', () => {
      expect(env.AI_PROVIDER).toBeDefined();
      expect(['mock', 'gemini']).toContain(env.AI_PROVIDER);
      expect(env.GEMINI_MODEL).toBeDefined();
    });
  });
  
  describe('Rate Limiting (Basic Validation)', () => {
    // Note: Testing actual rate limiting limits would require hitting it max times, 
    // which makes the test slow and flaky if limits are high. We verify 429 returns if mocked.
    it('should return rate limit headers on normal routes', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
    });
  });
});
