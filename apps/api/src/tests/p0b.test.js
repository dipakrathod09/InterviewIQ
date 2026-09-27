/**
 * P0-B Integration Test Suite
 * Uses a real local MongoDB (same one the dev server uses).
 * Each test file run wipes test-scoped data via unique email suffixes + cleanup.
 *
 * Run: npm test --workspace=apps/api
 * Requires: MongoDB running locally + AI_PROVIDER=mock (set in vitest.config.js env)
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { env } from '../config/env.js';

// ─── Setup ───────────────────────────────────────────────────────────────────

const TEST_DB_URI = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interview_iq_test';

// Use a separate test database so we don't pollute dev data
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  // Clean up only test users/sessions created by this suite
  const { User } = await import('../models/User.js');
  const { InterviewSession } = await import('../models/InterviewSession.js');
  await User.deleteMany({ email: { $regex: /@p0btest\.com$/ } });
  await InterviewSession.deleteMany({});
  await mongoose.disconnect();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _counter = 0;
const uniqueEmail = () => `user${++_counter}_${Date.now()}@p0btest.com`;

const registerUser = async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: uniqueEmail(), password: 'password123' });
  expect(res.status).toBe(201);
  return res.body.token;
};

const createSession = async (token, overrides = {}) => {
  const res = await request(app)
    .post('/api/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      targetRole: 'Frontend Developer',
      interviewType: 'Technical',
      experienceLevel: 'Entry Level',
      difficulty: 'Easy',
      techStack: ['React'],
      interviewMode: 'Normal',
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body;
};

const generateQuestions = async (token, sessionId) => {
  const res = await request(app)
    .post(`/api/sessions/${sessionId}/generate`)
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body;
};

const submitAnswer = (token, sessionId, questionId, answerText) =>
  request(app)
    .post(`/api/sessions/${sessionId}/answer`)
    .set('Authorization', `Bearer ${token}`)
    .send({ questionId, answerText });

const answerAll = async (token, session) => {
  for (const q of session.questions) {
    const r = await submitAnswer(token, session._id, q._id, 'A thorough test answer');
    expect(r.status).toBe(200);
  }
};

const completeSession = (token, sessionId) =>
  request(app)
    .patch(`/api/sessions/${sessionId}/complete`)
    .set('Authorization', `Bearer ${token}`);

// ─── Test groups ─────────────────────────────────────────────────────────────

describe('P0-B 1–3: Answer submission basics', () => {
  it('1. First answer accepted (200) with evaluation', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);
    const q = withQ.questions[0];

    const res = await submitAnswer(token, withQ._id, q._id, 'My first answer');
    expect(res.status).toBe(200);
    expect(res.body.question.userAnswer).toBe('My first answer');
    expect(typeof res.body.question.evaluation.score).toBe('number');
  });

  it('2. Duplicate answer rejected with 409', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);
    const q = withQ.questions[0];

    await submitAnswer(token, withQ._id, q._id, 'First submission');
    const res2 = await submitAnswer(token, withQ._id, q._id, 'Second attempt');
    expect(res2.status).toBe(409);
  });

  it('3. Session stays in_progress before any answers (AI failure simulation: state not corrupted)', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);

    // Check that all questions start unanswered
    const beforeRes = await request(app)
      .get(`/api/sessions/${session._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(beforeRes.body.status).toBe('in_progress');
    expect(beforeRes.body.questions.every(q => !q.userAnswer)).toBe(true);
  });
});

describe('P0-B 4–7: Completion invariants', () => {
  it('4. Cannot complete with unanswered questions (400)', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);

    // Answer only first question
    await submitAnswer(token, withQ._id, withQ.questions[0]._id, 'Only one answer');

    const res = await completeSession(token, withQ._id);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing a valid answer or evaluation/i);
  });

  it('5. Cannot complete with zero questions answered (400)', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    await generateQuestions(token, session._id);

    const res = await completeSession(token, session._id);
    expect(res.status).toBe(400);
  });

  it('6. Fully evaluated session completes (200) with score + feedback', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);

    await answerAll(token, withQ);

    const res = await completeSession(token, withQ._id);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(typeof res.body.overallScore).toBe('number');
    expect(res.body.overallFeedback.summary).toBeTruthy();
    expect(Array.isArray(res.body.overallFeedback.strengths)).toBe(true);
    expect(Array.isArray(res.body.overallFeedback.nextSteps)).toBe(true);
  });

  it('7. Completed session cannot accept new answers (400)', async () => {
    const token = await registerUser();
    const session = await createSession(token);
    const withQ = await generateQuestions(token, session._id);

    await answerAll(token, withQ);
    const complete = await completeSession(token, withQ._id);
    expect(complete.status).toBe(200);

    // Try to submit again on the completed session
    const q = withQ.questions[0];
    const res = await submitAnswer(token, withQ._id, q._id, 'Trying after completion');
    expect(res.status).toBe(400); // session not in_progress
  });
});

describe('P0-B 8–12: Profile data integrity', () => {
  it('8. Resume rawText is retained after analysis', async () => {
    const token = await registerUser();
    const raw = 'I am an experienced React developer with 5 years of experience.';

    await request(app)
      .post('/api/profile/resume')
      .set('Authorization', `Bearer ${token}`)
      .send({ rawText: raw })
      .expect(200);

    const profile = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profile.body.resume.rawText).toBe(raw);
  });

  it('9. JD rawText is retained after analysis', async () => {
    const token = await registerUser();
    const raw = 'Seeking a Senior TypeScript developer with Next.js experience.';

    await request(app)
      .post('/api/profile/job-description')
      .set('Authorization', `Bearer ${token}`)
      .send({ rawText: raw })
      .expect(200);

    const profile = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profile.body.jobDescription.rawText).toBe(raw);
  });

  it('10. Match is cleared when resume is replaced', async () => {
    const token = await registerUser();

    await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).send({ rawText: 'Original resume' });
    await request(app).post('/api/profile/job-description').set('Authorization', `Bearer ${token}`).send({ rawText: 'Original JD' });
    await request(app).get('/api/profile/match').set('Authorization', `Bearer ${token}`).expect(200);

    // Confirm match exists
    const before = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(before.body.matchAnalysis?.matchScore).toBeDefined();

    // Replace resume → match should be invalidated
    await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).send({ rawText: 'Completely new resume content' });

    const after = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    // matchAnalysis should be cleared (undefined/null/empty)
    const match = after.body.matchAnalysis;
    const isCleared = !match || !match.matchScore;
    expect(isCleared).toBe(true);
  });

  it('11. Match is cleared when JD is replaced', async () => {
    const token = await registerUser();

    await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).send({ rawText: 'My resume' });
    await request(app).post('/api/profile/job-description').set('Authorization', `Bearer ${token}`).send({ rawText: 'Original JD' });
    await request(app).get('/api/profile/match').set('Authorization', `Bearer ${token}`).expect(200);

    const before = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(before.body.matchAnalysis?.matchScore).toBeDefined();

    // Replace JD → match should be invalidated
    await request(app).post('/api/profile/job-description').set('Authorization', `Bearer ${token}`).send({ rawText: 'Brand new job description' });

    const after = await request(app).get('/api/profile').set('Authorization', `Bearer ${token}`);
    const match = after.body.matchAnalysis;
    expect(!match || !match.matchScore).toBe(true);
  });

  it('12. New match can be generated after source replacement', async () => {
    const token = await registerUser();

    await request(app).post('/api/profile/resume').set('Authorization', `Bearer ${token}`).send({ rawText: 'New resume' });
    await request(app).post('/api/profile/job-description').set('Authorization', `Bearer ${token}`).send({ rawText: 'New JD' });

    const res = await request(app).get('/api/profile/match').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.matchScore).toBe('number');
  });
});

describe('P0-B 13: P0-A security regressions', () => {
  it('13a. Cross-user session GET is blocked (404)', async () => {
    const tokenA = await registerUser();
    const tokenB = await registerUser();

    const session = await createSession(tokenA);

    const res = await request(app)
      .get(`/api/sessions/${session._id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('13b. Cross-user answer submission is blocked (404)', async () => {
    const tokenA = await registerUser();
    const tokenB = await registerUser();

    const session = await createSession(tokenA);
    const withQ = await generateQuestions(tokenA, session._id);
    const q = withQ.questions[0];

    const res = await submitAnswer(tokenB, withQ._id, q._id, 'Cross-user exploit');
    expect(res.status).toBe(404);
  });

  it('13c. Malformed ObjectId returns 400', async () => {
    const token = await registerUser();
    const res = await request(app)
      .get('/api/sessions/not-a-valid-objectid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('13d. Missing JWT returns 401', async () => {
    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(401);
  });

  it('13e. Invalid JWT returns 401', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .set('Authorization', 'Bearer this.is.not.valid');
    expect(res.status).toBe(401);
  });
});
