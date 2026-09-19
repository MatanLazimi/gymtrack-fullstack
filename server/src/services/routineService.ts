import { ApiError } from '../middleware/errorHandler.js';
import { RoutineModel, type Routine } from '../models/Routine.js';
import type { CreateRoutineInput, UpdateRoutineInput } from '../validators/routineValidators.js';

export function listRoutines(userId: string): Promise<Routine[]> {
  return RoutineModel.find({ userId }).sort({ name: 1 }).lean<Routine[]>();
}

export async function getRoutine(userId: string, id: string): Promise<Routine> {
  const routine = await RoutineModel.findOne({ _id: id, userId }).lean<Routine | null>();
  if (!routine) {
    throw new ApiError(404, 'Routine not found');
  }
  return routine;
}

export async function createRoutine(userId: string, input: CreateRoutineInput): Promise<Routine> {
  const routine = await RoutineModel.create({
    userId,
    name: input.name,
    exercises: input.exercises,
  });
  return routine.toObject();
}

export async function updateRoutine(userId: string, id: string, input: UpdateRoutineInput): Promise<Routine> {
  const routine = await RoutineModel.findOneAndUpdate({ _id: id, userId }, input, { new: true }).lean<Routine | null>();
  if (!routine) {
    throw new ApiError(404, 'Routine not found');
  }
  return routine;
}

export async function deleteRoutine(userId: string, id: string): Promise<void> {
  const result = await RoutineModel.findOneAndDelete({ _id: id, userId });
  if (!result) {
    throw new ApiError(404, 'Routine not found');
  }
}
