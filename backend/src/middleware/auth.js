import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { toApiRole } from '../utils/roles.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawId = decoded.userId;
    const userId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { room: { include: { building: true } } },
    });
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: 'Invalid or inactive account' });
    }
    req.user = { ...user, role: toApiRole(user.role) };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};
