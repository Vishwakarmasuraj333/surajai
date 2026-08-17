import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Check for Prisma Database Initialization / Connection Errors
  if (err.name === 'PrismaClientInitializationError' || (err.message && err.message.includes('Authentication failed against database server'))) {
    statusCode = 503;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Database server connection failed. Please check DATABASE_URL in .env configuration.';
  }

  // Handle 401 Unauthorized cleanly without dumping heavy stack traces for unauthenticated visitors
  if (statusCode === 401) {
    logger.warn(`[API Auth Warning] ${code}: ${message}`);
  } else {
    logger.error(`[API Error] ${code} (${statusCode}): ${message}`, {
      stack: err.stack,
      details: err.details,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
    },
  });
};

