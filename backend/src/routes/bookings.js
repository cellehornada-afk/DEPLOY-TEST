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

const uploadDir = path.join(__dirname, '../../uploads/bookings');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

// Public: Create booking
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  body('roomId').notEmpty(),
  body('checkInDate').isISO8601(),
  body('checkOutDate').isISO8601(),
  body('bookingFee').isFloat({ min: 0 }),
], upload.single('paymentProof'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, name, phone, roomId, checkInDate, checkOutDate, bookingFee } = req.body;
    const paymentProof = req.file ? `/uploads/bookings/${req.file.filename}` : null;

    const booking = await prisma.booking.create({
      data: {
        email,
        name,
        phone: phone || null,
        roomId,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        bookingFee: parseFloat(bookingFee),
        paymentProof,
      },
      include: { room: { include: { building: true } } },
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all bookings
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const bookings = await prisma.booking.findMany({
      where,
      include: { room: { include: { building: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update booking status
router.put('/:id', authenticate, authorize('ADMIN'), [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
  body('adminNotes').optional().trim(),
], async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status, adminNotes: adminNotes || null },
      include: { room: true },
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
