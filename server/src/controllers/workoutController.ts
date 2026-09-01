import type { Request, Response } from 'express';
import * as workoutService from '../services/workoutService.js';
import { ApiError } from '../middleware/errorHandler.js';

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new ApiError(401, 'Authentication required');
  }
  return req.userId;
}

export async function list(req: Request, res: Response): Promise<void> {
  const workouts = await workoutService.listWorkouts(requireUserId(req));
  res.json({ workouts });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const workout = await workoutService.getWorkout(requireUserId(req), req.params.id);
  res.json({ workout });
}

export async function create(req: Request, res: Response): Promise<void> {
  const workout = await workoutService.createWorkout(requireUserId(req), req.body);
  res.status(201).json({ workout });
}

export async function update(req: Request, res: Response): Promise<void> {
  const workout = await workoutService.updateWorkout(requireUserId(req), req.params.id, req.body);
  res.json({ workout });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await workoutService.deleteWorkout(requireUserId(req), req.params.id);
  res.status(204).send();
}
