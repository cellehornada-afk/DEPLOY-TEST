/**
 * Print a bcrypt hash for use in SQL or debugging.
 * Usage (from backend folder): node scripts/hash-password.mjs yourPassword
 */
import bcrypt from 'bcryptjs';

const pwd = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(pwd, 12);
console.log(hash);
console.log('\nMySQL example:\n  UPDATE users SET password = \'' + hash.replace(/'/g, "''") + '\' WHERE email = \'you@example.com\';');
