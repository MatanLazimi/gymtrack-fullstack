import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ExerciseModel } from '../models/Exercise.js';
import { UserModel } from '../models/User.js';
import { WorkoutModel } from '../models/Workout.js';

let app: Express;
let authenticatedAgent: ReturnType<typeof request.agent>;

const exercise = { name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg' as const };
const TEST_USER_EMAIL = 'exercise-library-tests@example.com';
const OTHER_USER_EMAIL = 'exercise-library-tests-other@example.com';

beforeAll(async () => {
  await connectDatabase();
  app = createApp();
});

beforeEach(async () => {
  await ExerciseModel.deleteMany({});
  await WorkoutModel.deleteMany({});
  await UserModel.deleteMany({ email: { $in: [TEST_USER_EMAIL, OTHER_USER_EMAIL] } });
  authenticatedAgent = request.agent(app);
  await authenticatedAgent.post('/api/auth/register').send({ email: TEST_USER_EMAIL, password: 'password123' });
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('GET /api/exercises', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/exercises');
    expect(response.status).toBe(401);
  });

  it('lists exercises sorted by name for an authenticated user', async () => {
    await ExerciseModel.create([exercise, { ...exercise, name: 'אאא' }]);
    const response = await authenticatedAgent.get('/api/exercises');

    expect(response.status).toBe(200);
    expect(response.body.exercises).toHaveLength(2);
    expect(response.body.exercises[0].name).toBe('אאא');
  });
});

describe('POST /api/exercises', () => {
  it('creates an exercise with active defaulting to true', async () => {
    const response = await authenticatedAgent.post('/api/exercises').send(exercise);

    expect(response.status).toBe(201);
    expect(response.body.exercise).toMatchObject(exercise);
    expect(response.body.exercise.active).toBe(true);
  });

  it('rejects an invalid measurementUnit with 400', async () => {
    const response = await authenticatedAgent.post('/api/exercises').send({ ...exercise, measurementUnit: 'lbs' });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/exercises/:id', () => {
  it('returns 404 for a well-formed but nonexistent id', async () => {
    const response = await authenticatedAgent.get('/api/exercises/507f1f77bcf86cd799439011');
    expect(response.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const response = await authenticatedAgent.get('/api/exercises/not-an-id');
    expect(response.status).toBe(400);
  });
});

describe('PUT /api/exercises/:id', () => {
  it('updates an exercise, e.g. deactivating it', async () => {
    const created = await ExerciseModel.create(exercise);
    const response = await authenticatedAgent.put(`/api/exercises/${created.id}`).send({ active: false });

    expect(response.status).toBe(200);
    expect(response.body.exercise.active).toBe(false);
  });
});

describe('DELETE /api/exercises/:id', () => {
  it('deletes an exercise', async () => {
    const created = await ExerciseModel.create(exercise);
    const response = await authenticatedAgent.delete(`/api/exercises/${created.id}`);

    expect(response.status).toBe(204);
    expect(await ExerciseModel.findById(created.id)).toBeNull();
  });

  it('returns 404 when deleting an already-deleted exercise', async () => {
    const created = await ExerciseModel.create(exercise);
    await authenticatedAgent.delete(`/api/exercises/${created.id}`);
    const response = await authenticatedAgent.delete(`/api/exercises/${created.id}`);

    expect(response.status).toBe(404);
  });
});

describe('GET /api/exercises/:id/history', () => {
  it('returns null when the user has never logged the exercise', async () => {
    const created = await ExerciseModel.create(exercise);
    const response = await authenticatedAgent.get(`/api/exercises/${created.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body.previousPerformance).toBeNull();
  });

  it('returns the most recent logged sets for the exercise', async () => {
    const created = await ExerciseModel.create(exercise);
    await WorkoutModel.create({
      userId: (await UserModel.findOne({ email: TEST_USER_EMAIL }))!._id,
      date: new Date('2026-01-01'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 60, reps: 12 }] }],
    });
    await WorkoutModel.create({
      userId: (await UserModel.findOne({ email: TEST_USER_EMAIL }))!._id,
      date: new Date('2026-01-08'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 65, reps: 10 }] }],
    });

    const response = await authenticatedAgent.get(`/api/exercises/${created.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body.previousPerformance.sets).toEqual([expect.objectContaining({ value: 65, reps: 10 })]);
  });

  it('skips a more recent workout that has the exercise but no logged sets yet', async () => {
    const created = await ExerciseModel.create(exercise);
    const userId = (await UserModel.findOne({ email: TEST_USER_EMAIL }))!._id;
    await WorkoutModel.create({
      userId,
      date: new Date('2026-01-01'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 60, reps: 12 }] }],
    });
    await WorkoutModel.create({
      userId,
      date: new Date('2026-01-08'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [] }],
    });

    const response = await authenticatedAgent.get(`/api/exercises/${created.id}/history`);

    expect(response.status).toBe(200);
    expect(response.body.previousPerformance.sets).toEqual([expect.objectContaining({ value: 60, reps: 12 })]);
  });

  it('rejects a malformed excludeWorkoutId with 400', async () => {
    const created = await ExerciseModel.create(exercise);

    const response = await authenticatedAgent.get(`/api/exercises/${created.id}/history?excludeWorkoutId=not-an-id`);

    expect(response.status).toBe(400);
  });

  it('excludes the given workout id, e.g. the one currently being edited', async () => {
    const created = await ExerciseModel.create(exercise);
    const userId = (await UserModel.findOne({ email: TEST_USER_EMAIL }))!._id;
    await WorkoutModel.create({
      userId,
      date: new Date('2026-01-01'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 60, reps: 12 }] }],
    });
    const today = await WorkoutModel.create({
      userId,
      date: new Date('2026-01-08'),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 65, reps: 10 }] }],
    });

    const response = await authenticatedAgent.get(
      `/api/exercises/${created.id}/history?excludeWorkoutId=${today.id}`,
    );

    expect(response.body.previousPerformance.sets).toEqual([expect.objectContaining({ value: 60, reps: 12 })]);
  });

  it("never returns another user's workout data", async () => {
    const created = await ExerciseModel.create(exercise);
    const otherAgent = request.agent(app);
    await otherAgent.post('/api/auth/register').send({ email: OTHER_USER_EMAIL, password: 'password123' });
    const otherUserId = (await UserModel.findOne({ email: OTHER_USER_EMAIL }))!._id;
    await WorkoutModel.create({
      userId: otherUserId,
      date: new Date(),
      exercises: [{ exerciseId: created.id, exerciseName: created.name, sets: [{ value: 100, reps: 5 }] }],
    });

    const response = await authenticatedAgent.get(`/api/exercises/${created.id}/history`);

    expect(response.body.previousPerformance).toBeNull();
  });
});
