import { Router } from 'express';
import * as workoutController from '../controllers/workoutController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody, validateObjectIdParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createWorkoutSchema, updateWorkoutSchema } from '../validators/workoutValidators.js';

export const workoutRouter = Router();

workoutRouter.use(requireAuth);

workoutRouter.get('/', asyncHandler(workoutController.list));
workoutRouter.post('/', validateBody(createWorkoutSchema), asyncHandler(workoutController.create));
workoutRouter.get('/:id', validateObjectIdParam('id'), asyncHandler(workoutController.getById));
workoutRouter.put(
  '/:id',
  validateObjectIdParam('id'),
  validateBody(updateWorkoutSchema),
  asyncHandler(workoutController.update),
);
workoutRouter.delete('/:id', validateObjectIdParam('id'), asyncHandler(workoutController.remove));
