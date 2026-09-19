import type { Request, Response } from 'express';
import * as routineService from '../services/routineService.js';
import { requireUserId } from '../utils/requireUserId.js';

export async function list(req: Request, res: Response): Promise<void> {
  const routines = await routineService.listRoutines(requireUserId(req));
  res.json({ routines });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const routine = await routineService.getRoutine(requireUserId(req), req.params.id);
  res.json({ routine });
}

export async function create(req: Request, res: Response): Promise<void> {
  const routine = await routineService.createRoutine(requireUserId(req), req.body);
  res.status(201).json({ routine });
}

export async function update(req: Request, res: Response): Promise<void> {
  const routine = await routineService.updateRoutine(requireUserId(req), req.params.id, req.body);
  res.json({ routine });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await routineService.deleteRoutine(requireUserId(req), req.params.id);
  res.status(204).send();
}
