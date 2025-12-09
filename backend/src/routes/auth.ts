import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/auth/login
 * Simple password authentication
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }
    
    // Simple comparison (in production, use hashed passwords)
    if (password === adminPassword) {
      (req.session as any).authenticated = true;
      (req.session as any).loginTime = new Date().toISOString();
      
      return res.json({
        success: true,
        message: 'Authentication successful'
      });
    }
    
    return res.status(401).json({ error: 'Invalid password' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    authenticated: (req.session as any).authenticated || false,
    loginTime: (req.session as any).loginTime || null
  });
});

export default router;

