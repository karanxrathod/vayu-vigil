import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrethackathonkey2026';

export interface AuthUser {
  id: string;
  role: 'citizen' | 'officer' | 'analyst' | 'admin';
  phone?: string;
  email?: string;
  ward_id?: string;
  city_id?: string;
  preferred_language?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Expired or invalid token' });
  }
}

/**
 * Optional Authentication Middleware (for endpoints that serve both public and authenticated users)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

/**
 * Role-Based Access Control Middleware
 * Rejects with 403 if user's role is not in allowedRoles.
 * SECURITY CRITICAL: Officer/admin endpoints reject citizen-role tokens with 403.
 */
export function authorizeRoles(...allowedRoles: ('citizen' | 'officer' | 'analyst' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Access denied for role '${req.user.role}'. Required roles: [${allowedRoles.join(', ')}]` 
      });
      return;
    }

    next();
  };
}

/**
 * Ward Data Isolation Helper
 * Enforces server-side multi-tenant ward filtering.
 * If user is an officer, returns their assigned ward_id.
 * If user is admin or analyst, allows explicit ward_id filter or returns null for all wards.
 */
export function getEnforcedWardId(req: Request, clientWardId?: string): string | undefined {
  if (!req.user) return clientWardId;

  // Officers are strictly restricted to their assigned ward
  if (req.user.role === 'officer' && req.user.ward_id) {
    return req.user.ward_id;
  }

  // Admins, analysts, or citizens can filter by client-requested ward
  return clientWardId || req.user.ward_id;
}
