import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { UserModel } from '../models/User.js';

let app: Express;

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await disconnectDatabase();
});

const credentials = { email: 'lifter@example.com', password: 'password123' };

describe('POST /api/auth/register', () => {
  it('creates a user and sets a session cookie', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: credentials.email });
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.headers['set-cookie']?.[0]).toMatch(/gymtrack_token=/);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const response = await request(app).post('/api/auth/register').send(credentials);

    expect(response.status).toBe(409);
  });

  it('rejects an invalid body with 400', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: '123' });

    expect(response.status).toBe(400);
  });

  it('resolves a concurrent duplicate registration as 409, not a 500 from the race', async () => {
    const [first, second] = await Promise.all([
      request(app).post('/api/auth/register').send(credentials),
      request(app).post('/api/auth/register').send(credentials),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const response = await request(app).post('/api/auth/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: credentials.email });
  });

  it('rejects an unknown email with 401', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials);

    expect(response.status).toBe(401);
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns the current user for an authenticated request', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: credentials.email });
  });
});
