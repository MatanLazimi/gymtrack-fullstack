import { ApiError } from '../middleware/errorHandler.js';
import { WorkoutModel, type Workout } from '../models/Workout.js';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '../validators/workoutValidators.js';

export interface PreviousPerformance {
  date: Date;
  exerciseName: string;
  sets: Workout['exercises'][number]['sets'];
}

export async function getPreviousPerformance(
  userId: string,
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<PreviousPerformance | null> {
  const filter: Record<string, unknown> = {
    userId,
    exercises: { $elemMatch: { exerciseId, 'sets.0': { $exists: true } } },
  };
  if (excludeWorkoutId) {
    filter._id = { $ne: excludeWorkoutId };
  }

  const workout = await WorkoutModel.findOne(filter).sort({ date: -1 }).lean<Workout | null>();
  if (!workout) {
    return null;
  }

  const match = workout.exercises.find(
    (exercise) => exercise.exerciseId.toString() === exerciseId && exercise.sets.length > 0,
  );
  return match ? { date: workout.date, exerciseName: match.exerciseName, sets: match.sets } : null;
}

export function listWorkouts(userId: string): Promise<Workout[]> {
  return WorkoutModel.find({ userId }).sort({ date: -1 }).lean<Workout[]>();
}

export async function getWorkout(userId: string, id: string): Promise<Workout> {
  const workout = await WorkoutModel.findOne({ _id: id, userId }).lean<Workout | null>();
  if (!workout) {
    throw new ApiError(404, 'Workout not found');
  }
  return workout;
}

export async function createWorkout(userId: string, input: CreateWorkoutInput): Promise<Workout> {
  const workout = await WorkoutModel.create({
    userId,
    date: input.date ?? new Date(),
    exercises: input.exercises,
  });
  return workout.toObject();
}

export async function updateWorkout(userId: string, id: string, input: UpdateWorkoutInput): Promise<Workout> {
  const workout = await WorkoutModel.findOneAndUpdate({ _id: id, userId }, input, { new: true }).lean<Workout | null>();
  if (!workout) {
    throw new ApiError(404, 'Workout not found');
  }
  return workout;
}

export async function deleteWorkout(userId: string, id: string): Promise<void> {
  const result = await WorkoutModel.findOneAndDelete({ _id: id, userId });
  if (!result) {
    throw new ApiError(404, 'Workout not found');
  }
}
