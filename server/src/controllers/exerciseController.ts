import type { Request, Response } from 'express';
import * as exerciseService from '../services/exerciseService.js';
import * as workoutService from '../services/workoutService.js';
import { requireUserId } from '../utils/requireUserId.js';

export async function list(_req: Request, res: Response): Promise<void> {
  const exercises = await exerciseService.listExercises();
  res.json({ exercises });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const exercise = await exerciseService.getExercise(req.params.id);
  res.json({ exercise });
}

export async function create(req: Request, res: Response): Promise<void> {
  const exercise = await exerciseService.createExercise(req.body);
  res.status(201).json({ exercise });
}

export async function update(req: Request, res: Response): Promise<void> {
  const exercise = await exerciseService.updateExercise(req.params.id, req.body);
  res.json({ exercise });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await exerciseService.deleteExercise(req.params.id);
  res.status(204).send();
}

export async function history(req: Request, res: Response): Promise<void> {
  const excludeWorkoutId = typeof req.query.excludeWorkoutId === 'string' ? req.query.excludeWorkoutId : undefined;
  const previousPerformance = await workoutService.getPreviousPerformance(
    requireUserId(req),
    req.params.id,
    excludeWorkoutId,
  );
  res.json({ previousPerformance });
}
