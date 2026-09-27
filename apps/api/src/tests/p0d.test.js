import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { InterviewSession } from '../models/InterviewSession.js';

const TEST_DB_URI = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_iq_test';

let tokenA;
let userA;
let tokenB;
let userB;
let _counter = 0;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  if (userA) await InterviewSession.deleteMany({ userId: userA._id });
  if (userB) await InterviewSession.deleteMany({ userId: userB._id });
  await User.deleteMany({ email: { $regex: /@p0dtest\.com$/ } });
  await mongoose.disconnect();
});

const uniqueEmail = () => `user${++_counter}_${Date.now()}@p0dtest.com`;

const registerUser = async (firstName, lastName) => {
  const email = uniqueEmail();
  const res = await request(app).post('/api/auth/register').send({
    name: `${firstName} ${lastName}`,
    email,
    password: 'password123'
  });
  const user = await User.findOne({ email });
  return { token: res.body.token, user };
};

beforeEach(async () => {
  await User.deleteMany({ email: { $regex: /@p0dtest\.com$/ } });
  
  if (userA) await InterviewSession.deleteMany({ userId: userA._id });
  if (userB) await InterviewSession.deleteMany({ userId: userB._id });

  const resA = await registerUser('User', 'A');
  tokenA = resA.token;
  userA = resA.user;

  const resB = await registerUser('User', 'B');
  tokenB = resB.token;
  userB = resB.user;
});

describe('P0-D: Personalized Interview Loop', () => {
  
  const setupProfile = async (user, withHistory = false) => {
    user.resume = {
      rawText: 'Frontend developer with React experience.',
      analyzedAt: new Date(),
      summary: 'Frontend dev',
      skills: { technical: ['React'] },
      strengths: ['Testing']
    };
    user.jobDescription = {
      rawText: 'Looking for a dev with Node.js',
      analyzedAt: new Date(),
      role: 'Full Stack Dev',
      requiredSkills: ['Node.js']
    };
    user.matchAnalysis = {
      analyzedAt: new Date(),
      matchScore: 50,
      missingSkills: ['Node.js'],
      preparationPriorities: ['Learn backend']
    };
    await user.save();

    if (withHistory) {
      await InterviewSession.create({
        userId: user._id,
        targetRole: 'Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry',
        difficulty: 'Medium',
        status: 'completed',
        overallScore: 6,
        questions: [{
          questionText: 'Q1',
          topic: 'CSS',
          userAnswer: 'A1',
          evaluation: { score: 3 } // Very weak
        }]
      });
    }
  };

  describe('1-3, 16-17: Preconditions & Freshness', () => {
    const baseSession = {
      targetRole: 'Dev',
      interviewType: 'Technical',
      experienceLevel: 'Entry Level',
      difficulty: 'Medium',
      techStack: ['React'],
      interviewMode: 'Personalized'
    };

    it('rejects personalized mode without resume analysis', async () => {
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send(baseSession);
      if(res.status >= 400) console.log(res.body);
      const session = res.body;
      
      const genRes = await request(app).post(`/api/sessions/${session._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(400);
      expect(genRes.body.message).toMatch(/Analyze your resume/i);
    });

    it('rejects personalized mode without JD analysis', async () => {
      userA.resume = { analyzedAt: new Date() };
      await userA.save();

      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send(baseSession);
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      
      expect(genRes.status).toBe(400);
      expect(genRes.body.message).toMatch(/Add and analyze a job description/i);
    });

    it('rejects personalized mode without fresh match', async () => {
      userA.resume = { analyzedAt: new Date() };
      userA.jobDescription = { analyzedAt: new Date() };
      await userA.save();

      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send(baseSession);
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      
      expect(genRes.status).toBe(400);
      expect(genRes.body.message).toMatch(/Run Resume ↔ JD Match/i);
    });
  });

  describe('4-15: Personalized Context and Generation', () => {
    it('works with resume + JD + match and NO interview history', async () => {
      await setupProfile(userA, false); // No history
      
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Full Stack Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Personalized'
      });
      const sessionId = res.body._id;

      const genRes = await request(app).post(`/api/sessions/${sessionId}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(200);
      
      const session = await InterviewSession.findById(sessionId);
      expect(session.status).toBe('in_progress');
      expect(session.questions.length).toBe(3);
      
      // personalizedContext snapshot persists (Test 14)
      expect(session.personalizedContext).toBeDefined();
      expect(session.personalizedContext.sourceSessionCount).toBe(0);
      expect(session.personalizedContext.missingSkills).toContain('Node.js');
    });

    it('works with completed history and User B history does not affect User A', async () => {
      await setupProfile(userA, true); // User A has 1 completed session (CSS weak)
      await setupProfile(userB, true); // User B has 1 completed session
      
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Full Stack Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Personalized'
      });
      
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(200);

      const session = await InterviewSession.findById(res.body._id);
      expect(session.personalizedContext.sourceSessionCount).toBe(1); // Only User A's history! (Tests 6 & 7)
      expect(session.personalizedContext.weakTopics).toContain('CSS');
    });

    it('client cannot inject personalizedContext (Test 15)', async () => {
      await setupProfile(userA, false);
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Personalized',
        personalizedContext: { hack: 'injected' }
      });
      
      // P0-A validation should strip it or ignore it
      expect(res.status).toBe(400);
    });

    it('Mock personalized questions reflect context (Test 8-13)', async () => {
      await setupProfile(userA, true); // Has CSS weakness, Node.js missing skill, Project A
      
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Full Stack Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Personalized'
      });
      
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(200);

      // Mock Provider should return deterministic questions based on our implemented logic
      const qs = genRes.body.questions;
      expect(qs[0].questionText).toContain('Node.js'); // missing skill
      expect(qs[1].questionText).toContain('CSS'); // weak topic
      expect(qs[2].questionText).toContain('Testing'); // resume project/strength
    });
  });

  describe('18-20: Other Modes still work', () => {
    it('normal mode still works', async () => {
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Normal'
      });
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(200); // Does not enforce resume rules
    });

    it('focused practice still works', async () => {
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Focused Practice',
        focusTopic: 'Docker'
      });
      const genRes = await request(app).post(`/api/sessions/${res.body._id}/generate`).set('Authorization', `Bearer ${tokenA}`);
      expect(genRes.status).toBe(200);
    });
  });

  describe('21-22: Completion and Analytics', () => {
    it('Personalized interview completes normally and updates analytics', async () => {
      await setupProfile(userA, false);
      const res = await request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send({
        targetRole: 'Dev',
        interviewType: 'Technical',
        experienceLevel: 'Entry Level',
        difficulty: 'Medium',
        techStack: ['React'],
        interviewMode: 'Personalized'
      });
      const sessionId = res.body._id;

      await request(app).post(`/api/sessions/${sessionId}/generate`).set('Authorization', `Bearer ${tokenA}`);
      
      const session = await InterviewSession.findById(sessionId);
      
      for (const q of session.questions) {
        await request(app).post(`/api/sessions/${sessionId}/answer`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ questionId: q._id, answerText: 'My answer' });
      }

      const compRes = await request(app).patch(`/api/sessions/${sessionId}/complete`).set('Authorization', `Bearer ${tokenA}`);
      if (compRes.status !== 200) console.log('compRes failed:', compRes.status, compRes.body);
      expect(compRes.status).toBe(200);
      expect(compRes.body.overallScore).toBeDefined();

      // Check stats
      const statsRes = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${tokenA}`);
      expect(statsRes.body.overview.totalInterviews).toBe(1); // The one we just completed
      expect(statsRes.body.overview.averageScore).toBeGreaterThan(0);
    });
  });

});
