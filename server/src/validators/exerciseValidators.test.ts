import { describe, expect, it } from 'vitest';
import { createExerciseSchema, updateExerciseSchema } from './exerciseValidators.js';

describe('createExerciseSchema', () => {
  it('accepts a valid exercise', () => {
    const result = createExerciseSchema.safeParse({
      name: 'לחיצות חזה',
      category: 'חזה',
      measurementUnit: 'kg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = createExerciseSchema.safeParse({ category: 'חזה', measurementUnit: 'kg' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid measurementUnit', () => {
    const result = createExerciseSchema.safeParse({ name: 'a', category: 'b', measurementUnit: 'lbs' });
    expect(result.success).toBe(false);
  });

  it('defaults active to undefined so the schema default applies', () => {
    const result = createExerciseSchema.safeParse({ name: 'a', category: 'b', measurementUnit: 'hole' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBeUndefined();
    }
  });
});

describe('updateExerciseSchema', () => {
  it('accepts a partial update', () => {
    const result = updateExerciseSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object', () => {
    const result = updateExerciseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects an invalid measurementUnit even in a partial update', () => {
    const result = updateExerciseSchema.safeParse({ measurementUnit: 'lbs' });
    expect(result.success).toBe(false);
  });
});
