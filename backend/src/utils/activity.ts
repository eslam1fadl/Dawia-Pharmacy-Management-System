import type { Request } from 'express';
import { db } from '../db/client';

interface LogInput {
  action: string;
  entityType?: string;
  entityId?: string | number;
  oldValues?: unknown;
  newValues?: unknown;
}

export function logActivity(req: Request, input: LogInput, actor?: { id: number; username: string }) {
  // لو ما اتبعتش actor ناخد المستخدم المسجّل دخوله حاليًا
  const u = actor ?? req.res?.locals.user;
  db.prepare(
    `INSERT INTO activity_log (user_id, username, action, entity_type, entity_id, old_values, new_values, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    u?.id ?? null,
    u?.username ?? null,
    input.action,
    input.entityType ?? null,
    input.entityId != null ? String(input.entityId) : null,
    input.oldValues !== undefined ? JSON.stringify(input.oldValues) : null,
    input.newValues !== undefined ? JSON.stringify(input.newValues) : null,
    req.ip ?? null
  );
}