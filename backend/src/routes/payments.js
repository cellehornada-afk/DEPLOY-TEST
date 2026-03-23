import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const LATE_FEE_PERCENT = 5;
const LATE_FEE_DAYS = 5;

// Admin: Get all payments
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const { status, userId, month, year } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) {
      const uid = parseInt(userId, 10);
      if (!Number.isNaN(uid)) where.userId = uid;
    }
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    const payments = await prisma.payment.findMany({
      where,
      include: { user: true, room: { include: { building: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant: Get my payments
router.get('/my', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: { room: { include: { building: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create payment record
router.post('/', authenticate, authorize('ADMIN'), [
  body('userId').notEmpty(),
  body('roomId').notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('dueDate').isISO8601(),
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2020 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, roomId, amount, dueDate, month, year } = req.body;
    const payment = await prisma.payment.create({
      data: {
        userId: parseInt(userId, 10),
        roomId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        month: parseInt(month),
        year: parseInt(year),
        status: 'PENDING',
      },
      include: { user: true, room: true },
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Mark as paid
router.put('/:id/paid', authenticate, authorize('ADMIN'), [
  body('method').optional().isString(),
  body('proofUrl').optional().isString(),
], async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        method: req.body.method || null,
        proofUrl: req.body.proofUrl || null,
      },
      include: { user: true, room: true },
    });
    // Create notification for tenant
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: 'Payment Received',
        message: `Your payment of $${payment.amount} for ${payment.month}/${payment.year} has been received.`,
        type: 'payment_received',
      },
    });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant: Upload payment proof (bank transfer)
router.post('/:id/upload-proof', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (payment.status === 'PAID') return res.status(400).json({ error: 'Payment already completed' });

    const { proofUrl } = req.body;
    await prisma.payment.update({
      where: { id: req.params.id },
      data: { proofUrl: proofUrl || null, method: 'bank_transfer' },
    });
    res.json({ message: 'Proof submitted for review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate receipt PDF
router.get('/:id/receipt', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { user: true, room: { include: { building: true } } },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.userId !== req.user.id && !['ADMIN', 'LANDLORD'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (payment.status !== 'PAID') return res.status(400).json({ error: 'Receipt only for paid payments' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt #: ${payment.id}`);
    doc.text(`Date: ${payment.paidDate?.toLocaleDateString() || 'N/A'}`);
    doc.text(`Tenant: ${payment.user.name}`);
    doc.text(`Room: ${payment.room.roomNumber} - ${payment.room.building.name}`);
    doc.text(`Amount: $${payment.amount}`);
    doc.text(`Period: ${payment.month}/${payment.year}`);
    doc.text(`Status: ${payment.status}`);
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron: Update overdue status & calculate late fees
export async function updateOverduePayments() {
  const now = new Date();
  const payments = await prisma.payment.findMany({
    where: { status: 'PENDING' },
    include: { user: true },
  });
  for (const p of payments) {
    const due = new Date(p.dueDate);
    if (now > due) {
      const daysOverdue = Math.floor((now - due) / (24 * 60 * 60 * 1000));
      const lateFee = daysOverdue >= LATE_FEE_DAYS ? p.amount * (LATE_FEE_PERCENT / 100) : null;
      await prisma.payment.update({
        where: { id: p.id },
        data: { status: 'OVERDUE', lateFee },
      });
      await prisma.notification.create({
        data: {
          userId: p.userId,
          title: 'Payment Overdue',
          message: `Your payment of $${p.amount} is overdue. Please pay as soon as possible.`,
          type: 'payment_overdue',
        },
      });
    }
  }
}

export default router;
