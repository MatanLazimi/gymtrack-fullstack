import { Types } from 'mongoose';
import { z } from 'zod';

const objectIdString = z.string().refine((value) => Types.ObjectId.isValid(value), 'Invalid id');

export const routineExerciseSchema = z.object({
  exerciseId: objectIdString,
  exerciseName: z.string().trim().min(1, 'exerciseName is required'),
});

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  exercises: z.array(routineExerciseSchema).min(1, 'at least one exercise is required'),
});

export const updateRoutineSchema = z.object({
  name: z.string().trim().min(1, 'name is required').optional(),
  exercises: z.array(routineExerciseSchema).min(1, 'at least one exercise is required').optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
