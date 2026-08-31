import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/authService.js';
import { ApiError } from './errorHandler.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

const COOKIE_NAME = 'gymtrack_token';
export const AUTH_COOKIE_NAME = COOKIE_NAME;

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    next(new ApiError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired session'));
  }
}
