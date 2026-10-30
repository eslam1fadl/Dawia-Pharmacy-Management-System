import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { logActivity } from '../../utils/activity';

const fail = (message: string, status: number) => new Error(message, { cause: status });

// ────────────────────────────────────────────────────────────────────
// Schemas
// ────────────────────────────────────────────────────────────────────
const ALLOWED_KEYS = ['pharmacy.name', 'pharmacy.phone', 'pharmacy.address', 'pharmacy.logo', 'currency.symbol', 'date.format'] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

const updateSettingsSchema = z
  .object({
    'pharmacy.name': z.string().trim().min(1, 'اسم الصيدلية مطلوب').max(200).optional(),
    'pharmacy.phone': z.string().trim().max(30).optional(),
    'pharmacy.address': z.string().trim().max(500).optional(),
    'pharmacy.logo': z.string().max(2097152).optional(), // base64 image ~2MB
    'currency.symbol': z.string().trim().min(1).max(10).optional(),
    'date.format': z.string().trim().min(1).max(20).optional(),
  })
  .strict();

const categorySchema = z.object({
  name: z.string().trim().min(1, 'اسم التصنيف مطلوب').max(100),
});

const paymentMethodsSchema = z.object({
  methods: z.array(z.string().trim().min(1).max(100)).min(1, 'يجب تحديد طريقة دفع واحدة على الأقل'),
});

// ────────────────────────────────────────────────────────────────────
// Settings (key/value)
// ────────────────────────────────────────────────────────────────────

export const getSettingsService = (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    // Exclude payment_methods from the general settings response (it has its own endpoint)
    if (row.key !== 'payment_methods') settings[row.key] = row.value;
  }

  const roles = db.prepare('SELECT name, label FROM roles').all() as { name: string; label: string }[];
  return res.status(200).json({ settings, roles });
};

export const updateSettingsService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  const data = parsed.data as Partial<Record<AllowedKey, string>>;
  const entries = Object.entries(data) as [AllowedKey, string][];
  if (entries.length === 0) return next(fail('لا توجد قيم للتحديث', 400));

  const oldValues: Record<string, string> = {};
  const newValues: Record<string, string> = {};

  const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  db.transaction(() => {
    for (const [key, value] of entries) {
      const existing = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
        | { value: string }
        | undefined;
      oldValues[key] = existing?.value ?? '';
      newValues[key] = value;
      updateStmt.run(key, value);
    }
    logActivity(req, { action: 'settings.updated', newValues, oldValues: oldValues });
  })();

  return res.status(200).json({ message: 'تم حفظ الإعدادات', settings: newValues });
};

// ────────────────────────────────────────────────────────────────────
// Categories
// ────────────────────────────────────────────────────────────────────

export const listAllCategoriesService = (_req: Request, res: Response) => {
  const categories = db
    .prepare('SELECT id, name, is_active AS isActive FROM categories ORDER BY name')
    .all() as { id: number; name: string; isActive: number }[];
  return res.status(200).json({ categories: categories.map((c) => ({ ...c, isActive: !!c.isActive })) });
};

export const createCategoryService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  const { name } = parsed.data;

  const dup = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (dup) return next(fail('يوجد تصنيف بهذا الاسم بالفعل', 409));

  const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  const id = Number(info.lastInsertRowid);
  logActivity(req, { action: 'category.created', entityType: 'category', entityId: id, newValues: { name } });

  const category = db.prepare('SELECT id, name, is_active AS isActive FROM categories WHERE id = ?').get(id) as {
    id: number;
    name: string;
    isActive: number;
  };
  return res.status(201).json({ category: { ...category, isActive: !!category.isActive } });
};

export const updateCategoryService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(id) as
    | { id: number; name: string }
    | undefined;
  if (!existing) return next(fail('التصنيف غير موجود', 404));

  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  const { name } = parsed.data;
  if (name === existing.name) return res.status(200).json({ message: 'لا يوجد تغيير' });

  const dup = db.prepare('SELECT id FROM categories WHERE name = ? AND id <> ?').get(name, id);
  if (dup) return next(fail('يوجد تصنيف بهذا الاسم بالفعل', 409));

  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
  logActivity(req, {
    action: 'category.updated',
    entityType: 'category',
    entityId: id,
    oldValues: { name: existing.name },
    newValues: { name },
  });

  const category = db.prepare('SELECT id, name, is_active AS isActive FROM categories WHERE id = ?').get(id) as {
    id: number;
    name: string;
    isActive: number;
  };
  return res.status(200).json({ category: { ...category, isActive: !!category.isActive } });
};

export const toggleCategoryService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id, name, is_active FROM categories WHERE id = ?').get(id) as
    | { id: number; name: string; is_active: number }
    | undefined;
  if (!existing) return next(fail('التصنيف غير موجود', 404));

  const newActive = existing.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE categories SET is_active = ? WHERE id = ?').run(newActive, id);

  logActivity(req, {
    action: newActive ? 'category.activated' : 'category.deactivated',
    entityType: 'category',
    entityId: id,
  });

  return res.status(200).json({
    category: { id: existing.id, name: existing.name, isActive: !!newActive },
    message: newActive ? 'تم تفعيل التصنيف' : 'تم إيقاف التصنيف',
  });
};

// ────────────────────────────────────────────────────────────────────
// Payment Methods
// ────────────────────────────────────────────────────────────────────

export const getPaymentMethodsService = (_req: Request, res: Response) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'payment_methods'").get() as
    | { value: string }
    | undefined;
  let methods: string[] = ['نقدي', 'بطاقة ائتمان', 'تحويل بنكي'];
  if (row?.value) {
    try {
      methods = JSON.parse(row.value);
    } catch {
      // use defaults
    }
  }
  return res.status(200).json({ methods });
};

export const updatePaymentMethodsService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = paymentMethodsSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  const { methods } = parsed.data;
  const value = JSON.stringify(methods);

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('payment_methods', ?)").run(value);
  logActivity(req, { action: 'settings.payment_methods_updated', newValues: { methods } });

  return res.status(200).json({ message: 'تم حفظ طرق الدفع', methods });
};
