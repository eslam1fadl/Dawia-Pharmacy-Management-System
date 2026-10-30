import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { logActivity } from '../../utils/activity';

const text = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v === '' ? null : v))
  .nullish();

const money = z
  .number()
  .int('السعر لازم يكون بالقروش (رقم صحيح)، مثال: 50.75 جنيه = 5075')
  .min(0, 'السعر لا يمكن أن يكون سالبًا');

const reorder = z.number().int().min(0, 'حد إعادة الطلب لا يكون سالبًا');

// الحقول هنا من غير قيم افتراضية، عشان التعديل (partial) ما يرجّعش أي حقل لقيمته الافتراضية بالغلط
const fields = {
  name: z.string().trim().min(2, 'اسم الدواء مطلوب').max(200),
  scientificName: text,
  activeIngredient: text,
  strength: text,
  dosageForm: text,
  packSize: text,
  barcode: text,
  sku: text,
  manufacturer: text,
  categoryId: z.number().int().positive().nullish(),
  purchasePrice: money,
  salePrice: money,
  reorderLevel: reorder,
  defaultSupplierId: z.number().int().positive().nullish(),
  saleUnit: z.string().trim().min(1).max(50).default('علبة'),
  packUnit: z.string().trim().max(50).transform(v => v === '' ? null : v).nullish(),
  unitsPerPack: z.number().int().min(1).max(10000).default(1),
  description: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => (v === '' ? null : v))
    .nullish(),
};

const createSchema = z.object({
  ...fields,
  purchasePrice: money.default(0),
  salePrice: money.default(0),
  reorderLevel: reorder.default(0),
});

const updateSchema = z.object(fields).partial();

