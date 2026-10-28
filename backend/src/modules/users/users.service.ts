import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { hashPassword } from '../../utils/password';
import { logActivity } from '../../utils/activity';
import { PERMISSIONS } from '../../utils/permissions';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'اسم المستخدم لازم يكون 3 أحرف على الأقل')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يقبل حروف وأرقام و _ فقط'),
  fullName: z.string().min(2, 'الاسم الكامل مطلوب').max(100),
  password: z.string().min(6, 'كلمة المرور لازم تكون 6 أحرف على الأقل'),
  roleId: z.number().int().positive(),
  mustChangePassword: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  roleId: z.number().int().positive().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'كلمة المرور لازم تكون 6 أحرف على الأقل'),
  mustChangePassword: z.boolean().optional().default(true),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRolePermissions(roleId: number): string[] {
  const rows = db
    .prepare('SELECT permission FROM role_permissions WHERE role_id = ?')
    .all(roleId) as { permission: string }[];
  return rows.map((r) => r.permission);
}

function getUserById(id: number) {
  return db
    .prepare(`
      SELECT u.id, u.username, u.full_name, u.role_id, u.is_active,
             u.must_change_password, u.created_at,
             r.name AS role, r.label AS role_label
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
    `)
    .get(id) as any | undefined;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

/** GET /api/users — list all users (requires users.manage) */
export const listUsers = (_req: Request, res: Response) => {
  const users = db
    .prepare(`
      SELECT u.id, u.username, u.full_name, u.role_id, u.is_active,
             u.must_change_password, u.created_at,
             r.name AS role, r.label AS role_label
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at ASC
    `)
    .all();
  return res.json({ users });
};

/** GET /api/users/roles — list all roles with their permissions */
export const listRoles = (_req: Request, res: Response) => {
  const roles = db.prepare('SELECT id, name, label FROM roles').all() as {
    id: number; name: string; label: string;
  }[];
  const result = roles.map((role) => ({
    ...role,
    permissions: getRolePermissions(role.id),
  }));
  return res.json({ roles: result, allPermissions: PERMISSIONS });
};

/** POST /api/users — create user (requires users.manage) */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new Error(parsed.error.issues[0].message, { cause: 400 }));
  }
  const { username, fullName, password, roleId, mustChangePassword } = parsed.data;

  // Check role exists
  const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(roleId);
  if (!role) return next(new Error('الدور المحدد غير موجود', { cause: 400 }));

  // Check duplicate username
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return next(new Error('اسم المستخدم مستخدم من قبل', { cause: 409 }));

  const hash = await hashPassword(password);
  const result = db
    .prepare(`
      INSERT INTO users (username, full_name, password_hash, role_id, is_active, must_change_password)
      VALUES (?, ?, ?, ?, 1, ?)
    `)
    .run(username, fullName, hash, roleId, mustChangePassword ? 1 : 0);

  const newUser = getUserById(result.lastInsertRowid as number);
  logActivity(req, {
    action: 'user.created',
    entityType: 'user',
    entityId: newUser.id,
    newValues: { username, fullName, role: newUser.role },
  });

  return res.status(201).json({ user: newUser });
};

/** PATCH /api/users/:id — update fullName or roleId (requires users.manage) */
export const updateUser = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) return next(new Error('معرف المستخدم غير صحيح', { cause: 400 }));

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new Error(parsed.error.issues[0].message, { cause: 400 }));
  }

  const existing = getUserById(id) as any;
  if (!existing) return next(new Error('المستخدم غير موجود', { cause: 404 }));

  // Prevent editing own role (safety)
  const callerId = (res.locals.user as any).id;
  if (callerId === id && parsed.data.roleId && parsed.data.roleId !== existing.role_id) {
    return next(new Error('لا يمكنك تغيير دورك بنفسك', { cause: 403 }));
  }

  if (parsed.data.roleId) {
    const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(parsed.data.roleId);
    if (!role) return next(new Error('الدور المحدد غير موجود', { cause: 400 }));
  }

  const oldValues = { fullName: existing.full_name, roleId: existing.role_id };
  const fields: string[] = [];
  const values: any[] = [];

  if (parsed.data.fullName) { fields.push('full_name = ?'); values.push(parsed.data.fullName); }
  if (parsed.data.roleId)   { fields.push('role_id = ?');   values.push(parsed.data.roleId); }

  if (fields.length === 0) return res.json({ user: existing });

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(values);

  const updated = getUserById(id);
  logActivity(req, {
    action: 'user.updated',
    entityType: 'user',
    entityId: id,
    oldValues,
    newValues: { fullName: updated.full_name, roleId: updated.role_id },
  });

  return res.json({ user: updated });
};

/** PATCH /api/users/:id/activate — activate user */
export const activateUser = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) return next(new Error('معرف غير صحيح', { cause: 400 }));

  const callerId = (res.locals.user as any).id;
  if (callerId === id) return next(new Error('لا يمكنك تعطيل حسابك بنفسك', { cause: 403 }));

  const user = getUserById(id);
  if (!user) return next(new Error('المستخدم غير موجود', { cause: 404 }));

  db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(id);
  logActivity(req, { action: 'user.activated', entityType: 'user', entityId: id });
  return res.json({ message: 'تم تفعيل المستخدم' });
};

/** PATCH /api/users/:id/deactivate — deactivate user */
export const deactivateUser = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) return next(new Error('معرف غير صحيح', { cause: 400 }));

  const callerId = (res.locals.user as any).id;
  if (callerId === id) return next(new Error('لا يمكنك تعطيل حسابك بنفسك', { cause: 403 }));

  const user = getUserById(id);
  if (!user) return next(new Error('المستخدم غير موجود', { cause: 404 }));

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id);
  // Kill active sessions for deactivated user
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  logActivity(req, { action: 'user.deactivated', entityType: 'user', entityId: id });
  return res.json({ message: 'تم تعطيل المستخدم وإنهاء جلساته' });
};

/** POST /api/users/:id/reset-password — reset another user's password */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) return next(new Error('معرف غير صحيح', { cause: 400 }));

  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new Error(parsed.error.issues[0].message, { cause: 400 }));
  }

  const user = getUserById(id);
  if (!user) return next(new Error('المستخدم غير موجود', { cause: 404 }));

  const hash = await hashPassword(parsed.data.newPassword);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?')
    .run(hash, parsed.data.mustChangePassword ? 1 : 0, id);

  // Kill all sessions for that user
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);

  logActivity(req, {
    action: 'user.password_reset',
    entityType: 'user',
    entityId: id,
    newValues: { targetUsername: user.username, mustChangePassword: parsed.data.mustChangePassword },
  });

  return res.json({ message: 'تم إعادة تعيين كلمة المرور' });
};
