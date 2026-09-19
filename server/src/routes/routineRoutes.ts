import { Router } from 'express';
import * as routineController from '../controllers/routineController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody, validateObjectIdParam } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createRoutineSchema, updateRoutineSchema } from '../validators/routineValidators.js';

export const routineRouter = Router();

routineRouter.use(requireAuth);

routineRouter.get('/', asyncHandler(routineController.list));
routineRouter.post('/', validateBody(createRoutineSchema), asyncHandler(routineController.create));
routineRouter.get('/:id', validateObjectIdParam('id'), asyncHandler(routineController.getById));
routineRouter.put(
  '/:id',
  validateObjectIdParam('id'),
  validateBody(updateRoutineSchema),
  asyncHandler(routineController.update),
);
routineRouter.delete('/:id', validateObjectIdParam('id'), asyncHandler(routineController.remove));
