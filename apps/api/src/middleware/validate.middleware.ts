import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type ValidationTarget = 'body' | 'query' | 'params';

/** Validate request data against a Zod schema before the route handler runs */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      throw AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details);
    }

    req[target] = result.data;
    next();
  };
}
