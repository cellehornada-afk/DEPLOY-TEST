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

// FIX: Switched from diskStorage to memoryStorage for Vercel compatibility
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

function parseRoom(room) {
  return {
    ...room,
    amenities: JSON.parse(room.amenities || '[]'),
    images: JSON.parse(room.images || '[]'),
  };
}

// Public: Search rooms
router.get('/search', async (req, res) => {
  try {
    const { buildingId, capacity, minPrice, maxPrice, available } = req.query;
    const where = { isAvailable: available !== 'false' };
    if (buildingId) where.buildingId = buildingId;
    if (capacity) where.capacity = parseInt(capacity);
    if (minPrice || maxPrice) {
      where.monthlyRent = {};
      if (minPrice) where.monthlyRent.gte = parseFloat(minPrice);
      if (maxPrice) where.monthlyRent.lte = parseFloat(maxPrice);
    }
    const rooms = await prisma.room.findMany({
      where,
      include: { building: true },
      orderBy: [{ buildingId: 'asc' }, { roomNumber: 'asc' }],
    });
    res.json(rooms.map(parseRoom));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { building: true },
      orderBy: [{ buildingId: 'asc' }, { roomNumber: 'asc' }],
    });
    res.json(rooms.map(parseRoom));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get single room
router.get('/:id', async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { building: true },
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create room
router.post('/', authenticate, authorize('ADMIN'), [
  body('buildingId').notEmpty(),
  body('roomNumber').notEmpty(),
  body('capacity').isInt({ min: 1, max: 10 }),
  body('monthlyRent').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { buildingId, roomNumber, floor, capacity, monthlyRent, amenities, description } = req.body;
    const room = await prisma.room.create({
      data: {
        buildingId,
        roomNumber,
        floor: floor ? parseInt(floor) : null,
        capacity: parseInt(capacity),
        monthlyRent: parseFloat(monthlyRent),
        amenities: JSON.stringify(amenities || []),
        images: JSON.stringify(req.body.images || []),
        description: description || null,
      },
    });
    res.status(201).json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update room
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { roomNumber, floor, capacity, monthlyRent, amenities, images, description, isAvailable, maintenanceMode } = req.body;
    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: {
        ...(roomNumber && { roomNumber }),
        ...(floor !== undefined && { floor: parseInt(floor) }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(monthlyRent !== undefined && { monthlyRent: parseFloat(monthlyRent) }),
        ...(amenities && { amenities: JSON.stringify(amenities) }),
        ...(images && { images: JSON.stringify(images) }),
        ...(description !== undefined && { description }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
      },
    });
    res.json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Upload room images 
// NOTE: req.files now contains buffers. You must upload these to a Cloud provider.
router.post('/:id/images', authenticate, authorize('ADMIN'), upload.array('images', 10), async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Placeholder: On Vercel, you'd send req.files to Cloudinary/S3 here
    // For now, this logic is kept so it doesn't crash, but won't save local paths
    res.status(200).json({ message: "Upload received in memory. Connect Cloudinary to save permanently." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Bulk import rooms (CSV)
// FIX: Using memory storage for CSV import
router.post('/bulk-import', authenticate, authorize('ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const { parse } = await import('csv-parse/sync');
    
    // Read from buffer instead of file path
    const content = req.file.buffer.toString('utf-8');
    const rows = parse(content, { columns: true, skip_empty_lines: true });
    
    const created = [];
    for (const row of rows) {
      const room = await prisma.room.create({
        data: {
          buildingId: row.buildingId,
          roomNumber: row.roomNumber,
          floor: row.floor ? parseInt(row.floor) : null,
          capacity: parseInt(row.capacity) || 1,
          monthlyRent: parseFloat(row.monthlyRent) || 0,
          amenities: JSON.stringify((row.amenities || '').split(',').map(a => a.trim()).filter(Boolean)),
          images: JSON.stringify([]),
        },
      });
      created.push(room);
    }
    res.json({ message: `Imported ${created.length} rooms`, rooms: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete room
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
