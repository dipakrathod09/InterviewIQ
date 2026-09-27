import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { InterviewSession } from '../src/models/InterviewSession.js';
import { createSession } from '../src/services/interviewService.js';

const dbName = `interviewiq_p0a_test_${randomUUID().replaceAll('-', '')}`;
const setup = { targetRole: '  Backend Developer  ', interviewType: 'Technical', experienceLevel: 'Entry Level', difficulty: 'Medium', techStack: [' Node.js '], interviewMode: 'Normal', focusTopic: '' };
const password = 'P0a-test-password!';
let a, b;
const as = (req, user = a) => req.set('Authorization', `Bearer ${user.token}`);
const register = name => request(app).post('/api/auth/register').send({ name, email: `${name}@example.com`, password });

beforeAll(async () => {
  // Ignore application MONGO_URI. Only this random local test database is disposable.
  await mongoose.connect('mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 5000 });
  await User.init();
  a = (await register('alice')).body;
  b = (await register('bob')).body;
  expect(a.token).toBeTypeOf('string');
  expect(b.token).toBeTypeOf('string');
});
afterAll(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && dbName.startsWith('interviewiq_p0a_test_')) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('authentication', () => {
  it('registers, hashes passwords and excludes hashes from user responses and default queries', async () => {
    expect(a).not.toHaveProperty('passwordHash');
    expect(await User.findById(a._id).lean()).not.toHaveProperty('passwordHash');
    const stored = await User.findById(a._id).select('+passwordHash');
    expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);
    for (const path of ['/api/auth/me', '/api/profile']) {
      const res = await as(request(app).get(path));
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('passwordHash');
    }
  });
  it('returns 409 for duplicates and preserves login including hash selection', async () => {
    expect((await register('alice')).status).toBe(409);
    const res = await request(app).post('/api/auth/login').send({ email: ' ALICE@EXAMPLE.COM ', password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect((await request(app).post('/api/auth/login').send({ email: a.email, password: 'wrong' })).status).toBe(401);
  });
  it.each(['/api/auth/register', '/api/auth/login'])('returns stable 400 for invalid %s', async path => {
    const res = await request(app).post(path).send({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR', message: 'Request validation failed' });
    expect(res.body.details[0]).toHaveProperty('path');
  });
  it('rejects missing, malformed and expired JWTs', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    for (const token of ['invalid', jwt.sign({ id: a._id }, env.JWT_SECRET, { expiresIn: -1 })]) {
      expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    }
  });
  it('uses sanitized Zod output including trimming and stripping unknown auth fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '  Carol  ', email: ' CAROL@EXAMPLE.COM ', password, targetRole: 'injected', passwordHash: 'injected' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Carol', email: 'carol@example.com', targetRole: '' });
  });
});

