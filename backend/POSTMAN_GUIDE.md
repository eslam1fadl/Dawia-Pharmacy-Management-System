# دليل استخدام Postman لاختبار Backend نظام الصيدلية

تم تجهيز ملفات Postman لتجربة واجهات برمجة التطبيقات (API) الخاصة بنظام الصيدلية بسهولة تامة.

---

## 📁 الملفات المتوفرة:

1. **مجموعة الطلبات (Collection):**  
   [`postman_collection.json`](./postman_collection.json)
2. **ملف البيئة (Environment - اختياري):**  
   [`postman_environment.json`](./postman_environment.json)

---

## 🚀 طريقة الاستيراد في Postman:

1. افتح تطبيق **Postman**.
2. اضغط على زر **Import** في أعلى اليسار.
3. اسحب ملف [`postman_collection.json`](./postman_collection.json) وأفلته داخل Postman (أو اضغط **Files** واختره).
4. *(اختياري)* يمكنك أيضاً استيراد [`postman_environment.json`](./postman_environment.json) واختيار بيئة `Pharmacy API (Local Environment)`.

> **ملاحظة:** تم تضمين المتغيرات الأساسية (Variables) داخل الـ Collection مباشرة، لذلك سيعمل معك فوراً بمجرد استيراد ملف الـ Collection فقط!

---

## 🔐 بيانات الدخول الافتراضية:

- **رابط السيرفر (`baseUrl`):** `http://localhost:4000`
- **اسم المستخدم (`username`):** `admin`
- **كلمة المرور (`password`):** `admin123`

> إذا لم تكن قد أنشأت مستخدم المدير بعد، شغّل الأمر التالي في مجلد `backend`:
> ```bash
> npm run seed
> ```

---

## 📋 الطلبات الموجودة في الـ Collection:

### 1. **فحص السيرفر (Health Check)**
- `GET /api/health`: للتحقق من الاتصال بقاعدة البيانات والحصول على اسم الصيدلية والأدوار المتاحة.

### 2. **المصادقة وإدارة الجلسات (Authentication)**
- `POST /api/auth/login`: تسجيل الدخول وتخزين كوكي الجلسة `pharmacy_session` تلقائياً في Postman.
- `GET /api/auth/me`: جلب بيانات المستخدم المسجّل وصلاحياته.
- `GET /api/auth/ping`: فحص الصلاحية والتحقق مما إذا كان يلزم تغيير كلمة المرور أولاً.
- `POST /api/auth/change-password`: تغيير كلمة المرور وقفل الجلسات الأخرى.
- `POST /api/auth/logout`: تسجيل الخروج وإلغاء الجلسة وحذف الكوكي.

### 3. **اختبارات الأخطاء والحالات الخاصة (Error Tests)**
- كلمة مرور خاطئة (`401 Unauthorized`)
- إرسال طلب فارغ بدون بيانات (`400 Bad Request`)
- محاولة طلب `/me` بدون تسجيل دخول (`401 Unauthorized`)
- كلمة مرور جديدة أقل من 8 أحرف (`400 Bad Request`)
- كلمة المرور الحالية غير صحيحة (`400 Bad Request`)
- تكرار كلمة المرور القديمة (`400 Bad Request`)
- طلب مسار غير موجود (`404 Not Found`)

---

## ⚙️ تشغيل السيرفر:

تأكد من تشغيل السيرفر في مجلد `backend` قبل البدء بالاختبار:
```bash
npm run dev
```
