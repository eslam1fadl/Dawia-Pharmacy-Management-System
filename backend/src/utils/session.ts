import crypto from 'node:crypto';
import { db } from '../db/client';

const SESSION_HOURS = 12;

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES (?, ?, datetime('now', ?))`
  ).run(userId, hashToken(token), `+${SESSION_HOURS} hours`);
  return token;
}

export function destroySession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function destroyOtherSessions(userId: number, currentToken: string) {
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(
    userId,
    hashToken(currentToken)
  );
}