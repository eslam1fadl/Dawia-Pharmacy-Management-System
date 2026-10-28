import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { hashPassword, verifyPassword } from '../../utils/password';
import { createSession, destroySession, destroyOtherSessions } from '../../utils/session';
import { clearFailures, limiterKey, lockMinutesLeft, recordFailure } from '../../utils/login-limiter';
import { logActivity } from '../../utils/activity';
import { COOKIE_NAME } from '../../middleware/auth';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة 8 أحرف على الأقل'),
});

export const loginService = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new Error('اكتب اسم المستخدم وكلمة المرور', { cause: 400 }));
  }
  const { username, password } = parsed.data;

  const key = limiterKey(req.ip, username);
  const minutes = lockMinutesLeft(key);
  if (minutes > 0) {
    return next(new Error(`محاولات كثيرة خاطئة. حاول بعد ${minutes} دقيقة`, { cause: 429 }));
  }

  const user = db
    .prepare('SELECT id, username, password_hash, is_active FROM users WHERE username = ?')
    .get(username) as { id: number; username: string; password_hash: string; is_active: number } | undefined;

  const ok = user && user.is_active === 1 && (await verifyPassword(password, user.password_hash));
  if (!ok) {
    recordFailure(key);
    logActivity(req, { action: 'auth.login_failed', newValues: { username } });
    return next(new Error('اسم المستخدم أو كلمة المرور غير صحيحة', { cause: 401 }));
  }

  clearFailures(key);
  const token = createSession(user.id);
  logActivity(req, { action: 'auth.login', entityType: 'user', entityId: user.id }, { id: user.id, username: user.username });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
  return res.status(200).json({ message: 'تم تسجيل الدخول' });
};

export const meService = (_req: Request, res: Response) => {
  return res.status(200).json({ user: res.locals.user });
};

export const logoutService = (req: Request, res: Response) => {
  logActivity(req, { action: 'auth.logout', entityType: 'user', entityId: res.locals.user.id });
  destroySession(req.cookies[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.status(200).json({ message: 'تم تسجيل الخروج' });
};

export const changePasswordService = async (req: Request, res: Response, next: NextFunction) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new Error(parsed.error.issues[0].message, { cause: 400 }));
  }
  const { currentPassword, newPassword } = parsed.data;
  const userId = res.locals.user.id as number;

  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as {
    password_hash: string;
  };

  if (!(await verifyPassword(currentPassword, row.password_hash))) {
    return next(new Error('كلمة المرور الحالية غير صحيحة', { cause: 400 }));
  }
  if (currentPassword === newPassword) {
    return next(new Error('كلمة المرور الجديدة لازم تختلف عن الحالية', { cause: 400 }));
  }

  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, userId);

  // أي جهاز تاني كان مسجّل دخول بالكلمة القديمة يتفصل، والجلسة الحالية تفضل
  destroyOtherSessions(userId, req.cookies[COOKIE_NAME]);

  // ما بنسجّلش كلمة المرور نفسها، بس إن التغيير حصل
  logActivity(req, { action: 'auth.password_changed', entityType: 'user', entityId: userId });

  return res.status(200).json({ message: 'تم تغيير كلمة المرور' });
};