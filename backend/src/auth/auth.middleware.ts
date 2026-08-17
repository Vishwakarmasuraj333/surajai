import { Request, Response, NextFunction } from 'express';
import { TokenService } from './token.service.js';
import { AuthenticatedRequestUser } from './auth.types.js';
import { AppError } from '../middlewares/errorHandler.js';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: AppError = new Error('Authentication required. Missing Bearer token.');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const payload = TokenService.verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err: any) {
    const error: AppError = new Error('Invalid or expired authentication token.');
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
    next(error);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    const error: AppError = new Error('Access denied. Administrator role required.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    return next(error);
  }
  next();
};
