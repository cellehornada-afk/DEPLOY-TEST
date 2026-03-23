import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Tenant: Get their chat messages
router.get('/', authenticate, authorize('TENANT'), async (req, res) => {
  try {
    const messages = await prisma.supportChat.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant: Send a message
router.post('/', authenticate, authorize('TENANT'), [
  body('message').notEmpty().trim().isLength({ max: 2000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message } = req.body;
    const chat = await prisma.supportChat.create({
      data: {
        userId: req.user.id,
        message,
        senderRole: 'TENANT',
      },
    });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/Staff: Reply to tenant (userId in body)
router.post('/reply', authenticate, authorize('ADMIN', 'LANDLORD', 'MAINTENANCE'), [
  body('userId').notEmpty(),
  body('message').notEmpty().trim().isLength({ max: 2000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, message } = req.body;
    const uid = parseInt(userId, 10);
    if (Number.isNaN(uid)) return res.status(400).json({ error: 'Invalid user id' });
    const chat = await prisma.supportChat.create({
      data: {
        userId: uid,
        message,
        senderRole: req.user.role === 'LANDLORD' ? 'LANDLORD' : req.user.role === 'MAINTENANCE' ? 'MAINTENANCE' : 'ADMIN',
      },
    });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
