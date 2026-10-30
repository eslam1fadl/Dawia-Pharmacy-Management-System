"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Archive,
  RotateCcw,
  Eye,
  CreditCard,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";
// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  openingBalance: number; // piastres
  balance: number;        // piastres (owed to supplier)
  isActive: boolean;
  createdAt: string;
}

interface AccountEntry {
  id: number;
  type: "purchase" | "payment";
  date: string;
  description: string;
  debit: number;   // piastres added to debt
  credit: number;  // piastres paid
  running: number; // running balance piastres
}

interface SuppliersResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Supplier[];
}

interface SupplierFormData {
  name: string;
  company: string;
  phone: string;
  address: string;
  notes: string;
  openingBalance: string; // EGP string
}

interface PaymentFormData {
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (p: number) => (p / 100).toFixed(2) + " ج.م";
const today = () => new Date().toISOString().slice(0, 10);

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all ${type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
    >
      {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      {msg}
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  message,
  confirmLabel = "تأكيد",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-[#173B67]">{title}</h3>
        <p className="text-sm text-[#64748B]">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold cursor-pointer ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Supplier Form Modal ─────────────────────────────────────────────────────
function SupplierModal({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!supplier;
  const [form, setForm] = useState<SupplierFormData>({
    name: supplier?.name ?? "",
    company: supplier?.company ?? "",
    phone: supplier?.phone ?? "",
    address: supplier?.address ?? "",
    notes: supplier?.notes ?? "",
    openingBalance: supplier ? (supplier.openingBalance / 100).toFixed(2) : "0",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = (k: keyof SupplierFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("اسم المورد مطلوب"); return; }
    setError("");

    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          company: form.company.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        };
        if (!isEdit) {
          payload.openingBalance = Math.round((parseFloat(form.openingBalance) || 0) * 100);
        }

        const url = isEdit ? `/api/suppliers/${supplier!.id}` : `/api/suppliers`;
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطأ في الحفظ");
        onSaved();
      } catch (err: any) {
        setError(err.message || "خطأ غير متوقع");
      }
    });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
  const labelCls = "text-xs font-semibold text-[#173B67] block mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#CBD5E1]">
          <h2 className="text-base font-bold text-[#173B67]">{isEdit ? "تعديل المورد" : "إضافة مورد جديد"}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#173B67] cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>اسم المورد <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.name} onChange={set("name")} placeholder="اسم المورد" />
          </div>
          <div>
            <label className={labelCls}>اسم الشركة</label>
            <input className={inputCls} value={form.company} onChange={set("company")} placeholder="اسم الشركة (اختياري)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>رقم الهاتف</label>
              <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="01xxxxxxxxx" />
            </div>
            {!isEdit && (
              <div>
                <label className={labelCls}>الرصيد الافتتاحي (ج.م)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.openingBalance} onChange={set("openingBalance")} />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>العنوان</label>
            <input className={inputCls} value={form.address} onChange={set("address")} placeholder="العنوان (اختياري)" />
          </div>
          <div>
            <label className={labelCls}>ملاحظات</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={set("notes")} placeholder="ملاحظات (اختياري)" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer border-none"
            >
              {isPending ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة المورد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  supplier,
  paymentMethods,
  onClose,
  onSaved,
}: {
  supplier: Supplier;
  paymentMethods: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PaymentFormData>({
    amount: "",
    paymentMethod: paymentMethods[0] || "نقدي",
    paymentDate: today(),
    notes: "",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = (k: keyof PaymentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError("أدخل مبلغ صحيح أكبر من صفر"); return; }
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/suppliers/${supplier.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            paymentMethod: form.paymentMethod,
            paymentDate: form.paymentDate,
            notes: form.notes.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطأ في تسجيل الدفعة");
        onSaved();
      } catch (err: any) {
        setError(err.message || "خطأ غير متوقع");
      }
    });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
  const labelCls = "text-xs font-semibold text-[#173B67] block mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#CBD5E1]">
          <div>
            <h2 className="text-base font-bold text-[#173B67]">تسجيل دفعة</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{supplier.name} — المستحق: <span className="text-red-600 font-semibold">{fmt(supplier.balance)}</span></p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#173B67] cursor-pointer"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>المبلغ (ج.م) <span className="text-red-500">*</span></label>
            <input className={inputCls} type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set("amount")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>طريقة الدفع <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.paymentMethod} onChange={set("paymentMethod")}>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>تاريخ الدفع <span className="text-red-500">*</span></label>
              <input className={inputCls} type="date" value={form.paymentDate} onChange={set("paymentDate")} />
            </div>
          </div>
          <div>
            <label className={labelCls}>ملاحظات</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={set("notes")} placeholder="ملاحظات (اختياري)" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer border-none"
            >
              {isPending ? "جارٍ الحفظ..." : "تسجيل الدفعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Account Statement Modal ──────────────────────────────────────────────────
function AccountModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ totalPurchases: number; totalPayments: number; balance: number } | null>(null);

  useEffect(() => {
    fetch(`/api/suppliers/${supplier.id}/account`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setSummary(d.summary || null);
      })
      .finally(() => setLoading(false));
  }, [supplier.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#CBD5E1]">
          <div>
            <h2 className="text-base font-bold text-[#173B67]">كشف حساب: {supplier.name}</h2>
            {supplier.company && <p className="text-xs text-[#64748B]">{supplier.company}</p>}
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#173B67] cursor-pointer"><X size={20} /></button>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#CBD5E1] bg-[#F1F5F9]">
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">إجمالي المشتريات</p>
              <p className="text-sm font-bold text-[#173B67]">{fmt(summary.totalPurchases)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">إجمالي المدفوعات</p>
              <p className="text-sm font-bold text-green-600">{fmt(summary.totalPayments)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">الرصيد المستحق</p>
              <p className={`text-sm font-bold ${summary.balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(summary.balance)}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[#64748B]">جارٍ التحميل...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8]">لا توجد حركات مالية</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#CBD5E1]">
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">التاريخ</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">البيان</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">مدين</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">دائن</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={`${e.type}-${e.id}`} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="py-2 px-3 text-[#64748B]">{e.date?.slice(0, 10)}</td>
                    <td className="py-2 px-3 text-[#173B67]">{e.description}</td>
                    <td className="py-2 px-3 text-red-600">{e.debit > 0 ? fmt(e.debit) : "-"}</td>
                    <td className="py-2 px-3 text-green-600">{e.credit > 0 ? fmt(e.credit) : "-"}</td>
                    <td className={`py-2 px-3 font-semibold ${e.running > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(Math.abs(e.running))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-[#CBD5E1] flex justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const canManage = user?.permissions?.includes("suppliers.manage") ?? false;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<string[]>(["نقدي", "بطاقة", "تحويل"]);

  // Modals
  const [modalSupplier, setModalSupplier] = useState<Supplier | null | "new">(null);
  const [paymentTarget, setPaymentTarget] = useState<Supplier | null>(null);
  const [accountTarget, setAccountTarget] = useState<Supplier | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Supplier | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<Supplier | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  // Fetch user
  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
  }, []);

  // Fetch payment methods
  useEffect(() => {
    fetch("/api/settings/payment-methods")
      .then((r) => r.json())
      .then((d) => { if (d.methods?.length) setPaymentMethods(d.methods); })
      .catch(() => { });
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) q.set("q", search);
      const res = await fetch(`/api/suppliers?${q.toString()}`);
      const data: SuppliersResponse = await res.json();
      setSuppliers(data.items || []);
      setTotal(data.total || 0);
    } catch {
      showToast("خطأ في جلب بيانات الموردين", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleSaved = () => {
    setModalSupplier(null);
    setPaymentTarget(null);
    fetchSuppliers();
    showToast("تم الحفظ بنجاح");
  };

  const doArchive = async (s: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${s.id}/archive`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfirmArchive(null);
      fetchSuppliers();
      showToast("تم أرشفة المورد");
    } catch (err: any) {
      showToast(err.message || "خطأ في الأرشفة", "error");
    }
  };

  const doRestore = async (s: Supplier) => {
    try {
      const res = await fetch(`/api/suppliers/${s.id}/restore`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json()).error);
      setConfirmRestore(null);
      fetchSuppliers();
      showToast("تم استعادة المورد");
    } catch (err: any) {
      showToast(err.message || "خطأ في الاستعادة", "error");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  // KPI totals
  const totalOwed = suppliers.reduce((s, x) => s + (x.balance > 0 ? x.balance : 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموردون والشركات"
        description="إدارة بيانات الموردين وكشف الحساب والمدفوعات"
        action={
          canManage ? (
            <button
              onClick={() => setModalSupplier("new")}
              className="flex items-center gap-2 bg-[#2563EB] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer"
            >
              <Plus size={16} />
              إضافة مورد
            </button>
          ) : undefined
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "إجمالي الموردين", value: total, color: "#2563EB" },
          { label: "المستحق للموردين", value: fmt(totalOwed), color: "#DC2626" },
          { label: "الموردون النشطون", value: suppliers.filter((s) => s.isActive).length, color: "#16A34A" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-4">
            <p className="text-xs text-[#64748B] mb-1">{kpi.label}</p>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              placeholder="ابحث باسم المورد أو الشركة أو الهاتف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            {(["active", "archived", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${statusFilter === s
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#2563EB]"
                  }`}
              >
                {s === "active" ? "نشط" : s === "archived" ? "مؤرشف" : "الكل"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#94A3B8]">جارٍ التحميل...</div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center text-[#94A3B8]">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد موردون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1]">
                <tr>
                  {["المورد", "الهاتف", "الرصيد المستحق", "الحالة", "الإجراءات"].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-xs font-semibold text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#173B67]">{s.name}</p>
                      {s.company && <p className="text-xs text-[#64748B]">{s.company}</p>}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{s.phone || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${s.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fmt(s.balance)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.isActive ? "نشط" : "مؤرشف"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          title="كشف الحساب"
                          onClick={() => setAccountTarget(s)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && s.isActive && (
                          <>
                            <button
                              title="تسجيل دفعة"
                              onClick={() => setPaymentTarget(s)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:bg-green-50 hover:text-green-600 cursor-pointer"
                            >
                              <CreditCard size={15} />
                            </button>
                            <button
                              title="تعديل"
                              onClick={() => setModalSupplier(s)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              title="أرشفة"
                              onClick={() => setConfirmArchive(s)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <Archive size={15} />
                            </button>
                          </>
                        )}
                        {canManage && !s.isActive && (
                          <button
                            title="استعادة"
                            onClick={() => setConfirmRestore(s)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:bg-green-50 hover:text-green-600 cursor-pointer"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#CBD5E1]">
            <span className="text-xs text-[#64748B]">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} من {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-[#CBD5E1] disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-[#CBD5E1] disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalSupplier !== null && (
        <SupplierModal
          supplier={modalSupplier === "new" ? null : modalSupplier}
          onClose={() => setModalSupplier(null)}
          onSaved={handleSaved}
        />
      )}
      {paymentTarget && (
        <PaymentModal
          supplier={paymentTarget}
          paymentMethods={paymentMethods}
          onClose={() => setPaymentTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {accountTarget && (
        <AccountModal supplier={accountTarget} onClose={() => setAccountTarget(null)} />
      )}
      {confirmArchive && (
        <ConfirmDialog
          title="أرشفة المورد"
          message={`هل أنت متأكد من أرشفة "${confirmArchive.name}"؟`}
          confirmLabel="أرشفة"
          danger
          onConfirm={() => doArchive(confirmArchive)}
          onCancel={() => setConfirmArchive(null)}
        />
      )}
      {confirmRestore && (
        <ConfirmDialog
          title="استعادة المورد"
          message={`هل تريد استعادة "${confirmRestore.name}"؟`}
          confirmLabel="استعادة"
          onConfirm={() => doRestore(confirmRestore)}
          onCancel={() => setConfirmRestore(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
