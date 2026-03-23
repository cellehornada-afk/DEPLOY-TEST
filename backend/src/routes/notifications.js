import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get my notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly, type } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;
    if (type) where.type = type;
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const where = { userId: req.user.id, isRead: false };
    if (type) where.type = type;
    const count = await prisma.notification.count({ where });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
