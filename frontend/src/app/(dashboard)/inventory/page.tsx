"use client";

import { useEffect, useState } from "react";
import { Boxes, AlertTriangle, Package, CheckCircle2, Search, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchMedicines, formatMoney, type Medicine } from "@/lib/medicines";
import Link from "next/link";

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "reorder">("all");

  useEffect(() => {
    fetchMedicines({ pageSize: 100 })
      .then((res) => setMedicines(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const reorderList = medicines.filter((m) => m.reorderLevel > 0);
  const displayList = filter === "reorder" ? reorderList : medicines;

  return (
    <div className="space-y-6">
      <PageHeader
        title="المخزون والصلاحية"
        description="مراقبة مستويات المخزون، حدود إعادة الطلب، وتواريخ انتهاء الصلاحية"
      />

      {/* KPI summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748B] block mb-1">إجمالي الأصناف المراقبة</span>
            <span className="text-2xl font-bold text-[#173B67]">{medicines.length}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
            <Boxes size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748B] block mb-1">أصناف محددة بحد طلب</span>
            <span className="text-2xl font-bold text-amber-600">{reorderList.length}</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748B] block mb-1">حالة المخزون العامة</span>
            <span className="text-sm font-bold text-blue-600 block mt-1">مستقر وجيد</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Filter tab */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
            filter === "all" ? "bg-[#2563EB] text-white" : "bg-white text-[#64748B] hover:text-[#173B67] border border-[#CBD5E1]"
          }`}
        >
          كافة الأصناف ({medicines.length})
        </button>
        <button
          onClick={() => setFilter("reorder")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition-all ${
            filter === "reorder" ? "bg-amber-600 text-white" : "bg-white text-[#64748B] hover:text-[#173B67] border border-[#CBD5E1]"
          }`}
        >
          أصناف حد إعادة الطلب ({reorderList.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-xs text-[#64748B]">جاري تحميل بيانات المخزون...</p>
        ) : displayList.length === 0 ? (
          <p className="py-12 text-center text-xs text-[#64748B]">لا توجد بيانات متاحة.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#CBD5E1] bg-[#F1F5F9]/60 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">اسم الدواء</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">الباركود</th>
                  <th className="py-3 px-4">حد إعادة الطلب</th>
                  <th className="py-3 px-4">سعر البيع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]">
                {displayList.map((med) => (
                  <tr key={med.id} className="hover:bg-[#F1F5F9]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#173B67]">{med.name}</td>
                    <td className="py-3 px-4 text-[#64748B]">{med.categoryName || "—"}</td>
                    <td className="py-3 px-4 font-mono text-[#64748B]">{med.barcode || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold">
                        <Package size={13} />
                        {med.reorderLevel} عبوات
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2563EB]">{formatMoney(med.salePrice)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          med.isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {med.isActive ? "نشط" : "مؤرشف"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href="/medicines"
                        className="inline-flex items-center gap-1 text-[#2563EB] font-semibold hover:underline no-underline"
                      >
                        <span>تعديل</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
