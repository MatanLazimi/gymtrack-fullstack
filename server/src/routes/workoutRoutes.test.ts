import type { Express } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { WorkoutModel } from '../models/Workout.js';

let app: Express;
let userA: ReturnType<typeof request.agent>;
let userB: ReturnType<typeof request.agent>;

const EMAIL_A = 'workout-tests-a@example.com';
const EMAIL_B = 'workout-tests-b@example.com';

const exerciseId = new Types.ObjectId().toString();

function workoutPayload() {
  return {
    exercises: [
      {
        exerciseId,
        exerciseName: 'לחיצות חזה',
        sets: [{ value: 60, reps: 12 }],
      },
    ],
  };
}

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await WorkoutModel.deleteMany({});
  await UserModel.deleteMany({ email: { $in: [EMAIL_A, EMAIL_B] } });

  userA = request.agent(app);
  userB = request.agent(app);
  await userA.post('/api/auth/register').send({ email: EMAIL_A, password: 'password123' });
  await userB.post('/api/auth/register').send({ email: EMAIL_B, password: 'password123' });
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('POST /api/workouts', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).post('/api/workouts').send(workoutPayload());
    expect(response.status).toBe(401);
  });

  it('creates a workout scoped to the authenticated user', async () => {
    const response = await userA.post('/api/workouts').send(workoutPayload());

    expect(response.status).toBe(201);
    expect(response.body.workout.exercises).toHaveLength(1);
    expect(response.body.workout.exercises[0].sets).toHaveLength(1);
    expect(response.body.workout.date).toBeDefined();
  });

  it('rejects a set with a negative value', async () => {
    const payload = workoutPayload();
    payload.exercises[0].sets[0].value = -5;
    const response = await userA.post('/api/workouts').send(payload);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/workouts', () => {
  it("only returns the authenticated user's own workouts", async () => {
    await userA.post('/api/workouts').send(workoutPayload());
    await userA.post('/api/workouts').send(workoutPayload());
    await userB.post('/api/workouts').send(workoutPayload());

    const responseA = await userA.get('/api/workouts');
    const responseB = await userB.get('/api/workouts');

    expect(responseA.body.workouts).toHaveLength(2);
    expect(responseB.body.workouts).toHaveLength(1);
  });
});

describe('GET /api/workouts/:id', () => {
  it("returns 404 for another user's workout instead of leaking its existence", async () => {
    const created = await userA.post('/api/workouts').send(workoutPayload());
    const response = await userB.get(`/api/workouts/${created.body.workout._id}`);

    expect(response.status).toBe(404);
  });

  it('returns the workout for its owner', async () => {
    const created = await userA.post('/api/workouts').send(workoutPayload());
    const response = await userA.get(`/api/workouts/${created.body.workout._id}`);

    expect(response.status).toBe(200);
  });
});

describe('PUT /api/workouts/:id', () => {
  it('appends a new set to an existing exercise', async () => {
    const created = await userA.post('/api/workouts').send(workoutPayload());
    const workout = created.body.workout;
    workout.exercises[0].sets.push({ value: 65, reps: 10 });

    const response = await userA.put(`/api/workouts/${workout._id}`).send({ exercises: workout.exercises });

    expect(response.status).toBe(200);
    expect(response.body.workout.exercises[0].sets).toHaveLength(2);
  });

  it("cannot update another user's workout", async () => {
    const created = await userA.post('/api/workouts').send(workoutPayload());
    const response = await userB.put(`/api/workouts/${created.body.workout._id}`).send({ exercises: [] });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/workouts/:id', () => {
  it('deletes the workout for its owner', async () => {
    const created = await userA.post('/api/workouts').send(workoutPayload());
    const response = await userA.delete(`/api/workouts/${created.body.workout._id}`);

    expect(response.status).toBe(204);
  });
});
