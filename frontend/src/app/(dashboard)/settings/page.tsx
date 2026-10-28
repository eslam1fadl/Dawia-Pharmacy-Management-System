"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  KeyRound,
  Tag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Save,
  ShieldOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

interface SettingsMap {
  "pharmacy.name": string;
  "pharmacy.phone": string;
  "pharmacy.address": string;
  "currency.symbol": string;
  "date.format": string;
}

// ─── Helper components ───────────────────────────────────────────────────────

function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
        type === "success"
          ? "bg-blue-50 border-blue-200 text-blue-800"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
      ) : (
        <AlertCircle size={15} className="text-red-500 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="border-none bg-transparent cursor-pointer p-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-[#173B67] mb-1">
      {children}
      {required && <span className="text-red-500 mr-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] bg-white disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
    />
  );
}

function PrimaryBtn({
  children,
  onClick,
  loading,
  type = "button",
  disabled,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-colors border-none cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-xs"}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#173B67] font-semibold transition-colors cursor-pointer ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"}`}
    >
      {children}
    </button>
  );
}

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { id: "pharmacy", label: "بيانات الصيدلية", icon: Building2 },
  { id: "categories", label: "التصنيفات الدوائية", icon: Tag },
  { id: "payment", label: "طرق الدفع", icon: CreditCard },
  { id: "password", label: "تغيير كلمة المرور", icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Tab: Pharmacy Info ───────────────────────────────────────────────────────

function PharmacyTab({ canManage }: { canManage: boolean }) {
  const [form, setForm] = useState<SettingsMap>({
    "pharmacy.name": "",
    "pharmacy.phone": "",
    "pharmacy.address": "",
    "currency.symbol": "ج.م",
    "date.format": "ar-EG",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm((prev) => ({
            ...prev,
            "pharmacy.name": d.settings["pharmacy.name"] ?? "",
            "pharmacy.phone": d.settings["pharmacy.phone"] ?? "",
            "pharmacy.address": d.settings["pharmacy.address"] ?? "",
            "currency.symbol": d.settings["currency.symbol"] ?? "ج.م",
            "date.format": d.settings["date.format"] ?? "ar-EG",
          }));
        }
      })
      .catch(() => setError("تعذّر تحميل بيانات الصيدلية"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof SettingsMap) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!form["pharmacy.name"].trim()) {
      setError("اسم الصيدلية مطلوب");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ الإعدادات");
      setSuccess("تم حفظ بيانات الصيدلية بنجاح");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#64748B]">جاري التحميل...</div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-5 max-w-xl">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {!canManage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <ShieldOff size={14} />
          <span>عرض فقط — ليس لديك صلاحية تعديل الإعدادات</span>
        </div>
      )}

      <div>
        <FieldLabel required>اسم الصيدلية</FieldLabel>
        <Input
          value={form["pharmacy.name"]}
          onChange={set("pharmacy.name")}
          placeholder="اسم الصيدلية"
          disabled={!canManage}
        />
      </div>

      <div>
        <FieldLabel>رقم الهاتف</FieldLabel>
        <Input
          value={form["pharmacy.phone"]}
          onChange={set("pharmacy.phone")}
          placeholder="01xxxxxxxxx"
          disabled={!canManage}
        />
      </div>

      <div>
        <FieldLabel>العنوان</FieldLabel>
        <Input
          value={form["pharmacy.address"]}
          onChange={set("pharmacy.address")}
          placeholder="المحافظة، المدينة، الشارع"
          disabled={!canManage}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>رمز العملة</FieldLabel>
          <Input
            value={form["currency.symbol"]}
            onChange={set("currency.symbol")}
            placeholder="ج.م"
            disabled={!canManage}
          />
        </div>
        <div>
          <FieldLabel>تنسيق التاريخ</FieldLabel>
          <select
            value={form["date.format"]}
            onChange={(e) => set("date.format")(e.target.value)}
            disabled={!canManage}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] bg-white disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
          >
            <option value="ar-EG">عربي (ar-EG)</option>
            <option value="en-GB">إنجليزي (en-GB)</option>
            <option value="en-US">أمريكي (en-US)</option>
          </select>
        </div>
      </div>

      {canManage && (
        <PrimaryBtn onClick={handleSave} loading={saving}>
          <Save size={14} />
          {saving ? "جاري الحفظ..." : "حفظ البيانات"}
        </PrimaryBtn>
      )}
    </div>
  );
}

// ─── Tab: Categories ─────────────────────────────────────────────────────────

function CategoriesTab({ canManage }: { canManage: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add new category
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/settings/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setError("تعذّر تحميل التصنيفات"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إضافة التصنيف");
      setSuccess("تمت إضافة التصنيف بنجاح");
      setNewName("");
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "حدث خطأ");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    setEditLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تعديل التصنيف");
      setSuccess("تم تعديل التصنيف بنجاح");
      setEditId(null);
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "حدث خطأ");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    if (!cat.isActive) {
      // Activating — no confirm needed
    } else {
      if (!confirm(`هل تريد إيقاف تصنيف "${cat.name}"؟ سيؤثر ذلك على الأدوية المرتبطة به.`)) return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/settings/categories/${cat.id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تغيير حالة التصنيف");
      setSuccess(data.message || "تم تغيير الحالة");
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "حدث خطأ");
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-[#64748B]">جاري التحميل...</div>;

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748B]">
          إجمالي التصنيفات: <span className="font-bold text-[#173B67]">{categories.length}</span>
          {" · "}
          نشط: <span className="font-bold text-green-700">{categories.filter((c) => c.isActive).length}</span>
        </p>
        {canManage && (
          <PrimaryBtn small onClick={() => { setShowAdd(true); setNewName(""); }}>
            <Plus size={13} />
            تصنيف جديد
          </PrimaryBtn>
        )}
      </div>

      {showAdd && canManage && (
        <div className="flex gap-2 items-center p-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC]">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="اسم التصنيف الجديد"
            className="flex-1 py-2 px-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6]"
          />
          <PrimaryBtn small onClick={handleAdd} loading={adding}>
            <Save size={12} />
            {adding ? "جاري الحفظ..." : "حفظ"}
          </PrimaryBtn>
          <GhostBtn small onClick={() => setShowAdd(false)}>
            <X size={12} />
            إلغاء
          </GhostBtn>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-right text-[#64748B] border-b border-[#CBD5E1]">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">اسم التصنيف</th>
              <th className="py-2.5 px-3 font-semibold text-center">الحالة</th>
              {canManage && <th className="py-2.5 px-3 font-semibold text-center">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={cat.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-3 text-[#94A3B8]">{i + 1}</td>
                <td className="py-2.5 px-3">
                  {editId === cat.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(cat.id); if (e.key === "Escape") setEditId(null); }}
                        className="py-1.5 px-2 rounded-lg border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] w-40"
                      />
                      <button
                        onClick={() => handleEdit(cat.id)}
                        disabled={editLoading}
                        className="text-[#2563EB] border-none bg-transparent cursor-pointer p-0 disabled:opacity-50"
                      >
                        <Save size={13} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-[#94A3B8] border-none bg-transparent cursor-pointer p-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-[#173B67]">{cat.name}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-[#64748B]"
                    }`}
                  >
                    {cat.isActive ? "نشط" : "موقوف"}
                  </span>
                </td>
                {canManage && (
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="تعديل الاسم"
                        onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-[#2563EB] border-none bg-transparent cursor-pointer transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        title={cat.isActive ? "إيقاف التصنيف" : "تفعيل التصنيف"}
                        onClick={() => handleToggle(cat)}
                        className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                          cat.isActive
                            ? "hover:bg-red-50 text-red-500"
                            : "hover:bg-green-50 text-green-600"
                        }`}
                      >
                        {cat.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                  لا توجد تصنيفات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Payment Methods ─────────────────────────────────────────────────────

function PaymentTab({ canManage }: { canManage: boolean }) {
  const [methods, setMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMethod, setNewMethod] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/payment-methods")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods ?? []))
      .catch(() => setError("تعذّر تحميل طرق الدفع"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methods: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ طرق الدفع");
      setMethods(data.methods ?? updated);
      setSuccess("تم حفظ طرق الدفع بنجاح");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    if (methods.includes(trimmed)) { setError("طريقة الدفع موجودة بالفعل"); return; }
    const updated = [...methods, trimmed];
    setNewMethod("");
    save(updated);
  };

  const handleDelete = (m: string) => {
    if (!confirm(`هل تريد حذف طريقة الدفع "${m}"؟`)) return;
    save(methods.filter((x) => x !== m));
  };

  if (loading) return <div className="p-8 text-center text-xs text-[#64748B]">جاري التحميل...</div>;

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4 max-w-md">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {!canManage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <ShieldOff size={14} />
          <span>عرض فقط — ليس لديك صلاحية تعديل طرق الدفع</span>
        </div>
      )}

      <div className="space-y-2">
        {methods.map((m) => (
          <div
            key={m}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC]"
          >
            <span className="text-xs font-semibold text-[#173B67]">{m}</span>
            {canManage && (
              <button
                onClick={() => handleDelete(m)}
                disabled={saving || methods.length <= 1}
                title="حذف"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {methods.length === 0 && (
          <p className="text-xs text-[#94A3B8] text-center py-4">لا توجد طرق دفع</p>
        )}
      </div>

      {canManage && (
        <div className="flex gap-2 items-center pt-2">
          <input
            type="text"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="أضف طريقة دفع جديدة..."
            className="flex-1 py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6]"
          />
          <PrimaryBtn small onClick={handleAdd} loading={saving} disabled={!newMethod.trim()}>
            <Plus size={13} />
            إضافة
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Change Password ─────────────────────────────────────────────────────

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("كلمة المرور الجديدة 8 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تغيير كلمة المرور");
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      const err = e as Error;
      setPwError(err?.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4 max-w-md">
      {pwError && <Alert type="error" message={pwError} onClose={() => setPwError(null)} />}
      {pwSuccess && (
        <Alert
          type="success"
          message="تم تغيير كلمة المرور بنجاح! تم إنهاء الجلسات الأخرى للحماية."
          onClose={() => setPwSuccess(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel required>كلمة المرور الحالية</FieldLabel>
          <Input
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
          />
        </div>
        <div>
          <FieldLabel required>كلمة المرور الجديدة</FieldLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="8 أحرف على الأقل"
          />
        </div>
        <div>
          <FieldLabel required>تأكيد كلمة المرور الجديدة</FieldLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
          />
        </div>
        <PrimaryBtn type="submit" loading={loading}>
          <Save size={14} />
          {loading ? "جاري التحديث..." : "حفظ كلمة المرور"}
        </PrimaryBtn>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pharmacy");

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const canManage = !!(user?.permissions?.includes("settings.manage"));

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <PageHeader
        title="الإعدادات"
        description="إدارة إعدادات الصيدلية والتصنيفات وطرق الدفع وكلمة المرور"
      />

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-transparent text-[#64748B] hover:text-[#173B67] hover:bg-[#F1F5F9]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "pharmacy" && <PharmacyTab canManage={canManage} />}
      {activeTab === "categories" && <CategoriesTab canManage={canManage} />}
      {activeTab === "payment" && <PaymentTab canManage={canManage} />}
      {activeTab === "password" && <PasswordTab />}
    </div>
  );
}
