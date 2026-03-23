/**
 * Brute-force mitigation: after MAX wrong attempts for an email, block further tries for LOCKOUT_MS.
 * In-memory only (clears on server restart). Key = normalized email.
 *
 * Env (optional):
 *   LOGIN_MAX_FAILURES   default 5
 *   LOGIN_LOCKOUT_MINUTES default 3
 */

const MAX_FAILURES = Math.max(1, parseInt(process.env.LOGIN_MAX_FAILURES || '5', 10));
const LOCK_MS = Math.max(60000, parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '3', 10) * 60 * 1000);

const store = new Map();

export function getLoginLockoutConfig() {
  return { maxFailures: MAX_FAILURES, lockoutMinutes: LOCK_MS / 60000 };
}

export function getLoginLockStatus(email) {
  const key = String(email ?? '').trim().toLowerCase();
  if (!key) return { locked: false };
  const now = Date.now();
  const rec = store.get(key);
  if (!rec) return { locked: false };
  if (rec.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
    };
  }
  if (rec.lockedUntil && rec.lockedUntil <= now) {
    store.delete(key);
  }
  return { locked: false };
}

/** Call after a failed password / invalid credentials for this email. */
export function recordLoginFailure(email) {
  const key = String(email ?? '').trim().toLowerCase();
  if (!key) return;
  const now = Date.now();
  let rec = store.get(key) || { failures: 0, lockedUntil: 0 };
  if (rec.lockedUntil > now) return;
  rec.failures += 1;
  if (rec.failures >= MAX_FAILURES) {
    rec.lockedUntil = now + LOCK_MS;
    rec.failures = 0;
  }
  store.set(key, rec);
}

export function clearLoginFailures(email) {
  const key = String(email ?? '').trim().toLowerCase();
  if (key) store.delete(key);
}
