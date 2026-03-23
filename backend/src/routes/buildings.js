import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public: Get all buildings
router.get('/', async (req, res) => {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        rooms: {
          where: { isAvailable: true },
          select: { id: true, roomNumber: true, capacity: true, monthlyRent: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const parsed = buildings.map(b => ({
      ...b,
      facilities: JSON.parse(b.facilities || '[]'),
      images: JSON.parse(b.images || '[]'),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get single building
router.get('/:id', async (req, res) => {
  try {
    const building = await prisma.building.findUnique({
      where: { id: req.params.id },
      include: {
        rooms: {
          where: { isAvailable: true },
        },
      },
    });
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json({
      ...building,
      facilities: JSON.parse(building.facilities || '[]'),
      images: JSON.parse(building.images || '[]'),
      rooms: building.rooms.map(r => ({
        ...r,
        amenities: JSON.parse(r.amenities || '[]'),
        images: JSON.parse(r.images || '[]'),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create building
router.post('/', authenticate, authorize('ADMIN'), [
  body('name').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('facilities').optional().isArray(),
  body('images').optional().isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, address, description, facilities, images } = req.body;
    const building = await prisma.building.create({
      data: {
        name,
        address,
        description: description || null,
        facilities: JSON.stringify(facilities || []),
        images: JSON.stringify(images || []),
      },
    });
    res.status(201).json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update building
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, address, description, facilities, images } = req.body;
    const building = await prisma.building.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(description !== undefined && { description }),
        ...(facilities && { facilities: JSON.stringify(facilities) }),
        ...(images && { images: JSON.stringify(images) }),
      },
    });
    res.json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete building
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.building.delete({ where: { id: req.params.id } });
    res.json({ message: 'Building deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
