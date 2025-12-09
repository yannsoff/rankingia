import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if ((req.session as any).authenticated) {
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