const listSchema = z.object({
  q: z.string().trim().optional(),
  categoryId: z.coerce.number().int().optional(),
  status: z.enum(['active', 'archived', 'all']).default('active'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

// اسم الحقل في الـ API ← اسم العمود في القاعدة
const COLUMNS: Record<string, string> = {
  name: 'name',
  scientificName: 'scientific_name',
  activeIngredient: 'active_ingredient',
  strength: 'strength',
  dosageForm: 'dosage_form',
  packSize: 'pack_size',
  barcode: 'barcode',
  sku: 'sku',
  manufacturer: 'manufacturer',
  categoryId: 'category_id',
  purchasePrice: 'purchase_price',
  salePrice: 'sale_price',
  reorderLevel: 'reorder_level',
  defaultSupplierId: 'default_supplier_id',
  saleUnit: 'sale_unit',
  packUnit: 'pack_unit',
  unitsPerPack: 'units_per_pack',
  description: 'description',
};

const SELECT = `
  SELECT m.id, m.name, m.scientific_name AS scientificName, m.active_ingredient AS activeIngredient,
         m.strength, m.dosage_form AS dosageForm, m.pack_size AS packSize, m.barcode, m.sku,
         m.manufacturer, m.category_id AS categoryId, c.name AS categoryName,
         m.purchase_price AS purchasePrice, m.sale_price AS salePrice, m.reorder_level AS reorderLevel,
         m.default_supplier_id AS defaultSupplierId,
         m.sale_unit AS saleUnit, m.pack_unit AS packUnit, m.units_per_pack AS unitsPerPack,
         m.description, m.is_active AS isActive,
         m.created_at AS createdAt, m.updated_at AS updatedAt
  FROM medicines m LEFT JOIN categories c ON c.id = m.category_id`;

const toDto = (r: any) => (r ? { ...r, isActive: !!r.isActive } : null);
const getById = (id: number) => toDto(db.prepare(`${SELECT} WHERE m.id = ?`).get(id));

const fail = (message: string, status: number) => new Error(message, { cause: status });

// يتأكد إن الباركود/الكود مش مستخدمين في دواء تاني
function duplicateError(d: { barcode?: string | null; sku?: string | null }, exceptId = 0): Error | null {
  for (const field of ['barcode', 'sku'] as const) {
    const value = d[field];
    if (!value) continue;
    const dup = db.prepare(`SELECT name FROM medicines WHERE ${field} = ? AND id <> ?`).get(value, exceptId) as
      | { name: string }
      | undefined;
    if (dup) return fail(`${field === 'barcode' ? 'الباركود' : 'كود الصنف'} مستخدم بالفعل للدواء: ${dup.name}`, 409);
  }
  return null;
}

// يتأكد إن التصنيف والمورد موجودين فعلًا
function refsError(d: { categoryId?: number | null; defaultSupplierId?: number | null }): Error | null {
  if (d.categoryId && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(d.categoryId))
    return fail('التصنيف غير موجود', 400);
  if (d.defaultSupplierId && !db.prepare('SELECT 1 FROM suppliers WHERE id = ?').get(d.defaultSupplierId))
    return fail('المورد غير موجود', 400);
  return null;
}

export const listCategoriesService = (_req: Request, res: Response) => {
  const categories = db.prepare('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name').all();
  return res.status(200).json({ categories });
};

export const listMedicinesService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return next(fail('فلاتر البحث غير صحيحة', 400));
  const f = parsed.data;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (f.status !== 'all') {
    where.push('m.is_active = ?');
    params.push(f.status === 'active' ? 1 : 0);
  }
  if (f.categoryId) {
    where.push('m.category_id = ?');
    params.push(f.categoryId);
  }
  if (f.q) {
    where.push(
      `(m.name LIKE ? OR m.scientific_name LIKE ? OR m.active_ingredient LIKE ? OR m.barcode = ? OR m.sku = ?)`
    );
    const like = `%${f.q}%`;
    params.push(like, like, like, f.q, f.q);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM medicines m ${w}`).get(...params) as { c: number }).c;
  const rows = db
    .prepare(`${SELECT} ${w} ORDER BY m.name LIMIT ? OFFSET ?`)
    .all(...params, f.pageSize, (f.page - 1) * f.pageSize);

  return res.status(200).json({ total, page: f.page, pageSize: f.pageSize, items: rows.map(toDto) });
};

export const getMedicineService = (req: Request, res: Response, next: NextFunction) => {
  const medicine = getById(Number(req.params.id));
  if (!medicine) return next(fail('الدواء غير موجود', 404));
  return res.status(200).json({ medicine });
};

export const createMedicineService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const d = parsed.data;

  const err = refsError(d) ?? duplicateError(d);
  if (err) return next(err);

  const id = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO medicines (name, scientific_name, active_ingredient, strength, dosage_form, pack_size,
                                barcode, sku, manufacturer, category_id, purchase_price, sale_price,
                                reorder_level, default_supplier_id, sale_unit, pack_unit, units_per_pack, description)
         VALUES (@name, @scientificName, @activeIngredient, @strength, @dosageForm, @packSize,
                 @barcode, @sku, @manufacturer, @categoryId, @purchasePrice, @salePrice,
                 @reorderLevel, @defaultSupplierId, @saleUnit, @packUnit, @unitsPerPack, @description)`
      )
      .run({
        name: d.name,
        scientificName: d.scientificName ?? null,
        activeIngredient: d.activeIngredient ?? null,
        strength: d.strength ?? null,
        dosageForm: d.dosageForm ?? null,
        packSize: d.packSize ?? null,
        barcode: d.barcode ?? null,
        sku: d.sku ?? null,
        manufacturer: d.manufacturer ?? null,
        categoryId: d.categoryId ?? null,
        purchasePrice: d.purchasePrice,
        salePrice: d.salePrice,
        reorderLevel: d.reorderLevel,
        defaultSupplierId: d.defaultSupplierId ?? null,
        saleUnit: d.saleUnit,
        packUnit: d.packUnit ?? null,
        unitsPerPack: d.unitsPerPack,
        description: d.description ?? null,
      });
    const newId = Number(info.lastInsertRowid);
    logActivity(req, { action: 'medicine.created', entityType: 'medicine', entityId: newId, newValues: d });
    return newId;
  })();

  return res.status(201).json({ medicine: getById(id) });
};

