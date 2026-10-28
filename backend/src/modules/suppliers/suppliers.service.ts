import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { logActivity } from '../../utils/activity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fail = (message: string, status: number) => new Error(message, { cause: status });

const text = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === '' ? null : v))
  .nullish();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().trim().min(2, 'اسم المورد مطلوب').max(200),
  company: text,
  phone: text,
  address: text,
  opening_balance: z.number().default(0), // EGP float → converted to piastres
  notes: text,
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2, 'اسم المورد مطلوب').max(200),
    company: text,
    phone: text,
    address: text,
    opening_balance: z.number(), // EGP float
    notes: text,
  })
  .partial();

const listSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['active', 'archived', 'all']).default('active'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

const paymentSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من الصفر'), // EGP float
  paymentMethod: z.string().trim().max(100).default('نقدي'),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الدفع غير صحيح')
    .optional(),
  notes: text,
  purchaseId: z.number().int().positive().optional(),
});

// ---------------------------------------------------------------------------
// Balance SQL helper (returns piastres)
// ---------------------------------------------------------------------------

const BALANCE_SQL = `
  s.opening_balance
  + COALESCE((SELECT SUM(p.total)  FROM purchases p        WHERE p.supplier_id = s.id AND p.status = 'confirmed'), 0)
  - COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id), 0)
`;

const SELECT_SUPPLIER = `
  SELECT
    s.id,
    s.name,
    s.company,
    s.phone,
    s.address,
    s.opening_balance    AS openingBalance,
    s.notes,
    s.is_active          AS isActive,
    s.created_at         AS createdAt,
    s.updated_at         AS updatedAt,
    COALESCE((SELECT SUM(p.total)   FROM purchases p         WHERE p.supplier_id = s.id AND p.status = 'confirmed'), 0) AS totalPurchases,
    COALESCE((SELECT SUM(sp.amount) FROM supplier_payments sp WHERE sp.supplier_id = s.id), 0) AS totalPayments,
    (${BALANCE_SQL}) AS balance
  FROM suppliers s
`;

const toDto = (r: any) => (r ? { ...r, isActive: !!r.isActive } : null);

const getById = (id: number) => toDto(db.prepare(`${SELECT_SUPPLIER} WHERE s.id = ?`).get(id));

// ---------------------------------------------------------------------------
// List Suppliers
// ---------------------------------------------------------------------------

export const listSuppliersService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return next(fail('فلاتر البحث غير صحيحة', 400));
  const f = parsed.data;

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (f.status !== 'all') {
    where.push('s.is_active = ?');
    params.push(f.status === 'active' ? 1 : 0);
  }
  if (f.q) {
    where.push(`(s.name LIKE ? OR s.company LIKE ? OR s.phone LIKE ?)`);
    const like = `%${f.q}%`;
    params.push(like, like, like);
  }

  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM suppliers s ${w}`).get(...params) as { c: number }
  ).c;

  const rows = db
    .prepare(`${SELECT_SUPPLIER} ${w} ORDER BY s.name LIMIT ? OFFSET ?`)
    .all(...params, f.pageSize, (f.page - 1) * f.pageSize);

  return res.status(200).json({ total, page: f.page, pageSize: f.pageSize, items: rows.map(toDto) });
};

// ---------------------------------------------------------------------------
// Get Single Supplier
// ---------------------------------------------------------------------------

export const getSupplierService = (req: Request, res: Response, next: NextFunction) => {
  const supplier = getById(Number(req.params.id));
  if (!supplier) return next(fail('المورد غير موجود', 404));
  return res.status(200).json({ supplier });
};

// ---------------------------------------------------------------------------
// Account Statement
// ---------------------------------------------------------------------------

export const getSupplierAccountService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const supplier = getById(id) as { openingBalance: number; balance: number } | null;
  if (!supplier) return next(fail('المورد غير موجود', 404));

  // Purchases (confirmed) as debit transactions
  const purchases = db
    .prepare(
      `SELECT
         'purchase'      AS type,
         p.invoice_date  AS date,
         p.total         AS amount,
         COALESCE('فاتورة مشتريات ' || COALESCE(p.invoice_number, '#' || p.id), 'فاتورة مشتريات') AS description,
         p.id            AS refId
       FROM purchases p
       WHERE p.supplier_id = ? AND p.status = 'confirmed'`
    )
    .all(id) as Array<{ type: string; date: string; amount: number; description: string; refId: number }>;

  // Payments as credit transactions
  const payments = db
    .prepare(
      `SELECT
         'payment'        AS type,
         sp.payment_date  AS date,
         sp.amount        AS amount,
         COALESCE('دفعة ' || sp.payment_method, 'دفعة') AS description,
         sp.id            AS refId
       FROM supplier_payments sp
       WHERE sp.supplier_id = ?`
    )
    .all(id) as Array<{ type: string; date: string; amount: number; description: string; refId: number }>;

  // Merge and sort by date
  const transactions = [...purchases, ...payments].sort((a, b) => a.date.localeCompare(b.date));

  // Compute running balance
  let runningBalance = supplier.openingBalance;
  const statement = transactions.map((tx) => {
    if (tx.type === 'purchase') {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }
    return { ...tx, balance_after: runningBalance };
  });

  return res.status(200).json({
    opening_balance: supplier.openingBalance,
    current_balance: supplier.balance,
    transactions: statement,
  });
};

// ---------------------------------------------------------------------------
// Create Supplier
// ---------------------------------------------------------------------------

export const createSupplierService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const d = parsed.data;

  const openingBalancePiastres = Math.round(d.opening_balance * 100);

  const id = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO suppliers (name, company, phone, address, opening_balance, notes)
         VALUES (@name, @company, @phone, @address, @openingBalance, @notes)`
      )
      .run({
        name: d.name,
        company: d.company ?? null,
        phone: d.phone ?? null,
        address: d.address ?? null,
        openingBalance: openingBalancePiastres,
        notes: d.notes ?? null,
      });
    const newId = Number(info.lastInsertRowid);
    logActivity(req, {
      action: 'supplier.created',
      entityType: 'supplier',
      entityId: newId,
      newValues: { ...d, opening_balance: openingBalancePiastres },
    });
    return newId;
  })();

  return res.status(201).json({ supplier: getById(id) });
};

