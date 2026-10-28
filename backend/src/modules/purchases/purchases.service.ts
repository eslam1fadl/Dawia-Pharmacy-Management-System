import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/client';
import { logActivity } from '../../utils/activity';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fail = (message: string, status: number) => new Error(message, { cause: status });

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const itemSchema = z.object({
  medicineId: z.number().int().positive(),
  batchNumber: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
  quantity: z.number().int().positive('الكمية يجب أن تكون عدد صحيح موجب'),
  unitCostEgp: z.number().positive('سعر الوحدة يجب أن يكون موجبًا'),
  discountPct: z.number().min(0).max(100).default(0),
});

const purchaseBodySchema = z.object({
  supplierId: z.number().int().positive().optional(),
  invoiceNumber: z.string().trim().optional(),
  invoiceDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z.array(itemSchema).min(1, 'الفاتورة يجب أن تحتوي على صنف واحد على الأقل'),
  discountAmount: z.number().min(0).default(0),
  paidAmountEgp: z.number().min(0).default(0),
  paymentMethod: z.string().trim().optional(),
});

const updatePurchaseBodySchema = purchaseBodySchema.partial();

const listSchema = z.object({
  supplierId: z.coerce.number().int().positive().optional(),
  status: z.enum(['draft', 'confirmed', 'reversed', 'all']).default('all'),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── interfaces ───────────────────────────────────────────────────────────────
interface PurchaseRow {
  id: number;
  supplier_id: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  status: 'draft' | 'confirmed' | 'reversed';
  subtotal: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  payment_method: string | null;
  notes: string | null;
  confirmed_at: string | null;
  confirmed_by: number | null;
  reversed_at: string | null;
  reversed_by: number | null;
  reversal_reason: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface PurchaseItemRow {
  id: number;
  purchase_id: number;
  medicine_id: number;
  batch_number: string | null;
  expiry_date: string | null;
  quantity: number;
  unit_cost: number;
  discount_pct: number;
  line_total: number;
  batch_id: number | null;
}

interface BatchRow {
  id: number;
  quantity: number;
  initial_quantity: number;
}

// ─── internal helpers ─────────────────────────────────────────────────────────

/** Convert EGP (float) to piastres (integer) */
const toPiastres = (egp: number) => Math.round(egp * 100);

/** Fetch a purchase with its items (including medicine name) */
function getPurchaseWithItems(purchaseId: number) {
  const purchase = db
    .prepare(
      `SELECT p.*, s.name AS supplierName, u.username AS createdByUsername
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = ?`
    )
    .get(purchaseId) as (PurchaseRow & { supplierName: string | null; createdByUsername: string | null }) | undefined;

  if (!purchase) return null;

  const items = db
    .prepare(
      `SELECT pi.*, m.name AS medicineName
       FROM purchase_items pi
       LEFT JOIN medicines m ON m.id = pi.medicine_id
       WHERE pi.purchase_id = ?
       ORDER BY pi.id`
    )
    .all(purchaseId) as (PurchaseItemRow & { medicineName: string | null })[];

  return { ...purchase, items };
}

/** Calculate totals from raw item inputs */
function calcTotals(
  items: z.infer<typeof itemSchema>[],
  discountAmountEgp: number
) {
  const lineItems = items.map((item) => {
    const unitCostPiastres = toPiastres(item.unitCostEgp);
    const lineTotal = Math.round(item.quantity * unitCostPiastres * (1 - item.discountPct / 100));
    return { ...item, unitCostPiastres, lineTotal };
  });
  const subtotal = lineItems.reduce((s, i) => s + i.lineTotal, 0);
  const discountAmountPiastres = toPiastres(discountAmountEgp);
  const total = subtotal - discountAmountPiastres;
  return { lineItems, subtotal, discountAmountPiastres, total };
}

// ─── service handlers ─────────────────────────────────────────────────────────

export const listPurchasesService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const f = parsed.data;

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (f.status !== 'all') {
    where.push('p.status = ?');
    params.push(f.status);
  }
  if (f.supplierId) {
    where.push('p.supplier_id = ?');
    params.push(f.supplierId);
  }
  if (f.from) {
    where.push("p.invoice_date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    where.push("p.invoice_date <= ?");
    params.push(f.to);
  }

  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM purchases p ${w}`).get(...params) as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT p.id, p.invoice_number AS invoiceNumber, p.invoice_date AS invoiceDate,
              p.status, s.name AS supplierName, p.total, p.paid_amount AS paidAmount,
              p.created_at AS createdAt
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ${w}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, f.pageSize, (f.page - 1) * f.pageSize);

  return res.status(200).json({ total, page: f.page, pageSize: f.pageSize, items: rows });
};

export const getPurchaseService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const purchase = getPurchaseWithItems(id);
  if (!purchase) return next(fail('الفاتورة غير موجودة', 404));
  return res.status(200).json({ purchase });
};

export const createPurchaseService = (req: Request, res: Response, next: NextFunction) => {
  const parsed = purchaseBodySchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const d = parsed.data;

  // validate supplier if provided
  if (d.supplierId) {
    const sup = db.prepare('SELECT 1 FROM suppliers WHERE id = ?').get(d.supplierId);
    if (!sup) return next(fail('المورد غير موجود', 400));
  }
  // validate medicines
  for (const item of d.items) {
    const med = db.prepare('SELECT 1 FROM medicines WHERE id = ?').get(item.medicineId);
    if (!med) return next(fail(`الدواء ذو الرقم ${item.medicineId} غير موجود`, 400));
  }

  const { lineItems, subtotal, discountAmountPiastres, total } = calcTotals(d.items, d.discountAmount);
  const paidAmountPiastres = toPiastres(d.paidAmountEgp);
  const userId = (res.locals.user as { id: number }).id;

  const purchaseId = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO purchases
           (supplier_id, invoice_number, invoice_date, status, subtotal, discount_amount, total,
            paid_amount, payment_method, notes, created_by)
         VALUES
           (@supplierId, @invoiceNumber, @invoiceDate, 'draft', @subtotal, @discountAmount, @total,
            @paidAmount, @paymentMethod, @notes, @createdBy)`
      )
      .run({
        supplierId: d.supplierId ?? null,
        invoiceNumber: d.invoiceNumber ?? null,
        invoiceDate: d.invoiceDate ?? new Date().toISOString().slice(0, 10),
        subtotal,
        discountAmount: discountAmountPiastres,
        total,
        paidAmount: paidAmountPiastres,
        paymentMethod: d.paymentMethod ?? null,
        notes: d.notes ?? null,
        createdBy: userId,
      });

    const newId = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO purchase_items
         (purchase_id, medicine_id, batch_number, expiry_date, quantity, unit_cost, discount_pct, line_total)
       VALUES (@purchaseId, @medicineId, @batchNumber, @expiryDate, @quantity, @unitCost, @discountPct, @lineTotal)`
    );

    for (const item of lineItems) {
      insertItem.run({
        purchaseId: newId,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber ?? null,
        expiryDate: item.expiryDate ?? null,
        quantity: item.quantity,
        unitCost: item.unitCostPiastres,
        discountPct: item.discountPct,
        lineTotal: item.lineTotal,
      });
    }

    logActivity(req, {
      action: 'purchase.created',
      entityType: 'purchase',
      entityId: newId,
      newValues: { invoiceNumber: d.invoiceNumber, supplierId: d.supplierId, total, itemCount: lineItems.length },
    });

    return newId;
  })();

  return res.status(201).json({ purchase: getPurchaseWithItems(purchaseId) });
};

export const updatePurchaseService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as PurchaseRow | undefined;
  if (!existing) return next(fail('الفاتورة غير موجودة', 404));
  if (existing.status !== 'draft') return next(fail('لا يمكن تعديل فاتورة غير مسوّدة', 400));

  const parsed = updatePurchaseBodySchema.safeParse(req.body);
  if (!parsed.success) return next(fail(parsed.error.issues[0].message, 400));
  const d = parsed.data;

  if (d.supplierId) {
    const sup = db.prepare('SELECT 1 FROM suppliers WHERE id = ?').get(d.supplierId);
    if (!sup) return next(fail('المورد غير موجود', 400));
  }
  if (d.items) {
    for (const item of d.items) {
      const med = db.prepare('SELECT 1 FROM medicines WHERE id = ?').get(item.medicineId);
      if (!med) return next(fail(`الدواء ذو الرقم ${item.medicineId} غير موجود`, 400));
    }
  }

  db.transaction(() => {
    const sets: string[] = [];
    const params: Record<string, string | number | null> = { id };

    if (d.supplierId !== undefined) { sets.push('supplier_id = @supplierId'); params.supplierId = d.supplierId ?? null; }
    if (d.invoiceNumber !== undefined) { sets.push('invoice_number = @invoiceNumber'); params.invoiceNumber = d.invoiceNumber ?? null; }
    if (d.invoiceDate !== undefined) { sets.push('invoice_date = @invoiceDate'); params.invoiceDate = d.invoiceDate ?? null; }
    if (d.notes !== undefined) { sets.push('notes = @notes'); params.notes = d.notes ?? null; }
    if (d.paymentMethod !== undefined) { sets.push('payment_method = @paymentMethod'); params.paymentMethod = d.paymentMethod ?? null; }

    if (d.items) {
      const { lineItems, subtotal, discountAmountPiastres, total } = calcTotals(
        d.items,
        d.discountAmount ?? 0
      );
      const paidAmountPiastres = toPiastres(d.paidAmountEgp ?? 0);

      // Replace items
      db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(id);
      const insertItem = db.prepare(
        `INSERT INTO purchase_items
           (purchase_id, medicine_id, batch_number, expiry_date, quantity, unit_cost, discount_pct, line_total)
         VALUES (@purchaseId, @medicineId, @batchNumber, @expiryDate, @quantity, @unitCost, @discountPct, @lineTotal)`
      );
      for (const item of lineItems) {
        insertItem.run({
          purchaseId: id,
          medicineId: item.medicineId,
          batchNumber: item.batchNumber ?? null,
          expiryDate: item.expiryDate ?? null,
          quantity: item.quantity,
          unitCost: item.unitCostPiastres,
          discountPct: item.discountPct,
          lineTotal: item.lineTotal,
        });
      }
      sets.push('subtotal = @subtotal', 'discount_amount = @discountAmount', 'total = @total', 'paid_amount = @paidAmount');
      params.subtotal = subtotal;
      params.discountAmount = discountAmountPiastres;
      params.total = total;
      params.paidAmount = paidAmountPiastres;
    } else if (d.discountAmount !== undefined || d.paidAmountEgp !== undefined) {
      // Recalculate only financial fields if items not replaced
      if (d.discountAmount !== undefined) {
        sets.push('discount_amount = @discountAmount');
        params.discountAmount = toPiastres(d.discountAmount);
      }
      if (d.paidAmountEgp !== undefined) {
        sets.push('paid_amount = @paidAmount');
        params.paidAmount = toPiastres(d.paidAmountEgp);
      }
    }

    if (sets.length) {
      db.prepare(`UPDATE purchases SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
    }

    logActivity(req, { action: 'purchase.updated', entityType: 'purchase', entityId: id, newValues: d });
  })();

  return res.status(200).json({ purchase: getPurchaseWithItems(id) });
};

