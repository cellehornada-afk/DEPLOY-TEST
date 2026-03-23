/** Map Prisma UserRole (DB) to API responses (uppercase). */
export function toApiRole(role) {
  const map = {
    admin: 'ADMIN',
    landlord: 'LANDLORD',
    tenant: 'TENANT',
    maintenance: 'MAINTENANCE',
  };
  return map[role] || role;
}

/** Map client/API role strings to Prisma enum values. */
export function toDbRole(apiRole) {
  if (!apiRole) return undefined;
  const r = String(apiRole).toUpperCase();
  const map = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    TENANT: 'tenant',
    MAINTENANCE: 'maintenance',
  };
  return map[r];
}
