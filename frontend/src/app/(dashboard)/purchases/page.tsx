"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import {
  ShoppingCart,
  Plus,
  Edit2,
  Eye,
  Check,
  RotateCcw,
  AlertTriangle,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier { id: number; name: string; company: string | null; }
interface MedicineOpt { id: number; name: string; scientificName: string | null; salePrice: number; purchasePrice: number; barcode: string | null; }

interface PurchaseItem {
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: string;
  unitCost: string; // EGP
  discountPct: string;
}

interface PurchaseFormData {
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  notes: string;
  invoiceDiscount: string; // EGP
  paidAmount: string;      // EGP
  paymentMethod: string;
  items: PurchaseItem[];
}

interface Purchase {
  id: number;
  supplierId: number;
  supplierName: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  status: "draft" | "confirmed" | "reversed";
  subtotal: number;   // piastres
  invoiceDiscount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string | null;
  createdAt: string;
  items?: PurchaseItemFull[];
}

interface PurchaseItemFull {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  unitCost: number;
  discountPct: number;
  lineTotal: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (p: number) => (p / 100).toFixed(2) + " ج.م";
const today = () => new Date().toISOString().slice(0, 10);
const egpToP = (s: string | number) => Math.round((parseFloat(String(s)) || 0) * 100);
const emptyItem = (): PurchaseItem => ({
  medicineId: 0,
  medicineName: "",
  batchNumber: "",
  expiryDate: "",
  quantity: "1",
  unitCost: "0",
  discountPct: "0",
});

const STATUS_LABEL: Record<string, string> = { draft: "مسودة", confirmed: "معتمدة", reversed: "معكوسة" };
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  reversed: "bg-red-100 text-red-600",
};

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      {msg}
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ─── Medicine Search Dropdown ─────────────────────────────────────────────────
function MedicineSearch({ value, onSelect }: { value: string; onSelect: (m: MedicineOpt) => void }) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<MedicineOpt[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setQ(value); }, [value]);

  const search = (text: string) => {
    setQ(text);
    clearTimeout(timer.current);
    if (!text.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medicines?q=${encodeURIComponent(text)}&status=active&pageSize=10`);
        const data = await res.json();
        setResults(data.items || []);
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
  };

  return (
    <div className="relative">
      <input
        className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
        placeholder="ابحث عن دواء..."
        value={q}
        onChange={(e) => search(e.target.value)}
        onFocus={() => q && results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-[#CBD5E1] shadow-lg max-h-48 overflow-y-auto">
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              className="w-full text-right px-3 py-2 hover:bg-[#EFF6FF] text-sm text-[#173B67] cursor-pointer border-none bg-transparent"
              onMouseDown={() => { onSelect(m); setQ(m.name); setOpen(false); }}
            >
              <span className="font-medium">{m.name}</span>
              {m.scientificName && <span className="text-xs text-[#94A3B8] mr-2">{m.scientificName}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Price Comparison Panel ───────────────────────────────────────────────────
interface PriceComparison {
  supplierId: number;
  supplierName: string;
  company: string | null;
  lastUnitCost: number; // piastres
  lastDate: string | null;
  purchaseId: number;
}

function PriceComparisonPanel({ medicineId }: { medicineId: number }) {
  const [data, setData] = useState<PriceComparison[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!medicineId) { setData([]); return; }
    setLoading(true);
    fetch(`/api/medicines/${medicineId}/price-comparison`)
      .then((r) => r.json())
      .then((d) => setData(d.comparisons || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [medicineId]);

  if (!medicineId) return null;
  if (loading) return <p className="text-xs text-[#94A3B8] mt-1">جارٍ تحميل مقارنة الأسعار...</p>;
  if (!data.length) return <p className="text-xs text-[#94A3B8] mt-1">لا توجد مشتريات سابقة لهذا الدواء.</p>;

  return (
    <div className="mt-1 bg-blue-50 border border-blue-200 rounded-lg p-2">
      <p className="text-[10px] font-bold text-[#2563EB] mb-1">📊 مقارنة أسعار الموردين (آخر سعر)</p>
      <div className="space-y-0.5">
        {data.map((c) => (
          <div key={c.supplierId} className="flex items-center justify-between text-[11px]">
            <span className="text-[#173B67] font-medium">{c.supplierName}{c.company ? ` — ${c.company}` : ""}</span>
            <span className="text-green-700 font-semibold">{(c.lastUnitCost / 100).toFixed(2)} ج.م</span>
            {c.lastDate && <span className="text-[#94A3B8]">{c.lastDate.slice(0, 10)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Purchase Form Modal ──────────────────────────────────────────────────────
function PurchaseModal({
  purchase,
  suppliers,
  paymentMethods,
  onClose,
  onSaved,
}: {
  purchase: Purchase | null;
  suppliers: Supplier[];
  paymentMethods: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!purchase && purchase.status === "draft";

  const [form, setForm] = useState<PurchaseFormData>({
    supplierId: purchase?.supplierId?.toString() ?? "",
    invoiceNumber: purchase?.invoiceNumber ?? "",
    invoiceDate: purchase?.invoiceDate?.slice(0, 10) ?? today(),
    notes: purchase?.notes ?? "",
    invoiceDiscount: purchase ? (purchase.invoiceDiscount / 100).toFixed(2) : "0",
    paidAmount: purchase ? (purchase.paidAmount / 100).toFixed(2) : "0",
    paymentMethod: paymentMethods[0] || "نقدي",
    items: purchase?.items?.map((it) => ({
      medicineId: it.medicineId,
      medicineName: it.medicineName,
      batchNumber: it.batchNumber ?? "",
      expiryDate: it.expiryDate?.slice(0, 10) ?? "",
      quantity: it.quantity.toString(),
      unitCost: (it.unitCost / 100).toFixed(2),
      discountPct: it.discountPct.toString(),
    })) ?? [emptyItem()],
  });

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = (k: keyof Omit<PurchaseFormData, "items">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const setItem = (idx: number, k: keyof PurchaseItem, v: string | number) =>
    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [k]: v };
      return { ...p, items };
    });

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));
  const removeItem = (idx: number) => setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  // Calculations
  const lineTotal = (item: PurchaseItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = egpToP(item.unitCost);
    const disc = parseFloat(item.discountPct) || 0;
    return Math.round(qty * cost * (1 - disc / 100));
  };
  const subtotal = form.items.reduce((s, it) => s + lineTotal(it), 0);
  const invDisc = egpToP(form.invoiceDiscount);
  const total = Math.max(0, subtotal - invDisc);
  const paid = egpToP(form.paidAmount);
  const remaining = total - paid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierId) { setError("اختر المورد"); return; }
    if (form.items.length === 0) { setError("أضف صنفًا واحدًا على الأقل"); return; }
    for (const it of form.items) {
      if (!it.medicineId) { setError("اختر الدواء لكل صنف"); return; }
      if (!parseFloat(it.quantity) || parseFloat(it.quantity) <= 0) { setError("الكمية يجب أن تكون أكبر من صفر"); return; }
    }
    setError("");

    startTransition(async () => {
      try {
        const payload = {
          supplierId: parseInt(form.supplierId),
          invoiceNumber: form.invoiceNumber.trim() || null,
          invoiceDate: form.invoiceDate,
          notes: form.notes.trim() || null,
          discountAmount: invDisc,          // piastres — backend expects this name
          paidAmountEgp: paid / 100,        // EGP float — backend expects this name
          paymentMethod: form.paymentMethod || undefined,
          items: form.items.map((it) => ({
            medicineId: it.medicineId,
            batchNumber: it.batchNumber.trim() || undefined,
            expiryDate: it.expiryDate || undefined,
            quantity: parseInt(it.quantity),
            unitCostEgp: parseFloat(it.unitCost) || 0,  // EGP float — backend expects this name
            discountPct: parseFloat(it.discountPct) || 0,
          })),
        };

        const url = isEdit ? `/api/purchases/${purchase!.id}` : `/api/purchases`;
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

  const inputCls = "w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
  const labelCls = "text-xs font-semibold text-[#173B67] block mb-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#CBD5E1]">
          <h2 className="text-base font-bold text-[#173B67]">{isEdit ? "تعديل فاتورة شراء" : "فاتورة شراء جديدة"}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#173B67] cursor-pointer"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Invoice Info */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#173B67] mb-2">بيانات الفاتورة</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>المورد <span className="text-red-500">*</span></label>
                <select className={inputCls} value={form.supplierId} onChange={set("supplierId")}>
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.company ? ` — ${s.company}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>رقم الفاتورة</label>
                <input className={inputCls} value={form.invoiceNumber} onChange={set("invoiceNumber")} placeholder="اختياري" />
              </div>
              <div>
                <label className={labelCls}>تاريخ الفاتورة <span className="text-red-500">*</span></label>
                <input className={inputCls} type="date" value={form.invoiceDate} onChange={set("invoiceDate")} />
              </div>
            </div>
            <div>
              <label className={labelCls}>ملاحظات</label>
              <input className={inputCls} value={form.notes} onChange={set("notes")} placeholder="ملاحظات (اختياري)" />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#173B67]">أصناف الفاتورة <span className="text-red-500">*</span></p>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline cursor-pointer">
                <Plus size={13} /> إضافة صنف
              </button>
            </div>

            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="bg-[#F8FAFC] rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 items-start">
                    <div className="col-span-2">
                      <label className={labelCls}>الدواء <span className="text-red-500">*</span></label>
                      <MedicineSearch
                        value={item.medicineName}
                        onSelect={(m) => {
                          setItem(idx, "medicineId", m.id);
                          setItem(idx, "medicineName", m.name);
                          setItem(idx, "unitCost", (m.purchasePrice / 100).toFixed(2));
                        }}
                      />
                      <PriceComparisonPanel medicineId={item.medicineId} />
                    </div>
                    <div>
                      <label className={labelCls}>رقم التشغيلة</label>
                      <input className={inputCls} value={item.batchNumber} onChange={(e) => setItem(idx, "batchNumber", e.target.value)} placeholder="اختياري" />
                    </div>
                    <div>
                      <label className={labelCls}>تاريخ الانتهاء</label>
                      <input className={inputCls} type="date" value={item.expiryDate} onChange={(e) => setItem(idx, "expiryDate", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>الكمية <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="number" min="1" value={item.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>سعر الوحدة (ج.م) <span className="text-red-500">*</span></label>
                      <input className={inputCls} type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => setItem(idx, "unitCost", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#64748B]">خصم %</label>
                        <input
                          className="w-20 px-2 py-1.5 rounded-lg border border-[#CBD5E1] text-xs outline-none focus:border-[#2563EB]"
                          type="number" min="0" max="100" step="0.01"
                          value={item.discountPct}
                          onChange={(e) => setItem(idx, "discountPct", e.target.value)}
                        />
                      </div>
                      <span className="text-xs text-[#64748B]">
                        الإجمالي: <span className="font-semibold text-[#173B67]">{fmt(lineTotal(item))}</span>
                      </span>
                    </div>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-[#EFF6FF] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#173B67] mb-2">الإجماليات والدفع</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>المجموع الفرعي</label>
                <div className="px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-sm font-semibold text-[#173B67]">{fmt(subtotal)}</div>
              </div>
              <div>
                <label className={labelCls}>خصم الفاتورة (ج.م)</label>
                <input className={inputCls + " bg-white"} type="number" min="0" step="0.01" value={form.invoiceDiscount} onChange={set("invoiceDiscount")} />
              </div>
              <div>
                <label className={labelCls}>الإجمالي</label>
                <div className="px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-sm font-bold text-[#2563EB]">{fmt(total)}</div>
              </div>
              <div>
                <label className={labelCls}>المدفوع (ج.م)</label>
                <input className={inputCls + " bg-white"} type="number" min="0" step="0.01" value={form.paidAmount} onChange={set("paidAmount")} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className={labelCls}>طريقة الدفع</label>
                <select className={inputCls + " bg-white"} value={form.paymentMethod} onChange={set("paymentMethod")}>
                  {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">المتبقي</p>
                <p className={`text-lg font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(Math.abs(remaining))}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-5 border-t border-[#CBD5E1]">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">
            إلغاء
          </button>
          <button
            onClick={(e) => handleSubmit(e as any)}
            disabled={isPending}
            className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer border-none"
          >
            {isPending ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reverse Dialog ───────────────────────────────────────────────────────────
function ReverseDialog({ purchase, onClose, onDone }: { purchase: Purchase; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) { setError("سبب العكس يجب أن يكون 10 أحرف على الأقل"); return; }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/purchases/${purchase.id}/reverse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطأ في عكس الفاتورة");
        onDone();
      } catch (err: any) {
        setError(err.message || "خطأ غير متوقع");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-base font-bold text-[#173B67]">عكس الفاتورة</h3>
        <p className="text-sm text-[#64748B]">فاتورة: <span className="font-medium">{purchase.invoiceNumber || `#${purchase.id}`}</span></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">سبب العكس <span className="text-red-500">*</span> <span className="text-[#94A3B8] font-normal">(10 أحرف على الأقل)</span></label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب العكس..."
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">إلغاء</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer border-none">
              {isPending ? "جارٍ العكس..." : "تأكيد العكس"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const [detail, setDetail] = useState<Purchase | null>(null);
  useEffect(() => {
    fetch(`/api/purchases/${purchase.id}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.purchase));
  }, [purchase.id]);

  const p = detail || purchase;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#CBD5E1]">
          <div>
            <h2 className="text-base font-bold text-[#173B67]">تفاصيل الفاتورة {p.invoiceNumber ? `— ${p.invoiceNumber}` : `#${p.id}`}</h2>
            <p className="text-xs text-[#64748B]">{p.supplierName} — {p.invoiceDate?.slice(0, 10)}</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#173B67] cursor-pointer"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Items */}
          {p.items && p.items.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1]">
                <tr>
                  {["الدواء", "التشغيلة", "الانتهاء", "الكمية", "السعر", "الخصم", "الإجمالي"].map((h) => (
                    <th key={h} className="text-right py-2 px-3 text-xs font-semibold text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {p.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 text-[#173B67] font-medium">{it.medicineName}</td>
                    <td className="py-2 px-3 text-[#64748B]">{it.batchNumber || "—"}</td>
                    <td className="py-2 px-3 text-[#64748B]">{it.expiryDate?.slice(0, 10) || "—"}</td>
                    <td className="py-2 px-3 text-[#173B67]">{it.quantity}</td>
                    <td className="py-2 px-3 text-[#173B67]">{fmt(it.unitCost)}</td>
                    <td className="py-2 px-3 text-[#64748B]">{it.discountPct}%</td>
                    <td className="py-2 px-3 font-semibold text-[#173B67]">{fmt(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-[#94A3B8]">جارٍ التحميل...</p>
          )}

          {/* Summary */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-[#64748B]">المجموع الفرعي</span><span className="font-semibold text-[#173B67]">{fmt(p.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">خصم الفاتورة</span><span className="text-orange-600">- {fmt(p.invoiceDiscount)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">الإجمالي</span><span className="font-bold text-[#2563EB]">{fmt(p.total)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">المدفوع</span><span className="text-green-600">{fmt(p.paidAmount)}</span></div>
            <div className="col-span-2 flex justify-between border-t border-[#CBD5E1] pt-3">
              <span className="font-semibold text-[#173B67]">المتبقي</span>
              <span className={`font-bold ${p.remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(p.remainingAmount)}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-[#CBD5E1] flex justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">إغلاق</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const canManage = user?.permissions?.includes("purchases.manage") ?? false;

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "confirmed" | "reversed">("all");
  const [loading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["نقدي", "بطاقة", "تحويل"]);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Purchase | null>(null);
  const [detailTarget, setDetailTarget] = useState<Purchase | null>(null);
  const [reverseTarget, setReverseTarget] = useState<Purchase | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
    fetch("/api/suppliers?status=active&pageSize=200")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.items || []));
    fetch("/api/settings/payment-methods")
      .then((r) => r.json())
      .then((d) => { if (d.methods?.length) setPaymentMethods(d.methods); })
      .catch(() => {});
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (statusFilter !== "all") q.set("status", statusFilter);
      const res = await fetch(`/api/purchases?${q.toString()}`);
      const data = await res.json();
      setPurchases(data.items || []);
      setTotal(data.total || 0);
    } catch {
      showToast("خطأ في جلب فواتير الشراء", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleSaved = () => {
    setShowForm(false);
    setEditTarget(null);
    fetchPurchases();
    showToast("تم حفظ الفاتورة بنجاح");
  };

  const doConfirm = async (id: number) => {
    try {
      const res = await fetch(`/api/purchases/${id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الاعتماد");
      setConfirmId(null);
      fetchPurchases();
      showToast("تم اعتماد الفاتورة وترحيل المخزون");
    } catch (err: any) {
      showToast(err.message || "خطأ في الاعتماد", "error");
    }
  };

  const handleReversed = () => {
    setReverseTarget(null);
    fetchPurchases();
    showToast("تم عكس الفاتورة بنجاح");
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="فواتير الشراء"
        description="إدارة فواتير الشراء من الموردين وترحيل المخزون"
        action={
          canManage ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#2563EB] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer"
            >
              <Plus size={16} />
              فاتورة جديدة
            </button>
          ) : undefined
        }
      />

      {/* Status Tabs */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-4">
        <div className="flex gap-2 flex-wrap">
          {(["all", "draft", "confirmed", "reversed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                statusFilter === s
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#2563EB]"
              }`}
            >
              {s === "all" ? "الكل" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#94A3B8]">جارٍ التحميل...</div>
        ) : purchases.length === 0 ? (
          <div className="py-16 text-center text-[#94A3B8]">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد فواتير شراء</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#CBD5E1]">
                <tr>
                  {["#", "المورد", "رقم الفاتورة", "التاريخ", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "الإجراءات"].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-xs font-semibold text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 text-[#94A3B8] text-xs">{p.id}</td>
                    <td className="py-3 px-4 font-semibold text-[#173B67]">{p.supplierName}</td>
                    <td className="py-3 px-4 text-[#64748B]">{p.invoiceNumber || "—"}</td>
                    <td className="py-3 px-4 text-[#64748B]">{p.invoiceDate?.slice(0, 10)}</td>
                    <td className="py-3 px-4 font-semibold text-[#173B67]">{fmt(p.total)}</td>
                    <td className="py-3 px-4 text-green-600">{fmt(p.paidAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={p.remainingAmount > 0 ? "text-red-600 font-semibold" : "text-green-600"}>{fmt(p.remainingAmount)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button title="تفاصيل" onClick={() => setDetailTarget(p)} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer">
                          <Eye size={15} />
                        </button>
                        {canManage && p.status === "draft" && (
                          <>
                            <button title="تعديل" onClick={() => setEditTarget(p)} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] cursor-pointer">
                              <Edit2 size={15} />
                            </button>
                            <button title="اعتماد" onClick={() => setConfirmId(p.id)} className="p-1.5 rounded-lg text-[#64748B] hover:bg-green-50 hover:text-green-600 cursor-pointer">
                              <Check size={15} />
                            </button>
                          </>
                        )}
                        {canManage && p.status === "confirmed" && (
                          <button title="عكس" onClick={() => setReverseTarget(p)} className="p-1.5 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-600 cursor-pointer">
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
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-[#CBD5E1] disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer">
                <ChevronRight size={16} />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-[#CBD5E1] disabled:opacity-40 hover:bg-[#F1F5F9] cursor-pointer">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showForm || editTarget) && (
        <PurchaseModal
          purchase={editTarget}
          suppliers={suppliers}
          paymentMethods={paymentMethods}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
      {detailTarget && <DetailModal purchase={detailTarget} onClose={() => setDetailTarget(null)} />}
      {reverseTarget && <ReverseDialog purchase={reverseTarget} onClose={() => setReverseTarget(null)} onDone={handleReversed} />}

      {/* Confirm Purchase Dialog */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-[#173B67]">اعتماد الفاتورة</h3>
            <p className="text-sm text-[#64748B]">هل تريد اعتماد هذه الفاتورة؟ سيتم ترحيل الكميات للمخزون تلقائيًا ولا يمكن التراجع إلا بعكس الفاتورة.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] hover:bg-gray-50 cursor-pointer">إلغاء</button>
              <button onClick={() => doConfirm(confirmId)} className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] cursor-pointer border-none">اعتماد</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
