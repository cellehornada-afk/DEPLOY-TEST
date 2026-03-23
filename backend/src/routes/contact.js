import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Admin: Unread contact count (must be before /:id routes)
router.get('/unread-count', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const count = await prisma.contactMessage.count({ where: { isRead: false } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const regUploadDir = path.join(__dirname, '../../uploads/registration');
if (!fs.existsSync(regUploadDir)) fs.mkdirSync(regUploadDir, { recursive: true });

const regStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, regUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`),
});
const regUpload = multer({
  storage: regStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// Public: Registration with photo upload
router.post('/register', regUpload.single('photo'), async (req, res) => {
  try {
    const { name, email, phone, address, gender, age, message, accountType } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const photoUrl = req.file ? `/uploads/registration/${req.file.filename}` : null;
    const type = accountType === 'staff' ? 'Staff' : accountType === 'maintenance' ? 'Maintenance' : 'Tenant';
    const subject = `New Account Registration Request - ${type}`;

    const contact = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject,
        message: message?.trim() || '',
        address: address?.trim() || null,
        gender: gender?.trim() || null,
        age: age ? parseInt(age) : null,
        photoUrl,
      },
    });
    res.status(201).json({ message: 'Registration request submitted successfully', id: contact.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Philippine phone: 09XXXXXXXXX (11 digits) or 639XXXXXXXXX (12 with country code)
const isPhPhone = (val) => {
  const d = (val || '').replace(/\D/g, '');
  return (d.length === 11 && /^09[0-9]{9}$/.test(d)) || (d.length === 12 && /^639[0-9]{9}$/.test(d));
};

// Public: Submit contact form
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim().custom((v) => {
    if (!isPhPhone(v)) throw new Error('Phone must be a valid Philippine number (11 digits, e.g. 09XXXXXXXXX)');
    return true;
  }),
  body('subject').notEmpty().trim(),
  body('message').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = errors.array().map(e => e.msg).join('; ');
      return res.status(400).json({ error: msg });
    }

    const { name, email, phone, subject, message } = req.body;
    const contact = await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject, message },
    });
    // Notify all staff and admins
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ['admin', 'landlord', 'maintenance'] }, isActive: true },
      select: { id: true },
    });
    const preview = message.length > 60 ? `${message.slice(0, 60)}...` : message;
    for (const u of staffUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: 'New Contact Message',
          message: `${name} (${email}): ${preview}`,
          type: 'contact_message',
        },
      });
    }
    res.status(201).json({ message: 'Message sent successfully', id: contact.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get contact messages
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Mark as read
router.put('/:id/read', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete contact message (must use router.delete - route order can affect matching)
router.delete('/:id', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    await prisma.contactMessage.delete({
      where: { id },
    });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Message not found' });
    console.error('Delete contact error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete message' });
  }
});

export default router;