// ---------------------------------------------------------------------------
// Update Supplier
// ---------------------------------------------------------------------------

const SUPPLIER_COLUMNS: Record<string, string> = {
  name: 'name',
  company: 'company',
  phone: 'phone',
  address: 'address',
  opening_balance: 'opening_balance',
  notes: 'notes',
};

export const updateSupplierService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const old = getById(id) as Record<string, any> | null;
  if (!old) return next(fail('المورد غير موجود', 404));

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));

  // Convert opening_balance from EGP to piastres if provided
  const data = { ...parsed.data };
  if (data.opening_balance !== undefined && data.opening_balance !== null) {
    data.opening_balance = Math.round((data.opening_balance as number) * 100);
  }

  // Detect actual changes
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const before = key === 'opening_balance' ? old['openingBalance'] : (old[key] ?? null);
    const after = value ?? null;
    if (before !== after) changes[key] = { old: before, new: after };
  }

  const keys = Object.keys(changes);
  if (keys.length === 0) return res.status(200).json({ supplier: old, message: 'لا يوجد تغيير' });

  db.transaction(() => {
    const setClause = keys.map((k) => `${SUPPLIER_COLUMNS[k]} = @${k}`).join(', ');
    db.prepare(`UPDATE suppliers SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run({
      id,
      ...Object.fromEntries(keys.map((k) => [k, changes[k].new])),
    });
    logActivity(req, {
      action: 'supplier.updated',
      entityType: 'supplier',
      entityId: id,
      newValues: Object.fromEntries(keys.map((k) => [k, { old: changes[k].old, new: changes[k].new }])),
    });
  })();

  return res.status(200).json({ supplier: getById(id) });
};

// ---------------------------------------------------------------------------
// Archive / Restore
// ---------------------------------------------------------------------------

const setActive =
  (active: boolean) => (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const supplier = getById(id) as { isActive: boolean } | null;
    if (!supplier) return next(fail('المورد غير موجود', 404));
    if (supplier.isActive === active) return res.status(200).json({ supplier, message: 'لا يوجد تغيير' });

    db.transaction(() => {
      db.prepare(`UPDATE suppliers SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(
        active ? 1 : 0,
        id
      );
      logActivity(req, {
        action: active ? 'supplier.restored' : 'supplier.archived',
        entityType: 'supplier',
        entityId: id,
      });
    })();

    return res.status(200).json({ supplier: getById(id) });
  };

export const archiveSupplierService = setActive(false);
export const restoreSupplierService = setActive(true);

// ---------------------------------------------------------------------------
// Record Payment
// ---------------------------------------------------------------------------

export const createSupplierPaymentService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const supplier = getById(id);
  if (!supplier) return next(fail('المورد غير موجود', 404));

  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const d = parsed.data;

  const amountPiastres = Math.round(d.amount * 100);

  // Validate purchaseId if provided
  if (d.purchaseId) {
    const purchase = db
      .prepare(`SELECT id FROM purchases WHERE id = ? AND supplier_id = ?`)
      .get(d.purchaseId, id);
    if (!purchase) return next(fail('الفاتورة غير موجودة أو لا تخص هذا المورد', 400));
  }

  const paymentId = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO supplier_payments (supplier_id, purchase_id, amount, payment_method, payment_date, notes, created_by)
         VALUES (@supplierId, @purchaseId, @amount, @paymentMethod, @paymentDate, @notes, @createdBy)`
      )
      .run({
        supplierId: id,
        purchaseId: d.purchaseId ?? null,
        amount: amountPiastres,
        paymentMethod: d.paymentMethod,
        paymentDate: d.paymentDate ?? new Date().toISOString().slice(0, 10),
        notes: d.notes ?? null,
        createdBy: req.res?.locals.user?.id ?? null,
      });
    const newId = Number(info.lastInsertRowid);
    logActivity(req, {
      action: 'supplier.payment_recorded',
      entityType: 'supplier',
      entityId: id,
      newValues: { paymentId: newId, amount: amountPiastres, paymentMethod: d.paymentMethod },
    });
    return newId;
  })();

  const payment = db.prepare(`SELECT * FROM supplier_payments WHERE id = ?`).get(paymentId);
  return res.status(201).json({ payment, supplier: getById(id) });
};
