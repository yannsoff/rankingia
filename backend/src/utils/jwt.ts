import jwt from 'jsonwebtoken';

// Get JWT secret from environment or use default (change in production)
const JWT_SECRET = process.env.JWT_SECRET || 'ovb-ranklist-jwt-secret-change-this-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours

/**
 * Interface for JWT payload
 */
export interface JWTPayload {
  authenticated: boolean;
  loginTime: string;
}

/**
 * Generate a JWT token
 */
export const generateToken = (): string => {
  const payload: JWTPayload = {
    authenticated: true,
    loginTime: new Date().toISOString()
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify and decode a JWT token
 * Returns the payload if valid, null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};

/**
 * Extract token from Authorization header
 * Supports both "Bearer <token>" and direct token
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  // Check if it's in "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Otherwise, treat the entire header as the token
  return authHeader;
};

