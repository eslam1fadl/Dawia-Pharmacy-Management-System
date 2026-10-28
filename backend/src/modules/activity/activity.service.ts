import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';

const querySchema = z.object({
  userId: z.coerce.number().int().optional(),
  action: z.string().optional(), // بادئة، مثال: auth. أو auth.login
  from: z.string().optional(), // 2026-10-27
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

const parseJson = (v: string | null) => {
  if (v === null) return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

export const listActivityService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new Error('فلاتر البحث غير صحيحة', { cause: 400 }));
  }
  const f = parsed.data;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (f.userId) { where.push('user_id = ?'); params.push(f.userId); }
  if (f.action) { where.push('action LIKE ?'); params.push(`${f.action}%`); }
  if (f.from) { where.push('created_at >= ?'); params.push(f.from); }
  if (f.to) { where.push('created_at <= ?'); params.push(`${f.to} 23:59:59`); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM activity_log ${w}`).get(...params) as { c: number }).c;
  const rows = db
    .prepare(
      `SELECT id, user_id AS userId, username, action, entity_type AS entityType, entity_id AS entityId,
              old_values AS oldValues, new_values AS newValues, ip, created_at AS createdAt
       FROM activity_log ${w} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, f.pageSize, (f.page - 1) * f.pageSize) as any[];

  const items = rows.map((r) => ({ ...r, oldValues: parseJson(r.oldValues), newValues: parseJson(r.newValues) }));
  return res.status(200).json({ total, page: f.page, pageSize: f.pageSize, items });
};