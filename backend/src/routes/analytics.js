import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Admin: Get analytics
router.get('/', authenticate, authorize('ADMIN', 'LANDLORD'), async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month ? parseInt(month) : null;

    const paymentsWhere = { year: y, status: 'PAID' };
    if (m) paymentsWhere.month = m;

    const allPayments = await prisma.payment.findMany({
      where: { status: 'PAID' },
    });

    const totalPaid = allPayments.filter(p => p.year === y && (!m || p.month === m)).reduce((s, p) => s + p.amount, 0);
    const totalRevenue = allPayments.reduce((s, p) => s + p.amount, 0);

    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.user.count({ where: { roomId: { not: null }, role: 'tenant' } });
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const overdueCount = await prisma.payment.count({ where: { status: 'OVERDUE' } });
    const pendingCount = await prisma.payment.count({ where: { status: 'PENDING' } });

    const monthlyData = [];
    for (let i = 1; i <= 12; i++) {
      const monthTotal = allPayments.filter(p => p.year === y && p.month === i).reduce((s, p) => s + p.amount, 0);
      monthlyData.push({ month: i, year: y, revenue: monthTotal });
    }

    const buildingStats = await prisma.building.findMany({
      include: {
        rooms: true,
        _count: { select: { rooms: true } },
      },
    });

    res.json({
      totalIncome: totalPaid,
      yearlyRevenue: totalRevenue,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      vacantRooms: totalRooms - occupiedRooms,
      occupancyCount: occupiedRooms,
      totalRooms,
      overduePayments: overdueCount,
      pendingPayments: pendingCount,
      monthlyRevenue: monthlyData,
      buildingStats: buildingStats.map(b => ({
        id: b.id,
        name: b.name,
        roomCount: b._count.rooms,
        rooms: b.rooms,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
