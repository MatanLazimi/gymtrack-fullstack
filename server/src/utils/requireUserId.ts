import type { Request } from 'express';
import { ApiError } from '../middleware/errorHandler.js';

export function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new ApiError(401, 'Authentication required');
  }
  return req.userId;
}
