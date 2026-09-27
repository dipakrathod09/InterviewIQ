import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { InterviewSession } from '../models/InterviewSession.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

describe('P2 - Portfolio Completeness Pass', () => {
  let token;
  let userId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_iq_test';
      await mongoose.connect(dbUri);
    }
    const user = await User.create({
      name: 'P2 Test User',
      email: 'p2test@example.com',
      passwordHash: 'hashed_password'
    });
    userId = user._id;
    token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'p2test@example.com' });
    await User.deleteMany({ email: 'emptyarray@example.com' });
    await InterviewSession.deleteMany({ userId });
    await mongoose.disconnect();
  });

  describe('Part 1: Expand Resume Intelligence', () => {
    it('1-6. analyzes resume and successfully persists education, experience, and projects', async () => {
      const res = await request(app)
        .post('/api/profile/resume')
        .set('Authorization', `Bearer ${token}`)
        .send({ rawText: 'Sample resume text' });

      expect(res.status).toBe(200);

      const user = await User.findById(userId);
      expect(user.resume.education).toBeInstanceOf(Array);
      expect(user.resume.experience).toBeInstanceOf(Array);
      expect(user.resume.projects).toBeInstanceOf(Array);

      // Verify mock data was populated correctly
      expect(user.resume.education[0].degree).toBe('B.S. Computer Science');
      expect(user.resume.experience[0].organization).toBe('TechCorp');
      expect(user.resume.projects[0].name).toBe('Portfolio Website');
    });

    it('7-8. personalized context handles empty arrays gracefully', async () => {
      // Create a user with empty resume arrays
      const emptyUser = await User.create({
        name: 'Empty Array User',
        email: 'emptyarray@example.com',
        passwordHash: 'hash',
        resume: {
          analyzedAt: new Date(),
          education: [],
          experience: [],
          projects: []
        },
        jobDescription: {
          analyzedAt: new Date(),
          role: 'Dev'
        },
        matchAnalysis: {
          analyzedAt: new Date(),
          matchScore: 80
        }
      });
      const emptyToken = jwt.sign({ id: emptyUser._id }, env.JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${emptyToken}`)
        .send({
          targetRole: 'Dev',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy',
          interviewMode: 'Personalized'
        });

      expect(res.status).toBe(201);
      
      // Generate questions — should not crash even with empty education/experience/projects
      const genRes = await request(app)
        .post(`/api/sessions/${res.body._id}/generate`)
        .set('Authorization', `Bearer ${emptyToken}`);
      expect(genRes.status).toBe(200);
      expect(genRes.body.questions.length).toBeGreaterThan(0);
    });
  });

  describe('Part 3: Question Count', () => {
    it('14. default question count is 3', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetRole: 'Default Count Dev',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy'
        });

      expect(res.status).toBe(201);
      expect(res.body.questionCount).toBe(3);
    });

    it('15. question count of 3 works and mock returns exactly 3', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetRole: 'Dev 3',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy',
          questionCount: 3
        });

      expect(res.status).toBe(201);
      
      const genRes = await request(app)
        .post(`/api/sessions/${res.body._id}/generate`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(genRes.status).toBe(200);
      expect(genRes.body.questions.length).toBe(3);
    });

    it('16. question count of 5 works and mock returns exactly 5', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetRole: 'Dev 5',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy',
          questionCount: 5
        });

      expect(res.status).toBe(201);
      
      const genRes = await request(app)
        .post(`/api/sessions/${res.body._id}/generate`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(genRes.status).toBe(200);
      expect(genRes.body.questions.length).toBe(5);
    });

    it('17. question count of 10 works and mock returns exactly 10', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetRole: 'Dev 10',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy',
          questionCount: 10
        });

      expect(res.status).toBe(201);
      
      const genRes = await request(app)
        .post(`/api/sessions/${res.body._id}/generate`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(genRes.status).toBe(200);
      expect(genRes.body.questions.length).toBe(10);
    });

    it('18-19. invalid counts are rejected and do not corrupt data', async () => {
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetRole: 'Invalid Count Dev',
          interviewType: 'Technical',
          experienceLevel: 'Entry Level',
          difficulty: 'Easy',
          questionCount: 42
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
