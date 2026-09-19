import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { RoutineModel } from '../models/Routine.js';
import { UserModel } from '../models/User.js';

let app: Express;
let userA: ReturnType<typeof request.agent>;
let userB: ReturnType<typeof request.agent>;

const EMAIL_A = 'routine-tests-a@example.com';
const EMAIL_B = 'routine-tests-b@example.com';

const exerciseId = new Types.ObjectId().toString();

function routinePayload() {
  return {
    name: 'דחיפה',
    exercises: [{ exerciseId, exerciseName: 'לחיצות חזה' }],
  };
}

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await RoutineModel.deleteMany({});
  await UserModel.deleteMany({ email: { $in: [EMAIL_A, EMAIL_B] } });

  userA = request.agent(app);
  userB = request.agent(app);
  await userA.post('/api/auth/register').send({ email: EMAIL_A, password: 'password123' });
  await userB.post('/api/auth/register').send({ email: EMAIL_B, password: 'password123' });
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('POST /api/routines', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).post('/api/routines').send(routinePayload());
    expect(response.status).toBe(401);
  });

  it('creates a routine scoped to the authenticated user', async () => {
    const response = await userA.post('/api/routines').send(routinePayload());

    expect(response.status).toBe(201);
    expect(response.body.routine.name).toBe('דחיפה');
    expect(response.body.routine.exercises).toHaveLength(1);
  });

  it('rejects a routine with no exercises', async () => {
    const payload = routinePayload();
    payload.exercises = [];
    const response = await userA.post('/api/routines').send(payload);
    expect(response.status).toBe(400);
  });

  it('rejects a routine with no name', async () => {
    const payload = routinePayload();
    // @ts-expect-error intentionally invalid payload for validation test
    payload.name = '';
    const response = await userA.post('/api/routines').send(payload);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/routines', () => {
  it("only returns the authenticated user's own routines", async () => {
    await userA.post('/api/routines').send(routinePayload());
    await userA.post('/api/routines').send(routinePayload());
    await userB.post('/api/routines').send(routinePayload());

    const responseA = await userA.get('/api/routines');
    const responseB = await userB.get('/api/routines');

    expect(responseA.body.routines).toHaveLength(2);
    expect(responseB.body.routines).toHaveLength(1);
  });
});

describe('GET /api/routines/:id', () => {
  it("returns 404 for another user's routine instead of leaking its existence", async () => {
    const created = await userA.post('/api/routines').send(routinePayload());
    const response = await userB.get(`/api/routines/${created.body.routine._id}`);

    expect(response.status).toBe(404);
  });

  it('returns the routine for its owner', async () => {
    const created = await userA.post('/api/routines').send(routinePayload());
    const response = await userA.get(`/api/routines/${created.body.routine._id}`);

    expect(response.status).toBe(200);
  });
});

describe('PUT /api/routines/:id', () => {
  it('updates the name and exercises of an existing routine', async () => {
    const created = await userA.post('/api/routines').send(routinePayload());

    const response = await userA
      .put(`/api/routines/${created.body.routine._id}`)
      .send({ name: 'משיכה', exercises: created.body.routine.exercises });

    expect(response.status).toBe(200);
    expect(response.body.routine.name).toBe('משיכה');
  });

  it("cannot update another user's routine", async () => {
    const created = await userA.post('/api/routines').send(routinePayload());
    const response = await userB.put(`/api/routines/${created.body.routine._id}`).send({ name: 'משיכה' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/routines/:id', () => {
  it('deletes the routine for its owner', async () => {
    const created = await userA.post('/api/routines').send(routinePayload());
    const response = await userA.delete(`/api/routines/${created.body.routine._id}`);

    expect(response.status).toBe(204);
  });
});
