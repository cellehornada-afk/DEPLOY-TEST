import prisma from './prisma.js';

export async function logAudit(userId, action, entity, entityId, details = null, ipAddress = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
