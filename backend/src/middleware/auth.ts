import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

/**
 * Middleware to check if user is authenticated via JWT
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('❌ Authentication failed for route:', req.path);
      console.log('   Reason: No token provided');
      console.log('   Headers:', JSON.stringify({
        authorization: req.headers.authorization,
        origin: req.headers.origin,
        'content-type': req.headers['content-type']
      }, null, 2));
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    if (!payload || !payload.authenticated) {
      console.log('❌ Authentication failed for route:', req.path);
      console.log('   Reason: Invalid or expired token');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Token is valid, proceed
    console.log('✅ Authentication successful for route:', req.path);
    return next();
    
  } catch (error) {
    console.error('❌ Authentication error for route:', req.path);
    console.error('   Error:', error);
    return res.status(401).json({ error: 'Authentication required' });
  }
};

