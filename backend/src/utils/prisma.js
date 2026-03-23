import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * Aiven / cloud MySQL on Windows often fails with "root certificate which is not trusted".
 * URL params alone (sslaccept=accept_invalid_certs) may not disable Node's TLS check for mysql2.
 * Set MYSQL_TLS_INSECURE=true in .env for local dev only — never in production.
 */
if (process.env.MYSQL_TLS_INSECURE === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const prisma = new PrismaClient();

export default prisma;
