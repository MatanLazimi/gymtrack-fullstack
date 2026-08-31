import { ApiError } from '../middleware/errorHandler.js';
import { ExerciseModel, type Exercise } from '../models/Exercise.js';
import type { CreateExerciseInput, UpdateExerciseInput } from '../validators/exerciseValidators.js';

export function listExercises(): Promise<Exercise[]> {
  return ExerciseModel.find().sort({ name: 1 }).lean<Exercise[]>();
}

export async function getExercise(id: string): Promise<Exercise> {
  const exercise = await ExerciseModel.findById(id).lean<Exercise | null>();
  if (!exercise) {
    throw new ApiError(404, 'Exercise not found');
  }
  return exercise;
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const exercise = await ExerciseModel.create(input);
  return exercise.toObject();
}

export async function updateExercise(id: string, input: UpdateExerciseInput): Promise<Exercise> {
  const exercise = await ExerciseModel.findByIdAndUpdate(id, input, { new: true }).lean<Exercise | null>();
  if (!exercise) {
    throw new ApiError(404, 'Exercise not found');
  }
  return exercise;
}

export async function deleteExercise(id: string): Promise<void> {
  const result = await ExerciseModel.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(404, 'Exercise not found');
  }
}
