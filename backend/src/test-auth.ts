import { db } from './db/client';
import { runMigrations } from './db/migrate';
import { hashPassword } from './utils/password';

const BASE = 'http://localhost:4000/api';
const USER = 'test_cashier';
const TEMP_PASS = 'Temp@1234';
const NEW_PASS = 'Better@5678';
const NEWER_PASS = 'Newest@9012';

type Jar = { cookie: string };
let passed = 0;
let failed = 0;

async function call(jar: Jar, method: string, path: string, body?: unknown) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jar.cookie ? { Cookie: jar.cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(';');
    const [name, value] = pair.split('=');
    jar.cookie = value ? `${name}=${value}` : '';
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { status: res.status, data };
}

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name}`);
    if (detail !== undefined) console.log('   النتيجة الفعلية:', JSON.stringify(detail));
  }
}

async function main() {
  runMigrations();
  try {
    await fetch(BASE + '/auth/me');
  } catch (e) {
    console.log('❌ مش قادر أوصل للسيرفر على', BASE);
    console.log('   السبب:', (e as any)?.cause?.code ?? (e as Error).message);
    console.log('   شغّل السيرفر في terminal تاني بـ: npm run dev');
    process.exit(1);
  }

  // مستخدم تجريبي جديد في كل مرة، بكلمة مرور مؤقتة
  db.prepare('DELETE FROM users WHERE username = ?').run(USER);
  const role = db.prepare("SELECT id FROM roles WHERE name = 'cashier'").get() as { id: number };
  db.prepare(
    `INSERT INTO users (username, full_name, password_hash, role_id, must_change_password) VALUES (?,?,?,?,1)`
  ).run(USER, 'كاشير تجريبي', await hashPassword(TEMP_PASS), role.id);

  // نفتكر آخر رقم في سجل النشاط عشان نمسح اللي الاختبار يعمله بس
  const lastLogId = (db.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM activity_log').get() as { m: number }).m;

  const A: Jar = { cookie: '' };
  let r;

  console.log('\n--- الدخول ---');
  r = await call(A, 'GET', '/auth/me');
  check('/me قبل الدخول يرجّع 401', r.status === 401, r);

  r = await call(A, 'POST', '/auth/login', { username: USER, password: 'wrong' });
  check('دخول بكلمة مرور غلط يرجّع 401', r.status === 401, r);

  r = await call(A, 'POST', '/auth/login', {});
  check('دخول بدون بيانات يرجّع 400', r.status === 400, r);

  r = await call(A, 'POST', '/auth/login', { username: USER, password: TEMP_PASS });
  check('دخول بالكلمة المؤقتة ينجح (200) والكوكي اتحفظ', r.status === 200 && A.cookie.startsWith('pharmacy_session='), r);

  r = await call(A, 'GET', '/auth/me');
  check('/me بيرجّع المستخدم ومعاه mustChangePassword = 1', r.status === 200 && r.data.user?.username === USER && r.data.user?.mustChangePassword === 1, r);

  console.log('\n--- الحجب قبل تغيير كلمة المرور ---');
  r = await call(A, 'GET', '/auth/ping');
  check('/ping بيترفض (403) قبل تغيير كلمة المرور', r.status === 403, r);

  console.log('\n--- تغيير كلمة المرور ---');
  r = await call(A, 'POST', '/auth/change-password', { currentPassword: 'xxx', newPassword: NEW_PASS });
  check('كلمة مرور حالية غلط تترفض (400)', r.status === 400, r);

  r = await call(A, 'POST', '/auth/change-password', { currentPassword: TEMP_PASS, newPassword: '123' });
  check('كلمة جديدة قصيرة تترفض (400)', r.status === 400, r);

  r = await call(A, 'POST', '/auth/change-password', { currentPassword: TEMP_PASS, newPassword: TEMP_PASS });
  check('كلمة جديدة نفس القديمة تترفض (400)', r.status === 400, r);

  r = await call(A, 'POST', '/auth/change-password', { currentPassword: TEMP_PASS, newPassword: NEW_PASS });
  check('التغيير الصحيح ينجح (200)', r.status === 200, r);

  r = await call(A, 'GET', '/auth/ping');
  check('/ping بيشتغل (pong) بعد التغيير', r.status === 200 && r.data.message === 'pong', r);

  console.log('\n--- الصلاحيات ---');
  r = await call(A, 'GET', '/auth/me');
  check('الكاشير معاه pos.sell ومعهوش users.manage', r.data.user?.permissions?.includes('pos.sell') && !r.data.user?.permissions?.includes('users.manage'), r);
  r = await call(A, 'GET', '/auth/admin-ping');
  check('الكاشير ممنوع من route المدير (403)', r.status === 403, r);

  db.prepare('DELETE FROM users WHERE username = ?').run('test_manager');
  const mgrRole = db.prepare("SELECT id FROM roles WHERE name = 'manager'").get() as { id: number };
  db.prepare(
    `INSERT INTO users (username, full_name, password_hash, role_id, must_change_password) VALUES (?,?,?,?,0)`
  ).run('test_manager', 'مدير تجريبي', await hashPassword('Mgr@123456'), mgrRole.id);
  const M: Jar = { cookie: '' };
  await call(M, 'POST', '/auth/login', { username: 'test_manager', password: 'Mgr@123456' });
  r = await call(M, 'GET', '/auth/admin-ping');
  check('المدير يدخل route المدير (200)', r.status === 200, r);

  r = await call(A, 'GET', '/activity');
  check('الكاشير ممنوع من سجل النشاط (403)', r.status === 403, r);
  r = await call(M, 'GET', '/activity');
  check('المدير يشوف سجل النشاط (200)', r.status === 200 && Array.isArray(r.data.items), r);

  console.log('\n--- تسجيل الدخول بعد تغيير كلمة المرور ---');
  const fresh: Jar = { cookie: '' };
  r = await call(fresh, 'POST', '/auth/login', { username: USER, password: TEMP_PASS });
  check('الكلمة القديمة ما بقتش تدخل (401)', r.status === 401, r);

  r = await call(fresh, 'POST', '/auth/login', { username: USER, password: NEW_PASS });
  check('الكلمة الجديدة بتدخل (200)', r.status === 200, r);

  console.log('\n--- قفل الجلسات القديمة بعد تغيير كلمة المرور ---');
  const B: Jar = { cookie: fresh.cookie }; // جهاز تاني مسجّل بالكلمة الجديدة
  const C: Jar = { cookie: '' };
  await call(C, 'POST', '/auth/login', { username: USER, password: NEW_PASS });
  r = await call(C, 'POST', '/auth/change-password', { currentPassword: NEW_PASS, newPassword: NEWER_PASS });
  check('تغيير كلمة المرور من الجهاز C ينجح', r.status === 200, r);
  r = await call(B, 'GET', '/auth/me');
  check('جلسة الجهاز B اتقفلت (401)', r.status === 401, r);
  r = await call(C, 'GET', '/auth/me');
  check('جلسة الجهاز C (اللي غيّر) فضلت شغالة', r.status === 200, r);

  console.log('\n--- الخروج ---');
  r = await call(C, 'POST', '/auth/logout');
  check('الخروج ينجح (200)', r.status === 200, r);
  r = await call(C, 'GET', '/auth/me');
  check('/me بعد الخروج يرجّع 401', r.status === 401, r);

  console.log('\n--- القفل بعد المحاولات الفاشلة ---');
  const L: Jar = { cookie: '' };
  const ghost = 'lock_test_' + Date.now(); // اسم وهمي عشان ما نقفلش مستخدم حقيقي
  const codes: number[] = [];
  for (let i = 0; i < 6; i++) {
    r = await call(L, 'POST', '/auth/login', { username: ghost, password: 'bad' });
    codes.push(r.status);
  }
  check(
    `أول 5 محاولات 401 والسادسة 429 (الفعلي: ${codes.join(', ')})`,
    codes.slice(0, 5).every((c) => c === 401) && codes[5] === 429,
    codes
  );

  console.log('\n--- سجل النشاط ---');
  r = await call(M, 'GET', '/activity?pageSize=200');
  const mine = (r.data.items ?? []).filter((i: any) => i.id > lastLogId);
  const has = (action: string, username?: string) =>
    mine.some((i: any) => i.action === action && (username === undefined || i.username === username));
  check('تسجيل الدخول اتسجّل باسم المستخدم', has('auth.login', USER), mine.map((i: any) => i.action));
  check('محاولة الدخول الفاشلة اتسجّلت', has('auth.login_failed'), mine.map((i: any) => i.action));
  check('تغيير كلمة المرور اتسجّل', has('auth.password_changed', USER), mine.map((i: any) => i.action));
  check('تسجيل الخروج اتسجّل', has('auth.logout', USER), mine.map((i: any) => i.action));
  check('كلمات المرور ما اتخزنتش في السجل', !JSON.stringify(mine).includes(NEW_PASS) && !JSON.stringify(mine).includes(TEMP_PASS));
  r = await call(M, 'GET', '/activity?action=auth.logout&pageSize=5');
  check('فلتر action شغال (كله auth.logout)', r.data.items?.length > 0 && r.data.items.every((i: any) => i.action === 'auth.logout'), r);

  // تنظيف
  db.prepare('DELETE FROM activity_log WHERE id > ?').run(lastLogId);
  db.prepare('DELETE FROM users WHERE username = ?').run(USER);
  db.prepare('DELETE FROM users WHERE username = ?').run('test_manager');

  console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
  process.exit(failed ? 1 : 0);
}

main();