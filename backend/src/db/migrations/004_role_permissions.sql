WITH all_perms(permission) AS (VALUES
  ('dashboard.view'), ('pos.sell'), ('pos.discount'), ('pos.cancel'),
  ('medicines.view'), ('medicines.manage'), ('medicines.edit_price'),
  ('inventory.view'), ('inventory.adjust'), ('expiry.view'),
  ('purchases.view'), ('purchases.manage'),
  ('suppliers.view'), ('suppliers.manage'),
  ('returns.manage'), ('customers.manage'), ('expenses.manage'),
  ('reports.sales'), ('reports.profit'), ('reports.inventory'),
  ('users.manage'), ('activity.view'), ('backup.manage'), ('settings.manage'))
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission FROM roles r, all_perms p WHERE r.name = 'manager';

-- باقي الأدوار
WITH grants(role_name, permission) AS (VALUES
  ('pharmacist', 'dashboard.view'), ('pharmacist', 'pos.sell'), ('pharmacist', 'pos.discount'),
  ('pharmacist', 'pos.cancel'), ('pharmacist', 'medicines.view'), ('pharmacist', 'medicines.manage'),
  ('pharmacist', 'inventory.view'), ('pharmacist', 'inventory.adjust'), ('pharmacist', 'expiry.view'),
  ('pharmacist', 'purchases.view'), ('pharmacist', 'purchases.manage'), ('pharmacist', 'suppliers.view'),
  ('pharmacist', 'returns.manage'), ('pharmacist', 'customers.manage'),
  ('pharmacist', 'reports.sales'), ('pharmacist', 'reports.inventory'),

  ('cashier', 'pos.sell'), ('cashier', 'medicines.view'),
  ('cashier', 'inventory.view'), ('cashier', 'customers.manage'),

  ('stock_keeper', 'medicines.view'), ('stock_keeper', 'medicines.manage'),
  ('stock_keeper', 'inventory.view'), ('stock_keeper', 'inventory.adjust'), ('stock_keeper', 'expiry.view'),
  ('stock_keeper', 'purchases.view'), ('stock_keeper', 'purchases.manage'),
  ('stock_keeper', 'suppliers.view'), ('stock_keeper', 'reports.inventory'))
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, g.permission FROM grants g JOIN roles r ON r.name = g.role_name;