import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createWorkoutSchema, setSchema } from './workoutValidators.js';

describe('setSchema', () => {
  it('accepts a valid set with decimal value', () => {
    const result = setSchema.safeParse({ value: 17.5, reps: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasAdditionalWeight).toBe(false);
      expect(result.data.isPerSide).toBe(false);
    }
  });

  it('rejects a negative value', () => {
    const result = setSchema.safeParse({ value: -1, reps: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative reps', () => {
    const result = setSchema.safeParse({ value: 10, reps: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer reps', () => {
    const result = setSchema.safeParse({ value: 10, reps: 8.5 });
    expect(result.success).toBe(false);
  });

  it('accepts explicit hasAdditionalWeight and isPerSide flags', () => {
    const result = setSchema.safeParse({ value: 59, reps: 10, hasAdditionalWeight: true, isPerSide: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasAdditionalWeight).toBe(true);
      expect(result.data.isPerSide).toBe(true);
    }
  });
});

describe('createWorkoutSchema', () => {
  it('accepts an empty workout with no exercises yet', () => {
    const result = createWorkoutSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises).toEqual([]);
    }
  });

  it('accepts a workout with an exercise and sets', () => {
    const result = createWorkoutSchema.safeParse({
      exercises: [
        {
          exerciseId: new Types.ObjectId().toString(),
          exerciseName: 'לחיצות חזה',
          sets: [{ value: 60, reps: 12 }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an exercise with an invalid exerciseId', () => {
    const result = createWorkoutSchema.safeParse({
      exercises: [{ exerciseId: 'not-an-id', exerciseName: 'לחיצות חזה' }],
    });
    expect(result.success).toBe(false);
  });
});
