"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Pill,
  Search,
  Plus,
  Filter,
  History,
  Edit2,
  Archive,
  RotateCcw,
  Barcode,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  CheckCircle2,
  DollarSign,
  Package,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  fetchMedicines,
  fetchCategories,
  createMedicine,
  updateMedicine,
  archiveMedicine,
  restoreMedicine,
  fetchPriceHistory,
  formatMoney,
  piastresToPounds,
  poundsToPiastres,
  type Medicine,
  type Category,
  type PriceHistoryItem,
} from "@/lib/medicines";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);
  const [priceHistoryModal, setPriceHistoryModal] = useState<{
    medicine: Medicine;
    history: PriceHistoryItem[];
  } | null>(null);

  const [, startTransition] = useTransition();

  // Load user profile
  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
    fetchCategories().then((cats) => setCategories(cats)).catch(console.error);
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMedicines({
        q: searchQuery.trim() || undefined,
        categoryId: selectedCategory,
        status: statusFilter,
        page,
        pageSize,
      });
      setMedicines(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || "فشل تحميل الأدوية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [page, selectedCategory, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMedicines();
  };

  const handleArchiveToggle = async (med: Medicine) => {
    const actionText = med.isActive ? "أرشفة" : "استعادة";
    if (!confirm(`هل أنت متأكد من ${actionText} الدواء "${med.name}"؟`)) return;

    try {
      if (med.isActive) {
        await archiveMedicine(med.id);
      } else {
        await restoreMedicine(med.id);
      }
      loadMedicines();
    } catch (err: any) {
      alert(err?.message || `فشل ${actionText} الدواء`);
    }
  };

  const handleOpenPriceHistory = async (med: Medicine) => {
    try {
      const history = await fetchPriceHistory(med.id);
      setPriceHistoryModal({ medicine: med, history });
    } catch (err: any) {
      alert(err?.message || "فشل جلب سجل الأسعار");
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const canManage =
    user?.role === "manager" ||
    user?.permissions?.includes("medicines.manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الأدوية"
        description={`إجمالي الأدوية المسجلة: ${total} صنف`}
        action={
          canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-all shadow-sm border-none cursor-pointer"
            >
              <Plus size={18} />
              <span>إضافة دواء جديد</span>
            </button>
          )
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
          <Search size={18} className="absolute right-3.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الاسم العلمي، المادة الفعالة، الباركود، أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2.5 pr-10 pl-24 rounded-xl border border-[#CBD5E1] text-sm text-[#173B67] placeholder:text-[#64748B]/60 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none"
          />
          <button
            type="submit"
            className="absolute left-2 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#2563EB] hover:text-white text-xs font-semibold text-[#173B67] transition-colors border border-[#CBD5E1] cursor-pointer"
          >
            بحث
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedCategory || ""}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="w-full appearance-none py-2.5 pr-8 pl-8 rounded-xl border border-[#CBD5E1] text-sm text-[#173B67] bg-white focus:border-[#3B82F6] outline-none cursor-pointer"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Filter size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>

          {/* Status Tabs */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-[#CBD5E1] text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("active");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all ${
                statusFilter === "active" ? "bg-white text-[#2563EB] font-bold shadow-xs" : "text-[#64748B] hover:text-[#173B67]"
              }`}
            >
              النشطة
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("archived");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all ${
                statusFilter === "archived" ? "bg-white text-[#D9636B] font-bold shadow-xs" : "text-[#64748B] hover:text-[#173B67]"
              }`}
            >
              المؤرشفة
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all ${
                statusFilter === "all" ? "bg-white text-[#173B67] font-bold shadow-xs" : "text-[#64748B] hover:text-[#173B67]"
              }`}
            >
              الكل
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B]">
            <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">جاري تحميل قائمة الأدوية...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#2563EB] mb-3">
              <Pill size={32} />
            </div>
            <h3 className="text-[#173B67] font-bold text-base m-0 mb-1">لا توجد أدوية مطابقة للبحث</h3>
            <p className="text-sm m-0 text-[#64748B] max-w-sm">
              جرب تغيير كلمات البحث أو الفلاتر، أو أضف دواء جديد إلى الصيدلية.
            </p>
            {canManage && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors border-none cursor-pointer"
              >
                <Plus size={15} />
                <span>إضافة دواء الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] bg-[#F1F5F9]/60 text-xs text-[#64748B] font-semibold">
                  <th className="py-3.5 px-4">اسم الدواء</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">الباركود / الكود</th>
                  <th className="py-3.5 px-4">الشكل والتركيز</th>
                  <th className="py-3.5 px-4">سعر الشراء</th>
                  <th className="py-3.5 px-4">سعر البيع</th>
                  <th className="py-3.5 px-4">حد الطلب</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1] text-sm">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-[#F1F5F9]/40 transition-colors">
                    {/* Medicine Name & Details */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#173B67] flex items-center gap-2">
                        <span>{med.name}</span>
                      </div>
                      {(med.scientificName || med.activeIngredient) && (
                        <p className="text-xs text-[#64748B] m-0 mt-0.5 truncate max-w-[200px]">
                          {med.scientificName || med.activeIngredient}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      {med.categoryName ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                          {med.categoryName}
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Barcode & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-[#173B67]">{med.barcode || "—"}</div>
                      {med.sku && <div className="text-[11px] text-[#64748B] font-mono">كود: {med.sku}</div>}
                    </td>

                    {/* Form & Strength */}
                    <td className="py-3 px-4 text-xs text-[#173B67]">
                      <div>{med.dosageForm || "—"}</div>
                      {med.strength && <div className="text-[#64748B]">{med.strength}</div>}
                    </td>

                    {/* Purchase Price */}
                    <td className="py-3 px-4 font-semibold text-xs text-[#64748B]">
                      {formatMoney(med.purchasePrice)}
                    </td>

                    {/* Sale Price */}
                    <td className="py-3 px-4 font-bold text-sm text-[#2563EB]">
                      {formatMoney(med.salePrice)}
                    </td>

                    {/* Reorder Level */}
                    <td className="py-3 px-4 text-xs font-medium text-[#173B67]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100">
                        <Package size={12} className="text-[#64748B]" />
                        {med.reorderLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          med.isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {med.isActive ? "نشط" : "مؤرشف"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="تفاصيل الدواء"
                          onClick={() => setViewingMedicine(med)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Info size={16} />
                        </button>

                        <button
                          type="button"
                          title="سجل تغيرات السعر"
                          onClick={() => handleOpenPriceHistory(med)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-indigo-600 hover:bg-indigo-50 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <History size={16} />
                        </button>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              title="تعديل"
                              onClick={() => setEditingMedicine(med)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-amber-600 hover:bg-amber-50 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              type="button"
                              title={med.isActive ? "أرشفة الدواء" : "استعادة الدواء"}
                              onClick={() => handleArchiveToggle(med)}
                              className={`p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${
                                med.isActive
                                  ? "text-[#64748B] hover:text-red-600 hover:bg-red-50"
                                  : "text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              {med.isActive ? <Archive size={16} /> : <RotateCcw size={16} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > pageSize && (
          <div className="px-4 py-3 bg-[#F1F5F9]/60 border-t border-[#CBD5E1] flex items-center justify-between text-xs text-[#64748B]">
            <div>
              عرض صفحة <span className="font-bold text-[#173B67]">{page}</span> من أصل{" "}
              <span className="font-bold text-[#173B67]">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#173B67] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#173B67] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <MedicineFormModal
          title="إضافة دواء جديد"
          categories={categories}
          canEditPrice={user?.role === "manager" || !!user?.permissions?.includes("medicines.edit_price")}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadMedicines();
          }}
        />
      )}

      {/* Edit Medicine Modal */}
      {editingMedicine && (
        <MedicineFormModal
          title={`تعديل الدواء: ${editingMedicine.name}`}
          initialData={editingMedicine}
          categories={categories}
          canEditPrice={user?.role === "manager" || !!user?.permissions?.includes("medicines.edit_price")}
          onClose={() => setEditingMedicine(null)}
          onSuccess={() => {
            setEditingMedicine(null);
            loadMedicines();
          }}
        />
      )}

      {/* Details Modal */}
      {viewingMedicine && (
        <MedicineDetailsModal
          medicine={viewingMedicine}
          onClose={() => setViewingMedicine(null)}
          onEdit={() => {
            setEditingMedicine(viewingMedicine);
            setViewingMedicine(null);
          }}
          canManage={canManage}
        />
      )}

      {/* Price History Modal */}
      {priceHistoryModal && (
        <PriceHistoryModal
          medicine={priceHistoryModal.medicine}
          history={priceHistoryModal.history}
          onClose={() => setPriceHistoryModal(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Medicine Form Modal (Create / Edit)
// ─────────────────────────────────────────────────────────────
interface FormModalProps {
  title: string;
  initialData?: Medicine;
  categories: Category[];
  canEditPrice: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function MedicineFormModal({
  title,
  initialData,
  categories,
  canEditPrice,
  onClose,
  onSuccess,
}: FormModalProps) {
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [scientificName, setScientificName] = useState(initialData?.scientificName || "");
  const [activeIngredient, setActiveIngredient] = useState(initialData?.activeIngredient || "");
  const [strength, setStrength] = useState(initialData?.strength || "");
  const [dosageForm, setDosageForm] = useState(initialData?.dosageForm || "");
  const [packSize, setPackSize] = useState(initialData?.packSize || "");
  const [barcode, setBarcode] = useState(initialData?.barcode || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(initialData?.categoryId || undefined);

  // Prices in EGP (Pounds) for user input:
  const [purchasePriceEgp, setPurchasePriceEgp] = useState<string>(
    initialData ? piastresToPounds(initialData.purchasePrice).toString() : "0"
  );
  const [salePriceEgp, setSalePriceEgp] = useState<string>(
    initialData ? piastresToPounds(initialData.salePrice).toString() : "0"
  );
  const [reorderLevel, setReorderLevel] = useState<number>(initialData?.reorderLevel ?? 5);
  const [description, setDescription] = useState(initialData?.description || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("اسم الدواء مطلوب");
      return;
    }

    const purchasePiastres = poundsToPiastres(Number(purchasePriceEgp));
    const salePiastres = poundsToPiastres(Number(salePriceEgp));

    if (purchasePiastres < 0 || salePiastres < 0) {
      setError("السعر لا يمكن أن يكون سالبًا");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        scientificName: scientificName.trim() || undefined,
        activeIngredient: activeIngredient.trim() || undefined,
        strength: strength.trim() || undefined,
        dosageForm: dosageForm.trim() || undefined,
        packSize: packSize.trim() || undefined,
        barcode: barcode.trim() || undefined,
        sku: sku.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        categoryId: categoryId || undefined,
        reorderLevel: Number(reorderLevel) || 0,
        description: description.trim() || undefined,
      };

      // Only send prices if allowed or creating
      if (!isEdit || canEditPrice) {
        payload.purchasePrice = purchasePiastres;
        payload.salePrice = salePiastres;
      }

      if (isEdit) {
        await updateMedicine(initialData.id, payload);
      } else {
        await createMedicine(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || "فشلت العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Pill size={18} className="text-[#3B82F6]" />
            </div>
            <h3 className="font-bold text-base m-0">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#173B67] mb-1">
                اسم الدواء التجاري <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: بنادول اكسترا"
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">التصنيف</label>
              <select
                value={categoryId || ""}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm bg-white focus:border-[#3B82F6] outline-none"
              >
                <option value="">بدون تصنيف</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">الشركة المصنعة</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="مثال: GSK"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">الاسم العلمي</label>
              <input
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="مثال: Paracetamol + Caffeine"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">المادة الفعالة</label>
              <input
                type="text"
                value={activeIngredient}
                onChange={(e) => setActiveIngredient(e.target.value)}
                placeholder="مثال: Paracetamol"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">التركيز</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="مثال: 500mg"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">الشكل الدوائي</label>
              <input
                type="text"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                placeholder="مثال: أقراص، شراب، أمبول"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">حجم العبوة</label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="مثال: 24 قرص"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">حد إعادة الطلب</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                placeholder="مثال: 10"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">الباركود</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="امسح أو اكتب الباركود"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm font-mono focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#173B67] mb-1">كود الصنف (SKU)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="مثال: MED-001"
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm font-mono focus:border-[#3B82F6] outline-none"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="pt-2 border-t border-[#CBD5E1]">
            <h4 className="text-xs font-bold text-[#173B67] uppercase tracking-wider mb-3">
              التسعير (بالجنيه المصري)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1">سعر الشراء (ج.م) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isEdit && !canEditPrice}
                  value={purchasePriceEgp}
                  onChange={(e) => setPurchasePriceEgp(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-[#64748B] mt-0.5 block">
                  يعادل: {poundsToPiastres(Number(purchasePriceEgp))} قرش
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#173B67] mb-1">سعر البيع للجمهور (ج.م) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isEdit && !canEditPrice}
                  value={salePriceEgp}
                  onChange={(e) => setSalePriceEgp(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none font-bold text-[#2563EB] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-[#64748B] mt-0.5 block">
                  يعادل: {poundsToPiastres(Number(salePriceEgp))} قرش
                </span>
              </div>
            </div>
            {isEdit && !canEditPrice && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">
                ملاحظة: تعديل الأسعار يتطلب صلاحية خاصة (medicines.edit_price).
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#173B67] mb-1">ملاحظات أو وصف الدواء</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أي تفاصيل أو تعليمات تخزين..."
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#3B82F6] outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#CBD5E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] text-sm font-medium bg-transparent cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-sm font-semibold border-none cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? "جاري الحفظ..." : isEdit ? "تحديث الدواء" : "إضافة الدواء"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Details Modal
// ─────────────────────────────────────────────────────────────
function MedicineDetailsModal({
  medicine,
  onClose,
  onEdit,
  canManage,
}: {
  medicine: Medicine;
  onClose: () => void;
  onEdit: () => void;
  canManage?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden">
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Pill size={18} className="text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-bold text-base m-0">{medicine.name}</h3>
              <p className="text-xs text-[#BFDBFE] m-0">{medicine.categoryName || "بدون تصنيف"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          <div className="grid grid-cols-2 gap-3 bg-[#F1F5F9] p-4 rounded-xl border border-[#CBD5E1]">
            <div>
              <span className="text-xs text-[#64748B] block">سعر الشراء:</span>
              <span className="font-bold text-[#173B67]">{formatMoney(medicine.purchasePrice)}</span>
            </div>
            <div>
              <span className="text-xs text-[#64748B] block">سعر البيع:</span>
              <span className="font-bold text-[#2563EB] text-base">{formatMoney(medicine.salePrice)}</span>
            </div>
            <div>
              <span className="text-xs text-[#64748B] block">حد إعادة الطلب:</span>
              <span className="font-semibold text-[#173B67]">{medicine.reorderLevel} عبوات</span>
            </div>
            <div>
              <span className="text-xs text-[#64748B] block">الحالة:</span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  medicine.isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                }`}
              >
                {medicine.isActive ? "نشط" : "مؤرشف"}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">الاسم العلمي:</span>
              <span className="font-semibold text-[#173B67]">{medicine.scientificName || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">المادة الفعالة:</span>
              <span className="font-semibold text-[#173B67]">{medicine.activeIngredient || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">التركيز والشكل:</span>
              <span className="font-semibold text-[#173B67]">
                {medicine.dosageForm} {medicine.strength ? `(${medicine.strength})` : ""}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">حجم العبوة:</span>
              <span className="font-semibold text-[#173B67]">{medicine.packSize || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">الشركة المصنعة:</span>
              <span className="font-semibold text-[#173B67]">{medicine.manufacturer || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">الباركود:</span>
              <span className="font-mono font-semibold text-[#173B67]">{medicine.barcode || "—"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
              <span className="text-[#64748B]">كود الصنف (SKU):</span>
              <span className="font-mono font-semibold text-[#173B67]">{medicine.sku || "—"}</span>
            </div>
            {medicine.description && (
              <div className="pt-2">
                <span className="text-[#64748B] block mb-1">ملاحظات:</span>
                <p className="bg-[#F1F5F9] p-2.5 rounded-lg text-xs leading-relaxed text-[#173B67] m-0">
                  {medicine.description}
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B] text-xs font-semibold bg-transparent cursor-pointer"
            >
              إغلاق
            </button>
            {canManage && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors border-none cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 size={14} />
                <span>تعديل الدواء</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Price History Modal
// ─────────────────────────────────────────────────────────────
function PriceHistoryModal({
  medicine,
  history,
  onClose,
}: {
  medicine: Medicine;
  history: PriceHistoryItem[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden">
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <History size={18} className="text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-bold text-base m-0">سجل تغير الأسعار</h3>
              <p className="text-xs text-[#BFDBFE] m-0">{medicine.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">
              <History size={32} className="mx-auto mb-2 text-[#64748B]/40" />
              <p className="text-sm font-semibold m-0">لا توجد تغييرات سابقة في الأسعار</p>
              <p className="text-xs text-[#64748B] mt-1 m-0">
                يتم تسجيل كل تعديل يطرأ على سعر الشراء أو سعر البيع تلقائياً في هذا السجل.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#CBD5E1] bg-[#F1F5F9]/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#173B67]">
                        {item.field === "sale_price" ? "سعر البيع" : "سعر الشراء"}
                      </span>
                      <span className="text-[#64748B] font-mono">
                        {formatMoney(item.oldValue)} &larr; {formatMoney(item.newValue)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1">
                      بواسطة: <span className="text-[#173B67] font-medium">{item.changedBy || "مدير النظام"}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B] bg-white px-2 py-1 rounded-md border border-[#CBD5E1]">
                    {item.changedAt}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-[#CBD5E1] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors border-none cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
