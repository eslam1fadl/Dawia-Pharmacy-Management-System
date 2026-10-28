import { db } from './client';
import { runMigrations } from './migrate';
import { hashPassword } from '../utils/password';

runMigrations();

const roles = db.prepare('SELECT id, name FROM roles').all() as { id: number; name: string }[];
const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

const defaultUsers = [
  {
    username: 'admin',
    fullName: 'مدير النظام',
    role: 'manager',
    password: 'admin123',
  },
  {
    username: 'pharmacist',
    fullName: 'صيدلي',
    role: 'pharmacist',
    password: 'pharm123',
  },
  {
    username: 'cashier',
    fullName: 'كاشير',
    role: 'cashier',
    password: 'cashier123',
  },
  {
    username: 'stock',
    fullName: 'مسؤول مخزون',
    role: 'stock_keeper',
    password: 'stock123',
  },
];

console.log(' جاري تهيئة المستخدمين الأساسيين...');

for (const u of defaultUsers) {
  const roleId = roleMap[u.role];
  if (!roleId) continue;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
  const hash = await hashPassword(u.password);

  if (existing) {
    db.prepare('UPDATE users SET full_name = ?, password_hash = ?, role_id = ?, must_change_password = 0, is_active = 1 WHERE username = ?')
      .run(u.fullName, hash, roleId, u.username);
    console.log(`✔ تم تحديث حساب: ${u.username} (${u.fullName}) - كلمة المرور: ${u.password}`);
  } else {
    db.prepare(
      `INSERT INTO users (username, full_name, password_hash, role_id, must_change_password, is_active)
       VALUES (?, ?, ?, ?, 0, 1)`
    ).run(u.username, u.fullName, hash, roleId);
    console.log(`تم إنشاء حساب جديد: ${u.username} (${u.fullName}) - كلمة المرور: ${u.password}`);
  }
}

console.log('\n اكتملت التهيئة بنجاح!');