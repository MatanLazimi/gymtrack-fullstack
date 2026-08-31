import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from './errorHandler.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(', ');
      next(new ApiError(400, message));
      return;
    }
    req.body = result.data;
    next();
  };
}
