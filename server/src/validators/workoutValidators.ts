import { Types } from 'mongoose';
import { z } from 'zod';

const objectIdString = z.string().refine((value) => Types.ObjectId.isValid(value), 'Invalid id');

export const setSchema = z.object({
  value: z.number().min(0, 'value must not be negative'),
  reps: z.number().int('reps must be a whole number').min(0, 'reps must not be negative'),
  hasAdditionalWeight: z.boolean().optional().default(false),
  isPerSide: z.boolean().optional().default(false),
});

export const workoutExerciseSchema = z.object({
  exerciseId: objectIdString,
  exerciseName: z.string().trim().min(1, 'exerciseName is required'),
  sets: z.array(setSchema).optional().default([]),
});

export const createWorkoutSchema = z.object({
  date: z.coerce.date({ invalid_type_error: 'Invalid date' }).optional(),
  exercises: z.array(workoutExerciseSchema).optional().default([]),
});

export const updateWorkoutSchema = z.object({
  date: z.coerce.date({ invalid_type_error: 'Invalid date' }).optional(),
  exercises: z.array(workoutExerciseSchema).optional(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
