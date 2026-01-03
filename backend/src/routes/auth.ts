import { Router, Request, Response } from 'express';
import { generateToken, verifyToken, extractTokenFromHeader } from '../utils/jwt';

const router = Router();

/**
 * POST /api/auth/login
 * Simple password authentication with JWT
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    console.log('🔐 Login attempt...');
    
    if (!password) {
      console.log('❌ Login failed: No password provided');
      return res.status(400).json({ error: 'Password required' });
    }
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD not configured in environment');
      return res.status(500).json({ error: 'Admin password not configured' });
    }
    
    // Simple comparison (in production, use hashed passwords)
    if (password === adminPassword) {
      // Generate JWT token
      const token = generateToken();
      
      console.log('✅ Login successful, JWT token generated');
      
      return res.json({
        success: true,
        message: 'Authentication successful',
        token // Send token to client
      });
    }
    
    console.log('❌ Login failed: Invalid password');
    return res.status(401).json({ error: 'Invalid password' });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side will remove token)
 */
router.post('/logout', (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  // No server-side action needed
  console.log('👋 Logout request received');
  return res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/status
 * Check authentication status by verifying JWT
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('ℹ️ Auth status check: No token provided');
      return res.json({
        authenticated: false,
        loginTime: null
      });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      console.log('ℹ️ Auth status check: Invalid token');
      return res.json({
        authenticated: false,
        loginTime: null
      });
    }
    
    console.log('✅ Auth status check: Valid token');
    return res.json({
      authenticated: payload.authenticated,
      loginTime: payload.loginTime
    });
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    return res.json({
      authenticated: false,
      loginTime: null
    });
  }
});

export default router;

