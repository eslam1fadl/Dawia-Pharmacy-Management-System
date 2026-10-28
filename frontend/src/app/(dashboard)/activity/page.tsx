"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileText,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchActivityLog, translateAction, type ActivityItem } from "@/lib/activity";

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [actionFilter, setActionFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchActivityLog({
        action: actionFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, fromDate, toDate]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل العمليات والنشاطات"
        description="تتبع كافة الحركات والتغييرات التي تمت على النظام وسجلات الأدوية وتسجيل الدخول"
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE6E1] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Action Filter */}
          <div className="min-w-[180px]">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-[#DCE6E1] text-xs text-[#172B24] bg-white outline-none cursor-pointer"
            >
              <option value="">جميع العمليات</option>
              <option value="auth.">عمليات الدخول والجلسات</option>
              <option value="auth.login">تسجيل دخول ناجح</option>
              <option value="auth.login_failed">فشل تسجيل دخول</option>
              <option value="auth.password_changed">تغيير كلمة المرور</option>
              <option value="medicine.">عمليات الأدوية</option>
              <option value="medicine.created">إضافة دواء</option>
              <option value="medicine.updated">تعديل دواء</option>
              <option value="medicine.price_changed">تعديل سعر</option>
              <option value="medicine.archived">أرشفة دواء</option>
              <option value="medicine.restored">استعادة دواء</option>
            </select>
          </div>

          {/* Date from */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span>من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="py-2 px-2.5 rounded-xl border border-[#DCE6E1] text-xs text-[#172B24] bg-white outline-none"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span>إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="py-2 px-2.5 rounded-xl border border-[#DCE6E1] text-xs text-[#172B24] bg-white outline-none"
            />
          </div>

          {(actionFilter || fromDate || toDate) && (
            <button
              onClick={() => {
                setActionFilter("");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              className="text-xs text-red-600 hover:underline px-2 py-1 bg-transparent border-none cursor-pointer"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <span className="text-xs text-[#64748B] font-semibold">إجمالي السجلات: {total}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#DCE6E1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B]">
            <div className="w-8 h-8 border-3 border-[#087F68] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري تحميل السجلات...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <Activity size={32} className="mx-auto mb-2 text-[#64748B]/40" />
            <h3 className="text-base font-bold text-[#172B24] m-0 mb-1">لا توجد سجلات نشاط مطابقة</h3>
            <p className="text-xs text-[#64748B] m-0">لم يتم العثور على حركات مسجلة بالفلاتر الحالية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE6E1] bg-[#F5F8F7]/60 text-[#64748B] font-semibold">
                  <th className="py-3 px-4">رقم السجل</th>
                  <th className="py-3 px-4">المستخدم</th>
                  <th className="py-3 px-4">نوع الحركة</th>
                  <th className="py-3 px-4">العنصر</th>
                  <th className="py-3 px-4">عنوان IP</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6E1]">
                {items.map((log) => {
                  const meta = translateAction(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-[#F5F8F7]/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B]">#{log.id}</td>
                      <td className="py-3 px-4 font-semibold text-[#172B24]">
                        {log.username || "نظام / غير مسجل"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {log.entityType ? `${log.entityType} #${log.entityId || ""}` : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{log.ip || "—"}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B]">{log.createdAt}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(log)}
                          className="p-1.5 rounded-lg text-[#087F68] hover:bg-[#E6F4F1] border-none bg-transparent cursor-pointer transition-colors"
                          title="عرض تفاصيل الحركة"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-4 py-3 bg-[#F5F8F7]/60 border-t border-[#DCE6E1] flex items-center justify-between text-xs text-[#64748B]">
            <div>
              عرض صفحة <span className="font-bold text-[#172B24]">{page}</span> من أصل{" "}
              <span className="font-bold text-[#172B24]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#DCE6E1] bg-white text-[#172B24] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#DCE6E1] bg-white text-[#172B24] hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCE6E1] overflow-hidden">
            <div className="px-6 py-4 bg-[#064E49] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#20C997]" />
                <h3 className="font-bold text-base m-0">تفاصيل حركة رقم #{selectedItem.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#F5F8F7] p-3 rounded-xl border border-[#DCE6E1]">
                <div>
                  <span className="text-[#64748B] block">المستخدم:</span>
                  <span className="font-bold text-[#172B24]">{selectedItem.username || "—"}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">الحركة:</span>
                  <span className="font-bold text-[#087F68]">{selectedItem.action}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">الوقت:</span>
                  <span className="font-mono text-[#172B24]">{selectedItem.createdAt}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">IP:</span>
                  <span className="font-mono text-[#172B24]">{selectedItem.ip || "—"}</span>
                </div>
              </div>

              {selectedItem.oldValues && (
                <div>
                  <span className="font-bold text-[#172B24] block mb-1">البيانات السابقة (Old Values):</span>
                  <pre className="bg-red-50 text-red-900 p-3 rounded-xl border border-red-200 overflow-x-auto text-[11px] font-mono m-0">
                    {JSON.stringify(selectedItem.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedItem.newValues && (
                <div>
                  <span className="font-bold text-[#172B24] block mb-1">البيانات الجديدة (New Values):</span>
                  <pre className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 overflow-x-auto text-[11px] font-mono m-0">
                    {JSON.stringify(selectedItem.newValues, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-[#087F68] text-white text-xs font-semibold hover:bg-[#066653] border-none cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
