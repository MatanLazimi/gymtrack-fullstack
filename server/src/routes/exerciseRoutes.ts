import { Router } from 'express';
import * as exerciseController from '../controllers/exerciseController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody, validateObjectIdParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createExerciseSchema, updateExerciseSchema } from '../validators/exerciseValidators.js';

export const exerciseRouter = Router();

exerciseRouter.use(requireAuth);

exerciseRouter.get('/', asyncHandler(exerciseController.list));
exerciseRouter.post('/', validateBody(createExerciseSchema), asyncHandler(exerciseController.create));
exerciseRouter.get('/:id', validateObjectIdParam('id'), asyncHandler(exerciseController.getById));
exerciseRouter.get('/:id/history', validateObjectIdParam('id'), asyncHandler(exerciseController.history));
exerciseRouter.put(
  '/:id',
  validateObjectIdParam('id'),
  validateBody(updateExerciseSchema),
  asyncHandler(exerciseController.update),
);
exerciseRouter.delete('/:id', validateObjectIdParam('id'), asyncHandler(exerciseController.remove));
