export interface ActivityItem {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  oldValues: any;
  newValues: any;
  ip: string | null;
  createdAt: string;
}

export interface ActivityListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: ActivityItem[];
}

export async function fetchActivityLog(params?: {
  userId?: number;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActivityListResponse> {
  const query = new URLSearchParams();
  if (params?.userId) query.set("userId", params.userId.toString());
  if (params?.action) query.set("action", params.action);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());

  const res = await fetch(`/api/activity?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "فشل جلب سجل النشاطات");
  }
  return res.json();
}

export function translateAction(action: string): { label: string; color: string } {
  switch (action) {
    case "auth.login":
      return { label: "تسجيل دخول", color: "bg-blue-100 text-blue-800" };
    case "auth.logout":
      return { label: "تسجيل خروج", color: "bg-slate-100 text-slate-700" };
    case "auth.login_failed":
      return { label: "فشل دخول", color: "bg-rose-100 text-rose-800" };
    case "auth.password_changed":
      return { label: "تغيير كلمة المرور", color: "bg-indigo-100 text-indigo-800" };
    case "medicine.created":
      return { label: "إضافة دواء جديد", color: "bg-blue-100 text-blue-800" };
    case "medicine.updated":
      return { label: "تعديل دواء", color: "bg-blue-100 text-blue-800" };
    case "medicine.price_changed":
      return { label: "تعديل سعر دواء", color: "bg-amber-100 text-amber-800" };
    case "medicine.archived":
      return { label: "أرشفة دواء", color: "bg-red-100 text-red-800" };
    case "medicine.restored":
      return { label: "استعادة دواء", color: "bg-indigo-100 text-indigo-800" };
    case "user.created":
      return { label: "إضافة مستخدم", color: "bg-blue-100 text-blue-800" };
    case "user.updated":
      return { label: "تعديل مستخدم", color: "bg-blue-100 text-blue-800" };
    case "user.activated":
      return { label: "تفعيل مستخدم", color: "bg-blue-100 text-blue-800" };
    case "user.deactivated":
      return { label: "تعطيل مستخدم", color: "bg-red-100 text-red-800" };
    case "user.password_reset":
      return { label: "إعادة تعيين كلمة مرور", color: "bg-amber-100 text-amber-800" };
    default:
      return { label: action, color: "bg-gray-100 text-gray-800" };
  }
}
