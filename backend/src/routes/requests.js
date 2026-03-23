import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/requests');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// Tenant: Submit maintenance request
router.post('/', authenticate, [
  body('roomId').notEmpty(),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
], upload.single('image'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { roomId, title, description } = req.body;
    const imageUrl = req.file ? `/uploads/requests/${req.file.filename}` : null;

    const request = await prisma.maintenanceRequest.create({
      data: {
        userId: req.user.id,
        roomId,
        title,
        description,
        imageUrl,
      },
      include: { room: { include: { building: true } } },
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant: Get my requests
router.get('/my', authenticate, async (req, res) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { userId: req.user.id },
      include: { room: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all requests
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD', 'MAINTENANCE'), async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: { user: true, room: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update request (approve/reject/complete) or reply-only
router.put('/:id', authenticate, authorize('ADMIN', 'LANDLORD', 'MAINTENANCE'), [
  body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
  body('adminReply').optional().trim(),
], async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const id = req.params.id;

    // Reply-only: update adminReply and notify, keep current status
    if (adminReply && !status) {
      const request = await prisma.maintenanceRequest.update({
        where: { id },
        data: { adminReply },
        include: { user: true, room: true },
      });
      await prisma.notification.create({
        data: {
          userId: request.userId,
          title: 'Maintenance Update',
          message: adminReply,
          type: 'request_reply',
        },
      });
      return res.json(request);
    }

    // Status update
    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status,
        adminReply: adminReply || null,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: { user: true, room: true },
    });

    const msg = status === 'APPROVED' ? 'Your maintenance request has been approved.' :
      status === 'REJECTED' ? 'Your maintenance request was rejected.' :
      status === 'COMPLETED' ? 'Your maintenance request has been completed.' : '';
    if (msg) {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          title: `Request ${status}`,
          message: adminReply ? `${msg} Admin: ${adminReply}` : msg,
          type: `request_${status.toLowerCase()}`,
        },
      });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
