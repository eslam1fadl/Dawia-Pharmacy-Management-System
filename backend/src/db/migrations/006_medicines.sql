CREATE TABLE categories (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1
);

INSERT INTO categories (name) VALUES
  ('مضادات حيوية'), ('مسكنات وخافضات حرارة'), ('أدوية البرد والكحة'),
  ('فيتامينات ومكملات'), ('أدوية الجهاز الهضمي'), ('أدوية الضغط والقلب'),
  ('أدوية السكر'), ('مستحضرات تجميل'), ('مستلزمات طبية'), ('أطفال');

-- الموردين (هنستخدمه في المشتريات، بس لازم يكون موجود لأن الدواء له مورد افتراضي)
CREATE TABLE suppliers (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  company         TEXT,
  phone           TEXT,
  address         TEXT,
  opening_balance INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- كل الأسعار بالقرش (integer): 50.75 جنيه = 5075
CREATE TABLE medicines (
  id                  INTEGER PRIMARY KEY,
  name                TEXT NOT NULL,
  scientific_name     TEXT,
  active_ingredient   TEXT,
  strength            TEXT,
  dosage_form         TEXT,
  pack_size           TEXT,
  barcode             TEXT,
  sku                 TEXT,
  manufacturer        TEXT,
  category_id         INTEGER REFERENCES categories(id),
  purchase_price      INTEGER NOT NULL DEFAULT 0,
  sale_price          INTEGER NOT NULL DEFAULT 0,
  reorder_level       INTEGER NOT NULL DEFAULT 0,
  default_supplier_id INTEGER REFERENCES suppliers(id),
  description         TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_medicines_barcode ON medicines(barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX idx_medicines_sku     ON medicines(sku)     WHERE sku IS NOT NULL;
CREATE INDEX idx_medicines_name       ON medicines(name);
CREATE INDEX idx_medicines_scientific ON medicines(scientific_name);

CREATE TABLE price_history (
  id          INTEGER PRIMARY KEY,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id),
  field       TEXT NOT NULL CHECK (field IN ('purchase_price', 'sale_price')),
  old_value   INTEGER NOT NULL,
  new_value   INTEGER NOT NULL,
  changed_by  INTEGER,
  changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_price_history_medicine ON price_history(medicine_id);