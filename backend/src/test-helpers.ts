import { db } from './db/client';
import { runMigrations } from './db/migrate';
import { hashPassword } from './utils/password';

export const BASE = 'http://localhost:4000/api';
export type Jar = { cookie: string };

let passed = 0;
let failed = 0;

export async function call(jar: Jar, method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jar.cookie ? { Cookie: jar.cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(';');
    const [name, value] = pair.split('=');
    jar.cookie = value ? `${name}=${value}` : '';
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, data };
}

export function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}`);
    if (detail !== undefined) console.log('   النتيجة الفعلية:', JSON.stringify(detail));
  }
}

export function section(title: string) {
  console.log(`\n--- ${title} ---`);
}

export function summary() {
  console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
  process.exit(failed ? 1 : 0);
}

/** يجهّز القاعدة ويتأكد إن السيرفر شغال، وإلا يوقف الاختبار برسالة واضحة */
export async function setup() {
  runMigrations();
  try {
    await fetch(BASE + '/auth/me');
  } catch (e) {
    console.log('❌ مش قادر أوصل للسيرفر على', BASE);
    console.log('   السبب:', (e as any)?.cause?.code ?? (e as Error).message);
    console.log('   شغّل السيرفر في terminal تاني بـ: npm run dev');
    process.exit(1);
  }
}

/** يعمل مستخدم تجريبي بدور معيّن (من غير ما يحتاج يغيّر كلمة المرور) ويسجّل دخوله */
export async function makeUser(username: string, roleName: string): Promise<Jar> {
  const password = 'Test@12345';
  db.prepare('DELETE FROM users WHERE username = ?').run(username);
  const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as { id: number };
  db.prepare(
    `INSERT INTO users (username, full_name, password_hash, role_id, must_change_password) VALUES (?,?,?,?,0)`
  ).run(username, `تجريبي ${roleName}`, await hashPassword(password), role.id);
  const jar: Jar = { cookie: '' };
  await call(jar, 'POST', '/auth/login', { username, password });
  return jar;
}

export const maxId = (table: string): number =>
  (db.prepare(`SELECT COALESCE(MAX(id), 0) AS m FROM ${table}`).get() as { m: number }).m;