export const confirmPurchaseService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as PurchaseRow | undefined;
  if (!existing) return next(fail('الفاتورة غير موجودة', 404));
  if (existing.status !== 'draft') return next(fail('الفاتورة ليست في حالة مسوّدة', 400));

  const userId = (res.locals.user as { id: number }).id;

  const items = db
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .all(id) as PurchaseItemRow[];

  db.transaction(() => {
    let batchesCreated = 0;

    const insertBatch = db.prepare(
      `INSERT INTO batches
         (medicine_id, supplier_id, purchase_item_id, batch_number, expiry_date,
          quantity, initial_quantity, purchase_cost)
       VALUES
         (@medicineId, @supplierId, @purchaseItemId, @batchNumber, @expiryDate,
          @quantity, @initialQuantity, @purchaseCost)`
    );

    const updateItemBatch = db.prepare(
      `UPDATE purchase_items SET batch_id = ? WHERE id = ?`
    );

    for (const item of items) {
      const batchInfo = insertBatch.run({
        medicineId: item.medicine_id,
        supplierId: existing.supplier_id ?? null,
        purchaseItemId: item.id,
        batchNumber: item.batch_number ?? null,
        expiryDate: item.expiry_date ?? null,
        quantity: item.quantity,
        initialQuantity: item.quantity,
        purchaseCost: item.unit_cost,
      });
      const batchId = Number(batchInfo.lastInsertRowid);
      updateItemBatch.run(batchId, item.id);
      batchesCreated++;
    }

    db.prepare(
      `UPDATE purchases
       SET status = 'confirmed', confirmed_at = datetime('now'), confirmed_by = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(userId, id);

    logActivity(req, {
      action: 'purchase.confirmed',
      entityType: 'purchase',
      entityId: id,
      newValues: { total: existing.total, itemCount: items.length, batchesCreated },
    });
  })();

  return res.status(200).json({ purchase: getPurchaseWithItems(id) });
};

export const reversePurchaseService = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id) as PurchaseRow | undefined;
  if (!existing) return next(fail('الفاتورة غير موجودة', 404));
  if (existing.status !== 'confirmed') return next(fail('يمكن عكس الفواتير المؤكدة فقط', 400));

  const reasonParsed = z.object({ reason: z.string().min(10, 'سبب العكس يجب أن لا يقل عن 10 أحرف') }).safeParse(req.body);
  if (!reasonParsed.success) return next(fail(reasonParsed.error.issues[0].message, 400));
  const { reason } = reasonParsed.data;

  const userId = (res.locals.user as { id: number }).id;

  const items = db
    .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
    .all(id) as PurchaseItemRow[];

  // Check if any batch has been partially sold before starting transaction
  for (const item of items) {
    if (!item.batch_id) continue;
    const batch = db
      .prepare('SELECT quantity, initial_quantity FROM batches WHERE id = ?')
      .get(item.batch_id) as BatchRow | undefined;
    if (batch && batch.quantity < batch.initial_quantity) {
      return next(fail('لا يمكن عكس الفاتورة لأن بعض الكميات بيعت بالفعل', 409));
    }
  }

  db.transaction(() => {
    for (const item of items) {
      if (!item.batch_id) continue;
      db.prepare('DELETE FROM batches WHERE id = ?').run(item.batch_id);
      db.prepare('UPDATE purchase_items SET batch_id = NULL WHERE id = ?').run(item.id);
    }

    db.prepare(
      `UPDATE purchases
       SET status = 'reversed', reversed_at = datetime('now'), reversed_by = ?,
           reversal_reason = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(userId, reason, id);

    // Delete any supplier payment linked to this purchase
    db.prepare('DELETE FROM supplier_payments WHERE purchase_id = ?').run(id);

    logActivity(req, {
      action: 'purchase.reversed',
      entityType: 'purchase',
      entityId: id,
      newValues: { reason },
    });
  })();

  return res.status(200).json({ purchase: getPurchaseWithItems(id) });
};
