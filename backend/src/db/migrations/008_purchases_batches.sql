-- Batches: each physical stock entry for a medicine
CREATE TABLE batches (
  id               INTEGER PRIMARY KEY,
  medicine_id      INTEGER NOT NULL REFERENCES medicines(id),
  supplier_id      INTEGER REFERENCES suppliers(id),
  purchase_item_id INTEGER, -- set after purchase confirmation
  batch_number     TEXT,
  expiry_date      TEXT,    -- ISO date YYYY-MM-DD, nullable
  quantity         INTEGER NOT NULL DEFAULT 0,  -- current remaining qty
  initial_quantity INTEGER NOT NULL DEFAULT 0,  -- qty at time of creation
  purchase_cost    INTEGER NOT NULL DEFAULT 0,  -- piastres per unit
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_batches_medicine ON batches(medicine_id);
CREATE INDEX idx_batches_expiry   ON batches(expiry_date) WHERE expiry_date IS NOT NULL;

-- Purchases: purchase invoices
CREATE TABLE purchases (
  id              INTEGER PRIMARY KEY,
  supplier_id     INTEGER REFERENCES suppliers(id),
  invoice_number  TEXT,
  invoice_date    TEXT NOT NULL DEFAULT (date('now')),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','confirmed','reversed')),
  subtotal        INTEGER NOT NULL DEFAULT 0,  -- piastres, sum of line_totals
  discount_amount INTEGER NOT NULL DEFAULT 0,  -- piastres, invoice-level discount
  total           INTEGER NOT NULL DEFAULT 0,  -- piastres = subtotal - discount_amount
  paid_amount     INTEGER NOT NULL DEFAULT 0,  -- piastres
  payment_method  TEXT,
  notes           TEXT,
  confirmed_at    TEXT,
  confirmed_by    INTEGER REFERENCES users(id),
  reversed_at     TEXT,
  reversed_by     INTEGER REFERENCES users(id),
  reversal_reason TEXT,
  created_by      INTEGER REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_status   ON purchases(status);
CREATE INDEX idx_purchases_date     ON purchases(invoice_date);

-- Purchase items
CREATE TABLE purchase_items (
  id           INTEGER PRIMARY KEY,
  purchase_id  INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  medicine_id  INTEGER NOT NULL REFERENCES medicines(id),
  batch_number TEXT,
  expiry_date  TEXT,
  quantity     INTEGER NOT NULL,
  unit_cost    INTEGER NOT NULL,   -- piastres
  discount_pct REAL NOT NULL DEFAULT 0,
  line_total   INTEGER NOT NULL,  -- piastres = quantity * unit_cost * (1 - discount_pct/100)
  batch_id     INTEGER REFERENCES batches(id)  -- set after confirmation
);
CREATE INDEX idx_purchase_items_purchase  ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_medicine  ON purchase_items(medicine_id);

-- Supplier payments
CREATE TABLE supplier_payments (
  id             INTEGER PRIMARY KEY,
  supplier_id    INTEGER NOT NULL REFERENCES suppliers(id),
  purchase_id    INTEGER REFERENCES purchases(id),  -- optional: link to invoice
  amount         INTEGER NOT NULL,   -- piastres
  payment_method TEXT NOT NULL DEFAULT 'نقدي',
  payment_date   TEXT NOT NULL DEFAULT (date('now')),
  notes          TEXT,
  created_by     INTEGER REFERENCES users(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
