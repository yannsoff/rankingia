import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = (req.session as any).authenticated;
  
  // Log authentication status for debugging
  if (!isAuthenticated) {
    console.log('❌ Authentication failed for route:', req.path);
    console.log('   Session ID:', req.sessionID);
    console.log('   Session data:', JSON.stringify(req.session, null, 2));
  }
  
  if (isAuthenticated) {
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

