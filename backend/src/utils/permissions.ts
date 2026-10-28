export const PERMISSIONS = [
  'dashboard.view',
  'pos.sell', 'pos.discount', 'pos.cancel',
  'medicines.view', 'medicines.manage', 'medicines.edit_price',
  'inventory.view', 'inventory.adjust', 'expiry.view',
  'purchases.view', 'purchases.manage',
  'suppliers.view', 'suppliers.manage',
  'returns.manage', 'customers.manage', 'expenses.manage',
  'reports.sales', 'reports.profit', 'reports.inventory',
  'users.manage', 'activity.view', 'backup.manage', 'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];