import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { credentialsSchema } from '../validators/authValidators.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(credentialsSchema), asyncHandler(register));
authRouter.post('/login', validateBody(credentialsSchema), asyncHandler(login));
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, asyncHandler(me));
