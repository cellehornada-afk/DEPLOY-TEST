import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { toApiRole } from '../utils/roles.js';
import { getLoginLockStatus, recordLoginFailure, clearLoginFailures } from '../utils/loginLockout.js';

const router = Router();

const generateToken = (userId) => jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toApiRole(user.role),
    room: user.roomId ? { id: user.roomId } : null,
  };
}

// Login
router.post('/login', [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '').trim();

    const lock = getLoginLockStatus(email);
    if (lock.locked) {
      const m = Math.ceil(lock.retryAfterSeconds / 60);
      const s = lock.retryAfterSeconds % 60;
      const timeHint = m > 0
        ? `${m} minute${m === 1 ? '' : 's'}${s > 0 ? ` ${s}s` : ''}`
        : `${s} seconds`;
      return res.status(429).json({
        error: `Too many failed login attempts. Wait ${timeHint} before trying again.`,
        retryAfterSeconds: lock.retryAfterSeconds,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // NULL is_active must not block login (MySQL / legacy rows); only explicit false does.
    if (!user || user.isActive === false) {
      recordLoginFailure(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      recordLoginFailure(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    clearLoginFailures(email);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    await logAudit(user.id, 'LOGIN', 'User', String(user.id), null, req.ip);

    res.json({
      user: publicUser(user),
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    room: u.room,
    roomId: u.roomId,
  });
});

// Change password
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hash, tempPassword: false },
    });
    await logAudit(req.user.id, 'PASSWORD_CHANGE', 'User', String(req.user.id), null, req.ip);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
