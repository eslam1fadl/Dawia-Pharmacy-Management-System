import { db } from './db/client';
import { call, check, makeUser, maxId, section, setup, summary } from './test-helpers';

const USERS = ['t_manager', 't_pharm', 't_cashier'];

async function main() {
  await setup();

  // نفتكر آخر أرقام عشان نمسح اللي الاختبار يعمله بس
  const last = {
    medicines: maxId('medicines'),
    priceHistory: maxId('price_history'),
    activity: maxId('activity_log'),
  };

  const manager = await makeUser('t_manager', 'manager');
  const pharm = await makeUser('t_pharm', 'pharmacist'); // معاه medicines.manage بس مش edit_price
  const cashier = await makeUser('t_cashier', 'cashier'); // معاه medicines.view بس
  let r;

  const BARCODE = '6221234' + Date.now().toString().slice(-6);

  section('الصلاحيات');
  r = await call(cashier, 'GET', '/medicines');
  check('الكاشير يشوف الأدوية (200)', r.status === 200, r);
  r = await call(cashier, 'POST', '/medicines', { name: 'باراسيتامول' });
  check('الكاشير ممنوع من إضافة دواء (403)', r.status === 403, r);
  r = await call({ cookie: '' }, 'GET', '/medicines');
  check('من غير تسجيل دخول (401)', r.status === 401, r);

  section('إضافة دواء');
  r = await call(pharm, 'POST', '/medicines', { name: '' });
  check('اسم فاضي يترفض (400)', r.status === 400, r);
  r = await call(pharm, 'POST', '/medicines', { name: 'دواء تجريبي', salePrice: -5 });
  check('سعر سالب يترفض (400)', r.status === 400, r);
  r = await call(pharm, 'POST', '/medicines', { name: 'دواء تجريبي', salePrice: 50.75 });
  check('سعر بكسور يترفض (لازم قروش صحيحة) (400)', r.status === 400, r);
  r = await call(pharm, 'POST', '/medicines', { name: 'دواء تجريبي', categoryId: 9999 });
  check('تصنيف غير موجود يترفض (400)', r.status === 400, r);

  r = await call(pharm, 'POST', '/medicines', {
    name: 'بنادول اكسترا',
    scientificName: 'Paracetamol + Caffeine',
    activeIngredient: 'Paracetamol',
    strength: '500mg',
    dosageForm: 'أقراص',
    packSize: '24 قرص',
    barcode: BARCODE,
    categoryId: 2,
    purchasePrice: 4000,
    salePrice: 5075,
    reorderLevel: 10,
  });
  const med = r.data.medicine;
  check('الصيدلي يضيف دواء (201)', r.status === 201 && med?.id > 0, r);
  check('الأسعار بترجع بالقروش زي ما اتبعتت', med?.salePrice === 5075 && med?.purchasePrice === 4000, med);
  check('اسم التصنيف بيرجع مع الدواء', med?.categoryName === 'مسكنات وخافضات حرارة', med);
  check('الدواء الجديد نشط (isActive = true)', med?.isActive === true, med);

  section('منع التكرار');
  r = await call(pharm, 'POST', '/medicines', { name: 'دواء تاني', barcode: BARCODE });
  check('باركود مكرر يترفض (409)', r.status === 409 && r.data.error.includes('بنادول'), r);

  r = await call(pharm, 'POST', '/medicines', { name: 'بدون باركود 1', barcode: '' });
  const noBc1 = r.data.medicine;
  r = await call(pharm, 'POST', '/medicines', { name: 'بدون باركود 2', barcode: '   ' });
  check('أكتر من دواء من غير باركود مسموح (الفاضي = null)', r.status === 201 && noBc1?.barcode === null, r);

  section('القراءة والبحث');
  r = await call(cashier, 'GET', `/medicines/${med.id}`);
  check('قراءة دواء بالرقم (200)', r.status === 200 && r.data.medicine.name === 'بنادول اكسترا', r);
  r = await call(cashier, 'GET', '/medicines/999999');
  check('دواء غير موجود (404)', r.status === 404, r);
  r = await call(cashier, 'GET', '/medicines?q=بنادول');
  check('بحث بجزء من الاسم', r.data.items?.some((m: any) => m.id === med.id), r);
  r = await call(cashier, 'GET', '/medicines?q=paracetamol');
  check('بحث بالاسم العلمي (حروف صغيرة/كبيرة)', r.data.items?.some((m: any) => m.id === med.id), r);
  r = await call(cashier, 'GET', `/medicines?q=${BARCODE}`);
  check('بحث بالباركود', r.data.items?.length === 1 && r.data.items[0].id === med.id, r);
  r = await call(cashier, 'GET', '/medicines?categoryId=2&pageSize=1');
  check('فلتر التصنيف والـ pagination (total أكبر من pageSize)', r.status === 200 && r.data.items.length === 1 && r.data.total >= 1, r);
  r = await call(cashier, 'GET', '/medicines/categories');
  check('قائمة التصنيفات (10 تصنيفات)', r.status === 200 && r.data.categories.length >= 10, r);

  section('التعديل');
  r = await call(pharm, 'PATCH', `/medicines/${med.id}`, { strength: '1000mg', reorderLevel: 20 });
  check('الصيدلي يعدّل بيانات عادية (200)', r.status === 200 && r.data.medicine.strength === '1000mg' && r.data.medicine.reorderLevel === 20, r);
  r = await call(pharm, 'PATCH', `/medicines/${med.id}`, { strength: '1000mg' });
  check('تعديل من غير تغيير فعلي بيرجّع "لا يوجد تغيير"', r.status === 200 && r.data.message === 'لا يوجد تغيير', r);
  r = await call(pharm, 'PATCH', `/medicines/${med.id}`, { salePrice: 6000 });
  check('الصيدلي ممنوع من تعديل السعر (403)', r.status === 403, r);
  r = await call(pharm, 'GET', `/medicines/${med.id}`);
  check('والسعر فضل زي ما هو', r.data.medicine.salePrice === 5075, r);

  r = await call(manager, 'PATCH', `/medicines/${med.id}`, { salePrice: 6000, purchasePrice: 4500 });
  check('المدير يعدّل السعر (200)', r.status === 200 && r.data.medicine.salePrice === 6000 && r.data.medicine.purchasePrice === 4500, r);

  r = await call(pharm, 'PATCH', `/medicines/${noBc1.id}`, { barcode: BARCODE });
  check('تعديل الباركود لقيمة مستخدمة يترفض (409)', r.status === 409, r);
  r = await call(pharm, 'PATCH', `/medicines/${noBc1.id}`, { name: 'x' });
  check('اسم أقل من حرفين يترفض (400)', r.status === 400, r);
  r = await call(pharm, 'PATCH', '/medicines/999999', { name: 'اسم جديد' });
  check('تعديل دواء غير موجود (404)', r.status === 404, r);

  section('سجل الأسعار وسجل النشاط');
  r = await call(cashier, 'GET', `/medicines/${med.id}/price-history`);
  const h = r.data.history ?? [];
  check('سجل الأسعار فيه تغييرين (البيع والشراء)', h.length === 2, h);
  const sale = h.find((x: any) => x.field === 'sale_price');
  check('سجل البيع: من 5075 إلى 6000 باسم المدير', sale?.oldValue === 5075 && sale?.newValue === 6000 && sale?.changedBy === 't_manager', sale);

  r = await call(manager, 'GET', '/activity?action=medicine.&pageSize=100');
  const logs = (r.data.items ?? []).filter((i: any) => i.id > last.activity && i.entityId === String(med.id));
  const priceLog = logs.find((i: any) => i.action === 'medicine.price_changed');
  check('تعديل السعر اتسجّل في سجل النشاط بالقيمة القديمة والجديدة', priceLog?.newValues?.salePrice?.old === 5075 && priceLog?.newValues?.salePrice?.new === 6000, logs);
  check('إضافة الدواء وتعديله اتسجّلوا', logs.some((i: any) => i.action === 'medicine.created') && logs.some((i: any) => i.action === 'medicine.updated'), logs.map((i: any) => i.action));

  section('الأرشفة');
  r = await call(pharm, 'PATCH', `/medicines/${med.id}/archive`);
  check('أرشفة الدواء (200)', r.status === 200 && r.data.medicine.isActive === false, r);
  r = await call(cashier, 'GET', `/medicines?q=${BARCODE}`);
  check('الدواء المؤرشف مش بيظهر في القائمة العادية', r.data.items?.length === 0, r);
  r = await call(cashier, 'GET', `/medicines?q=${BARCODE}&status=archived`);
  check('بيظهر في فلتر المؤرشف', r.data.items?.length === 1, r);
  r = await call(cashier, 'GET', `/medicines/${med.id}`);
  check('وفضل ينفع يتقرا بالرقم (عشان الفواتير القديمة)', r.status === 200, r);
  r = await call(pharm, 'POST', '/medicines', { name: 'نسخة تانية', barcode: BARCODE });
  check('باركود الدواء المؤرشف لسه محجوز (409)', r.status === 409, r);
  r = await call(cashier, 'PATCH', `/medicines/${med.id}/restore`);
  check('الكاشير ممنوع من الاستعادة (403)', r.status === 403, r);
  r = await call(pharm, 'PATCH', `/medicines/${med.id}/restore`);
  check('استعادة الدواء (200)', r.status === 200 && r.data.medicine.isActive === true, r);

  // تنظيف
  db.prepare('DELETE FROM price_history WHERE id > ?').run(last.priceHistory);
  db.prepare('DELETE FROM medicines WHERE id > ?').run(last.medicines);
  db.prepare('DELETE FROM activity_log WHERE id > ?').run(last.activity);
  for (const u of USERS) db.prepare('DELETE FROM users WHERE username = ?').run(u);

  summary();
}

main();