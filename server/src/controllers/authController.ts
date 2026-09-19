import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../middleware/requireAuth.js';
import { loginUser, registerUser } from '../services/authService.js';
import { UserModel } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';

const IS_PRODUCTION = env.nodeEnv === 'production';

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  // Frontend and backend are deployed on different origins in production, so the cookie must be
  // sent cross-site. `SameSite=None` requires `Secure`, which is only set once we're on HTTPS.
  sameSite: IS_PRODUCTION ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response): Promise<void> {
  const { token, user } = await registerUser(req.body);
  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { token, user } = await loginUser(req.body);
  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(200).json({ user });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, COOKIE_OPTIONS);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  res.json({ user: { id: user.id, email: user.email } });
}
