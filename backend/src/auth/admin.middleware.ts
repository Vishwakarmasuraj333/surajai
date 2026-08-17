import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  }

  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin role privilege required.' },
    });
  }

  next();
};
