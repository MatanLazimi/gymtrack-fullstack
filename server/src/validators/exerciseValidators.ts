import { z } from 'zod';
import { MEASUREMENT_UNITS } from '../models/Exercise.js';

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(100),
  category: z.string().trim().min(1, 'Category is required').max(50),
  measurementUnit: z.enum(MEASUREMENT_UNITS),
  active: z.boolean().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
