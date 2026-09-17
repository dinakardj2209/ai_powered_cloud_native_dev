import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_PERMISSIONS } from '@devflow/shared';
import { AppError } from '../utils/AppError';

/** Require the authenticated user to have one of the specified roles */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden(
        `This action requires one of the following roles: ${roles.join(', ')}`,
        'INSUFFICIENT_ROLE',
      );
    }

    next();
  };
}

/** Require the authenticated user to have a specific permission */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] ?? [];

    if (!userPermissions.includes(permission)) {
      throw AppError.forbidden(
        `Missing required permission: ${permission}`,
        'INSUFFICIENT_PERMISSION',
      );
    }

    next();
  };
}
