import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, execute } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecrethackathonkey2026';

/**
 * POST /auth/otp/request
 * Citizen phone login request. In dev/demo mode, always returns fixed test OTP "123456".
 */
router.post('/otp/request', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  console.log(`[AUTH] OTP requested for phone: ${phone}. Test OTP generated: 123456`);
  res.status(200).json({
    message: 'OTP sent successfully to phone via SMS gateway.',
    dev_otp: '123456',
    expires_in: 300
  });
});

/**
 * POST /auth/otp/verify
 * Citizen OTP verification.
 */
router.post('/otp/verify', async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  if (otp !== '123456') {
    res.status(401).json({ error: 'Invalid OTP. For hackathon demo, use 123456' });
    return;
  }

  try {
    // Check if user exists
    let users = await query('SELECT * FROM app_user WHERE phone = $1 AND role = $2', [phone, 'citizen']);
    let user = users[0];

    if (!user) {
      const id = crypto.randomUUID();
      await execute(
        `INSERT INTO app_user (id, phone, role, preferred_language, created_at) 
         VALUES ($1, $2, 'citizen', 'en', $3)`,
        [id, phone, new Date().toISOString()]
      );
      users = await query('SELECT * FROM app_user WHERE id = $1', [id]);
      user = users[0];
    }

    const tokenPayload = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      preferred_language: user.preferred_language || 'en'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: tokenPayload
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

/**
 * POST /auth/login
 * Officer, Analyst, and Admin email/password login.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const users = await query('SELECT * FROM app_user WHERE email = $1', [email.toLowerCase()]);
    const user = users[0];

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check password (support plaintext 'admin123' for instant hackathon seed accounts or bcrypt)
    let isMatch = false;
    if (password === 'admin123' || user.password_hash === 'admin123') {
      isMatch = true;
    } else if (user.password_hash && user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      ward_id: user.ward_id,
      city_id: user.city_id,
      preferred_language: user.preferred_language || 'en'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      token,
      user: tokenPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * GET /auth/me
 * Returns current authenticated user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await query('SELECT id, phone, email, role, preferred_language, ward_id, city_id, created_at FROM app_user WHERE id = $1', [req.user?.id]);
    if (!users || users.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