describe('session integrity', () => {
  const forbidden = { userId: '000000000000000000000001', questions: [{ questionText: 'Injected', userAnswer: 'Injected', evaluation: { score: 10 } }], overallScore: 10, overallFeedback: { summary: 'Injected' }, adaptiveContext: { injected: true }, status: 'completed', startedAt: '2000-01-01', completedAt: '2000-01-01', createdAt: '2000-01-01', updatedAt: '2000-01-01', evaluation: { score: 10 }, _id: '000000000000000000000002', __v: 999, unknownSensitiveField: true, resumeId: '000000000000000000000003', jobDescriptionId: '000000000000000000000004' };
  it('rejects original cross-user mass assignment without writing a document', async () => {
    const before = await InterviewSession.countDocuments();
    const res = await as(request(app).post('/api/sessions')).send({ ...setup, ...forbidden, userId: b._id });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(await InterviewSession.countDocuments()).toBe(before);
  });
  it.each(Object.entries(forbidden))('rejects server-owned/unsupported %s independently', async (key, value) => {
    const before = await InterviewSession.countDocuments();
    expect((await as(request(app).post('/api/sessions')).send({ ...setup, [key]: value })).status).toBe(400);
    expect(await InterviewSession.countDocuments()).toBe(before);
  });
  it('protects direct service callers', async () => {
    await expect(createSession(a._id, { ...setup, userId: b._id, overallScore: 10 })).rejects.toThrow();
  });
  it('persists sanitized setup with authenticated owner and server defaults', async () => {
    const res = await as(request(app).post('/api/sessions')).send(setup);
    expect(res.status).toBe(201);
    const saved = await InterviewSession.findById(res.body._id).lean();
    expect(String(saved.userId)).toBe(a._id);
    expect(saved).toMatchObject({ targetRole: 'Backend Developer', techStack: ['Node.js'], status: 'created', questions: [] });
    for (const field of ['overallScore', 'adaptiveContext', 'startedAt', 'completedAt']) expect(saved[field]).toBeUndefined();
  });
  it.each([{ interviewType: 'invalid' }, { difficulty: 'Impossible' }, { experienceLevel: 'invalid' }, { interviewMode: 'invalid' }, { targetRole: '   ' }, { techStack: [' '] }, { interviewMode: 'Focused Practice', focusTopic: '' }])('rejects invalid setup %j', async invalid => {
    expect((await as(request(app).post('/api/sessions')).send({ ...setup, ...invalid })).status).toBe(400);
  });
  it('denies cross-user read, generate, answer and complete without mutation', async () => {
    const created = await as(request(app).post('/api/sessions'), b).send(setup);
    const id = created.body._id;
    for (const [method, suffix, body] of [['get', '', undefined], ['post', '/generate', {}], ['post', '/answer', { questionId: new mongoose.Types.ObjectId().toString(), answerText: 'answer' }], ['patch', '/complete', {}]]) {
      expect((await as(request(app)[method](`/api/sessions/${id}${suffix}`)).send(body)).status).toBe(404);
    }
    expect((await InterviewSession.findById(id)).status).toBe('created');
    expect((await as(request(app).get('/api/sessions'))).body.some(s => s._id === id)).toBe(false);
  });
  it.each([['get',''],['post','/generate'],['post','/answer'],['patch','/complete']])('malformed ObjectId returns 400: %s %s', async (method, suffix) => {
    const res = await as(request(app)[method](`/api/sessions/not-an-object-id${suffix}`)).send({ questionId: new mongoose.Types.ObjectId().toString(), answerText: 'answer' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
  it.each([{}, { questionId: 'invalid', answerText: 'answer' }, { questionId: '000000000000000000000001', answerText: '   ' }, { questionId: '000000000000000000000001', answerText: 'answer', evaluation: { score: 10 } }])('invalid answer returns 400: %j', async body => {
    expect((await as(request(app).post('/api/sessions/000000000000000000000001/answer')).send(body)).status).toBe(400);
  });
  it('preserves Normal Mock interview, evaluation, completion, results and dashboard', async () => {
    const owner = (await register('flow')).body;
    const created = await as(request(app).post('/api/sessions'), owner).send(setup);
    expect(created.status).toBe(201);
    const id = created.body._id;
    const generated = await as(request(app).post(`/api/sessions/${id}/generate`), owner).send({});
    expect(generated.status).toBe(200);
    expect(generated.body.questions.length).toBeGreaterThan(0);
    expect((await as(request(app).patch(`/api/sessions/${id}/complete`), owner).send({})).status).toBe(400);
    for (const q of generated.body.questions) {
      const res = await as(request(app).post(`/api/sessions/${id}/answer`), owner).send({ questionId: q._id, answerText: '  An explanation of the concept.  ' });
      expect(res.status).toBe(200);
      expect(res.body.question.evaluation.score).toBe(7);
      expect(res.body.question.userAnswer).toBe('An explanation of the concept.');
    }
    const completed = await as(request(app).patch(`/api/sessions/${id}/complete`), owner).send({});
    expect(completed.status).toBe(200);
    expect(completed.body).toMatchObject({ status: 'completed', overallScore: 7 });
    expect(completed.body.overallFeedback.summary).toBeTypeOf('string');
    expect((await as(request(app).get(`/api/sessions/${id}`), owner)).body.status).toBe('completed');
    const stats = await as(request(app).get('/api/dashboard/stats'), owner);
    expect(stats.status).toBe(200);
    expect(stats.body.overview).toMatchObject({ totalInterviews: 1, averageScore: 7 });
    expect((await as(request(app).get('/api/dashboard/insights'), owner)).status).toBe(200);
  });
});
