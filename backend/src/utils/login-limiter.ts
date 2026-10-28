const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

const attempts = new Map<string, { count: number; lockedUntil: number }>();

export const limiterKey = (ip: string | undefined, username: string) =>
  `${ip ?? 'unknown'}|${username.toLowerCase()}`;

export function lockMinutesLeft(key: string): number {
  const a = attempts.get(key);
  if (!a || a.lockedUntil <= Date.now()) return 0;
  return Math.ceil((a.lockedUntil - Date.now()) / 60_000);
}

export function recordFailure(key: string) {
  const a = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = Date.now() + LOCK_MINUTES * 60_000;
    a.count = 0;
  }
  attempts.set(key, a);
}

export const clearFailures = (key: string) => attempts.delete(key);