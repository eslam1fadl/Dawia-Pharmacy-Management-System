import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/client';
import { hashToken } from '../utils/session';
import type { Permission } from '../utils/permissions';

export const COOKIE_NAME = 'pharmacy_session';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    return next(new Error('يجب تسجيل الدخول', { cause: 401 }));
  }

  const user = db
    .prepare(
      `SELECT u.id, u.username, u.full_name AS fullName,
              u.must_change_password AS mustChangePassword,
              r.id AS roleId, r.name AS role, r.label AS roleLabel
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
    )
    .get(hashToken(token)) as { roleId: number } | undefined;

  if (!user) {
    return next(new Error('انتهت الجلسة، سجّل الدخول من جديد', { cause: 401 }));
  }

  const rows = db
    .prepare('SELECT permission FROM role_permissions WHERE role_id = ?')
    .all(user.roleId) as { permission: string }[];

  res.locals.user = { ...user, permissions: rows.map((r) => r.permission) };
  next();
}

export function ensurePasswordChanged(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.mustChangePassword) {
    return next(new Error('يجب تغيير كلمة المرور أولًا', { cause: 403 }));
  }
  next();
}

export function requirePermission(...required: Permission[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    if (user.mustChangePassword) {
      return next(new Error('يجب تغيير كلمة المرور أولًا', { cause: 403 }));
    }
    if (!required.some((p) => user.permissions.includes(p))) {
      return next(new Error('ليس لديك صلاحية لهذه العملية', { cause: 403 }));
    }
    next();
  };
}