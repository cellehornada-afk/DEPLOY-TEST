import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public: Get site settings
router.get('/site', async (req, res) => {
  try {
    const settings = await prisma.siteSettings.findFirst();
    res.json(settings || { contactEmail: '', contactPhone: '', mapEmbedUrl: '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update site settings
router.put('/site', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { contactEmail, contactPhone, mapEmbedUrl } = req.body;
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { contactEmail: contactEmail || '', contactPhone: contactPhone || '', mapEmbedUrl: mapEmbedUrl || '' },
      });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          ...(contactEmail && { contactEmail }),
          ...(contactPhone && { contactPhone }),
          ...(mapEmbedUrl !== undefined && { mapEmbedUrl }),
        },
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get FAQs
router.get('/faq', async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({ orderBy: { order: 'asc' } });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Manage FAQs
router.post('/faq', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    const faq = await prisma.faq.create({
      data: { question, answer, order: order || 0 },
    });
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