export const updateMedicineService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const old = getById(id) as Record<string, any> | null;
  if (!old) return next(fail('الدواء غير موجود', 404));

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  // نبني قائمة التغييرات الفعلية (بدون إعادة كتابة الثوابت)
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    const before = old[key] ?? null;
    const after = value ?? null;
    if (before !== after) changes[key] = { old: before, new: after };
  }
  const keys = Object.keys(changes);
  if (keys.length === 0) return res.status(200).json({ medicine: old, message: 'لا توجد تغييرات' });

  const priceKeys: string[] = keys.filter((k) => k === 'purchasePrice' || k === 'salePrice');
  const otherKeys = keys.filter((k) => !priceKeys.includes(k));

  // تغيير الأسعار يستلزم صلاحية خاصة من الباكيند
  if (priceKeys.length && !res.locals.user.permissions.includes('medicines.edit_price')) {
    return next(fail('ليس لديك صلاحية تعديل الأسعار', 403));
  }

  const err =
    refsError({ categoryId: changes.categoryId?.new as any, defaultSupplierId: changes.defaultSupplierId?.new as any }) ??
    duplicateError({ barcode: changes.barcode?.new as any, sku: changes.sku?.new as any }, id);
  if (err) return next(err);

  const pick = (ks: string[]) => Object.fromEntries(ks.map((k) => [k, changes[k]]));

  db.transaction(() => {
    const setClause = keys.map((k) => `${COLUMNS[k]} = @${k}`).join(', ');
    db.prepare(`UPDATE medicines SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run({
      id,
      ...Object.fromEntries(keys.map((k) => [k, changes[k].new])),
    });

    const columnOf = { purchasePrice: 'purchase_price', salePrice: 'sale_price' } as const;
    for (const k of priceKeys as (keyof typeof columnOf)[]) {
      db.prepare(
        `INSERT INTO price_history (medicine_id, field, old_value, new_value, changed_by) VALUES (?,?,?,?,?)`
      ).run(id, columnOf[k], changes[k].old, changes[k].new, res.locals.user.id);
    }

    if (otherKeys.length)
      logActivity(req, { action: 'medicine.updated', entityType: 'medicine', entityId: id, newValues: pick(otherKeys) });
    if (priceKeys.length)
      logActivity(req, { action: 'medicine.price_changed', entityType: 'medicine', entityId: id, newValues: pick(priceKeys) });
  })();

  return res.status(200).json({ medicine: getById(id) });
};

const setActive = (active: boolean) => (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const medicine = getById(id) as { isActive: boolean } | null;
  if (!medicine) return next(fail('الدواء غير موجود', 404));
  if (medicine.isActive === active) return res.status(200).json({ medicine, message: 'لا توجد تغييرات' });

  db.transaction(() => {
    db.prepare(`UPDATE medicines SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(active ? 1 : 0, id);
    logActivity(req, { action: active ? 'medicine.restored' : 'medicine.archived', entityType: 'medicine', entityId: id });
  })();
  return res.status(200).json({ medicine: getById(id) });
};

export const archiveMedicineService = setActive(false);
export const restoreMedicineService = setActive(true);

export const getPriceComparisonService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!getById(id)) return next(fail('الدواء غير موجود', 404));

  // جلب آخر سعر شراء لكل مورد لهذا الدواء
  const rows = db.prepare(`
    SELECT
      s.id   AS supplierId,
      s.name AS supplierName,
      s.company,
      pi.unit_cost   AS lastUnitCost,
      p.invoice_date AS lastDate,
      p.id           AS purchaseId
    FROM purchase_items pi
    JOIN purchases p ON p.id = pi.purchase_id AND p.status = 'confirmed'
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE pi.medicine_id = ?
    ORDER BY pi.id DESC
  `).all(id) as Array<{
    supplierId: number;
    supplierName: string;
    company: string | null;
    lastUnitCost: number;
    lastDate: string | null;
    purchaseId: number;
  }>;

  // نحتفظ بأول صف لكل مورد (آخر سعر شراء)
  const bySupplier = new Map<number, typeof rows[0]>();
  for (const r of rows) {
    if (!bySupplier.has(r.supplierId)) bySupplier.set(r.supplierId, r);
  }

  return res.status(200).json({ comparisons: [...bySupplier.values()] });
};

export const getPriceHistoryService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!getById(id)) return next(fail('الدواء غير موجود', 404));
  const history = db
    .prepare(
      `SELECT ph.id, ph.field, ph.old_value AS oldValue, ph.new_value AS newValue,
              ph.changed_at AS changedAt, u.username AS changedBy
       FROM price_history ph LEFT JOIN users u ON u.id = ph.changed_by
       WHERE ph.medicine_id = ? ORDER BY ph.id DESC`
    )
    .all(id);
  return res.status(200).json({ history });
};
