import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@devflow/shared';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Access token required');
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    throw AppError.unauthorized('Invalid or expired access token', 'TOKEN_EXPIRED');
  }
}

/** Optional auth — attaches user if token present, continues otherwise */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
    req.user = decoded;
  } catch {
    // Invalid token on optional routes — ignore
  }

  next();
}
