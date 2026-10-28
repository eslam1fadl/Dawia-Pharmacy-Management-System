CREATE TABLE roles (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE users (
  id                   INTEGER PRIMARY KEY,
  username             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name            TEXT NOT NULL,
  password_hash        TEXT NOT NULL,
  role_id              INTEGER NOT NULL REFERENCES roles(id),
  is_active            INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO roles (name, label) VALUES
  ('manager', 'مدير'),
  ('pharmacist', 'صيدلي'),
  ('cashier', 'كاشير'),
  ('stock_keeper', 'مسؤول مخزون');