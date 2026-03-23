import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';
import { toDbRole, toApiRole } from '../utils/roles.js';

const router = Router();

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return { ...rest, role: toApiRole(user.role) };
}

// Admin: all users. Landlord: tenants only (for payments/support without exposing admins).
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const where = {};
    if (req.user.role === 'LANDLORD') {
      where.role = 'tenant';
    } else if (role) {
      const dbRole = toDbRole(role);
      if (dbRole) where.role = dbRole;
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const users = await prisma.user.findMany({
      where,
      include: { room: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create user (tenant or landlord — only admin)
router.post('/', authenticate, authorize('ADMIN'), [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  body('password').optional().isLength({ min: 8 }),
  body('role').isIn(['ADMIN', 'LANDLORD', 'TENANT', 'MAINTENANCE']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, phone, password, role, roomId } = req.body;
    const dbRole = toDbRole(role);
    if (!dbRole) return res.status(400).json({ error: 'Invalid role' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const tempPassword = !password;
    const plainPassword = password || Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(plainPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phoneNumber: phone || null,
        password: hashed,
        role: dbRole,
        roomId: dbRole === 'tenant' && roomId ? roomId : null,
        tempPassword,
      },
      include: { room: true },
    });
    await logAudit(req.user.id, 'CREATE_USER', 'User', String(user.id), { email }, req.ip);
    res.status(201).json({
      ...sanitizeUser(user),
      tempPassword: tempPassword ? plainPassword : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update user
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });

    const { name, phone, role, roomId, isActive } = req.body;
    const data = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phoneNumber = phone || null;
    if (role !== undefined) {
      const dbRole = toDbRole(role);
      if (dbRole) data.role = dbRole;
    }
    if (roomId !== undefined) data.roomId = roomId || null;
    if (isActive !== undefined) data.isActive = isActive;

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { room: true },
    });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Reset password
router.post('/:id/reset-password', authenticate, authorize('ADMIN'), [
  body('newPassword').optional().isLength({ min: 8 }),
], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });

    const newPassword = req.body.newPassword || Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashed, tempPassword: true },
    });
    await logAudit(req.user.id, 'RESET_PASSWORD', 'User', String(id), null, req.ip);
    res.json({ tempPassword: newPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Assign room to tenant
router.post('/:id/assign-room', authenticate, authorize('ADMIN'), [
  body('roomId').notEmpty(),
], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid user id' });

    const user = await prisma.user.update({
      where: { id },
      data: { roomId: req.body.roomId },
      include: { room: true },
    });
    await logAudit(req.user.id, 'ASSIGN_ROOM', 'User', String(user.id), { roomId: req.body.roomId }, req.ip);
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
