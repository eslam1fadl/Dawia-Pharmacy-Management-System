export interface Medicine {
  id: number;
  name: string;
  scientificName: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  packSize: string | null;
  barcode: string | null;
  sku: string | null;
  manufacturer: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  purchasePrice: number; // in piastres: 5000 = 50.00 EGP
  salePrice: number; // in piastres: 6500 = 65.00 EGP
  reorderLevel: number;
  defaultSupplierId: number | null;
  saleUnit: string;
  packUnit: string | null;
  unitsPerPack: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface PriceHistoryItem {
  id: number;
  field: "purchase_price" | "sale_price";
  oldValue: number;
  newValue: number;
  changedAt: string;
  changedBy: string | null;
}

export interface MedicinesListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Medicine[];
}

export interface MedicineFormData {
  name: string;
  scientificName?: string;
  activeIngredient?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  barcode?: string;
  sku?: string;
  manufacturer?: string;
  categoryId?: number | null;
  purchasePrice: number; // in piastres
  salePrice: number; // in piastres
  reorderLevel: number;
  defaultSupplierId?: number | null;
  saleUnit?: string;
  packUnit?: string;
  unitsPerPack?: number;
  description?: string;
}

export function piastresToPounds(piastres: number = 0): number {
  return Number((piastres / 100).toFixed(2));
}

export function poundsToPiastres(pounds: number = 0): number {
  return Math.round((Number(pounds) || 0) * 100);
}

export function formatMoney(piastres: number = 0): string {
  const pounds = (piastres / 100).toFixed(2);
  return `${pounds} ج.م`;
}

// API methods
export async function fetchMedicines(params?: {
  q?: string;
  categoryId?: number;
  status?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
}): Promise<MedicinesListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.categoryId) query.set("categoryId", params.categoryId.toString());
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());

  const res = await fetch(`/api/medicines?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "خطأ في جلب الأدوية");
  }
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`/api/medicines/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطأ في جلب التصنيفات");
  const data = await res.json();
  return data.categories || [];
}

export async function fetchMedicine(id: number): Promise<Medicine> {
  const res = await fetch(`/api/medicines/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("الدواء غير موجود");
  const data = await res.json();
  return data.medicine;
}

export async function fetchPriceHistory(id: number): Promise<PriceHistoryItem[]> {
  const res = await fetch(`/api/medicines/${id}/price-history`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطأ في جلب سجل الأسعار");
  const data = await res.json();
  return data.history || [];
}

export async function createMedicine(data: MedicineFormData): Promise<Medicine> {
  const res = await fetch(`/api/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "خطأ في إضافة الدواء");
  return resData.medicine;
}

export async function updateMedicine(id: number, data: Partial<MedicineFormData>): Promise<Medicine> {
  const res = await fetch(`/api/medicines/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "خطأ في تعديل الدواء");
  return resData.medicine;
}

export async function archiveMedicine(id: number): Promise<Medicine> {
  const res = await fetch(`/api/medicines/${id}/archive`, {
    method: "PATCH",
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "خطأ في أرشفة الدواء");
  return resData.medicine;
}

export async function restoreMedicine(id: number): Promise<Medicine> {
  const res = await fetch(`/api/medicines/${id}/restore`, {
    method: "PATCH",
  });
  const resData = await res.json();
  if (!res.ok) throw new Error(resData.error || "خطأ في استعادة الدواء");
  return resData.medicine;
}
