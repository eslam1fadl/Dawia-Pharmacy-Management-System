"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Shield,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemUser {
  id: number;
  username: string;
  full_name: string;
  role_id: number;
  role: string;
  role_label: string;
  is_active: number;
  must_change_password: number;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  label: string;
  permissions: string[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "خطأ"); }
  return r.json();
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "خطأ"); }
  return r.json();
}

async function apiPatch<T>(path: string, body?: object): Promise<T> {
  const r = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "خطأ"); }
  return r.json();
}

// ─── Role badge colors ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  manager:      "bg-purple-100 text-purple-800",
  pharmacist:   "bg-blue-100 text-blue-800",
  cashier:      "bg-sky-100 text-sky-800",
  stock_keeper: "bg-amber-100 text-amber-800",
};

// ─── Permission labels ────────────────────────────────────────────────────────

const PERM_LABELS: Record<string, string> = {
  "dashboard.view":    "عرض الرئيسية",
  "pos.sell":          "إجراء البيع",
  "pos.discount":      "منح خصم",
  "pos.cancel":        "إلغاء فاتورة",
  "medicines.view":    "عرض الأدوية",
  "medicines.manage":  "إدارة الأدوية",
  "medicines.edit_price": "تعديل الأسعار",
  "inventory.view":    "عرض المخزون",
  "inventory.adjust":  "تسوية المخزون",
  "expiry.view":       "عرض الصلاحية",
  "purchases.view":    "عرض المشتريات",
  "purchases.manage":  "إدارة المشتريات",
  "suppliers.view":    "عرض الموردين",
  "suppliers.manage":  "إدارة الموردين",
  "returns.manage":    "إدارة المرتجعات",
  "customers.manage":  "إدارة العملاء",
  "expenses.manage":   "إدارة المصروفات",
  "reports.sales":     "تقارير المبيعات",
  "reports.profit":    "تقارير الأرباح",
  "reports.inventory": "تقارير المخزون",
  "users.manage":      "إدارة المستخدمين",
  "activity.view":     "سجل النشاط",
  "backup.manage":     "النسخ الاحتياطي",
  "settings.manage":   "الإعدادات",
};

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
  roles,
  onClose,
  onCreated,
}: {
  roles: Role[];
  onClose: () => void;
  onCreated: (u: SystemUser) => void;
}) {
  const [form, setForm] = useState({ username: "", fullName: "", password: "", roleId: roles[0]?.id ?? 0, mustChangePassword: true });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  const submit = () => {
    setErr(null);
    startT(async () => {
      try {
        const data = await apiPost<{ user: SystemUser }>("/api/users", { ...form, roleId: Number(form.roleId) });
        onCreated(data.user);
      } catch (e: any) { setErr(e.message); }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center"><UserPlus size={16} /></div>
            <span className="font-bold text-sm">إضافة مستخدم جديد</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 bg-transparent border-none text-white cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{err}</div>}

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">اسم المستخدم (للتسجيل)*</label>
            <input
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="مثال: ali_pharmacy"
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">الاسم الكامل*</label>
            <input
              value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="مثال: علي محمد أحمد"
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">كلمة المرور المؤقتة*</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="6 أحرف على الأقل"
                className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 font-mono pe-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 left-3 p-1 text-[#64748B] bg-transparent border-none cursor-pointer">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">الدور الوظيفي*</label>
            <select
              value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.mustChangePassword}
              onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
              className="w-4 h-4 rounded accent-[#2563EB]" />
            <span className="text-xs text-[#64748B]">إجبار المستخدم على تغيير كلمة المرور عند أول دخول</span>
          </label>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] bg-white cursor-pointer hover:bg-[#F1F5F9]">إلغاء</button>
          <button onClick={submit} disabled={pending}
            className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
            {pending && <Loader2 size={14} className="animate-spin" />}
            إضافة المستخدم
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({
  user,
  roles,
  currentUserId,
  onClose,
  onUpdated,
}: {
  user: SystemUser;
  roles: Role[];
  currentUserId: number;
  onClose: () => void;
  onUpdated: (u: SystemUser) => void;
}) {
  const [form, setForm] = useState({ fullName: user.full_name, roleId: user.role_id });
  const [err, setErr] = useState<string | null>(null);
  const [pending, startT] = useTransition();
  const isSelf = user.id === currentUserId;

  const submit = () => {
    setErr(null);
    startT(async () => {
      try {
        const data = await apiPatch<{ user: SystemUser }>(`/api/users/${user.id}`, { fullName: form.fullName, roleId: Number(form.roleId) });
        onUpdated(data.user);
      } catch (e: any) { setErr(e.message); }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center"><Edit2 size={16} /></div>
            <span className="font-bold text-sm">تعديل: {user.full_name}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 bg-transparent border-none text-white cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{err}</div>}

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">الاسم الكامل</label>
            <input
              value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#173B67] block mb-1.5">الدور الوظيفي</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
              disabled={isSelf}
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white disabled:opacity-60"
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {isSelf && <p className="text-[11px] text-amber-600 mt-1">لا يمكنك تغيير دورك بنفسك</p>}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] bg-white cursor-pointer hover:bg-[#F1F5F9]">إلغاء</button>
          <button onClick={submit} disabled={pending}
            className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
            {pending && <Loader2 size={14} className="animate-spin" />}
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: SystemUser;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ newPassword: "", mustChangePassword: true });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startT] = useTransition();

  const submit = () => {
    setErr(null);
    startT(async () => {
      try {
        await apiPost(`/api/users/${user.id}/reset-password`, form);
        setSuccess(true);
      } catch (e: any) { setErr(e.message); }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#173B67] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center"><KeyRound size={16} /></div>
            <span className="font-bold text-sm">إعادة تعيين كلمة المرور</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 bg-transparent border-none text-white cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#64748B]">إعادة تعيين كلمة مرور: <span className="font-bold text-[#173B67]">{user.full_name}</span></p>

          {success ? (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={18} />
              تم إعادة التعيين بنجاح — سيُطلب من المستخدم تغيير كلمة مروره عند الدخول
            </div>
          ) : (
            <>
              {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{err}</div>}
              <div>
                <label className="text-xs font-semibold text-[#173B67] block mb-1.5">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="6 أحرف على الأقل"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 font-mono pe-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 p-1 text-[#64748B] bg-transparent border-none cursor-pointer">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.mustChangePassword}
                  onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#2563EB]" />
                <span className="text-xs text-[#64748B]">إجبار المستخدم على التغيير عند أول دخول</span>
              </label>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] bg-white cursor-pointer hover:bg-[#F1F5F9]">
            {success ? "إغلاق" : "إلغاء"}
          </button>
          {!success && (
            <button onClick={submit} disabled={pending}
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer disabled:opacity-60 flex items-center gap-2">
              {pending && <Loader2 size={14} className="animate-spin" />}
              تأكيد الإعادة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Roles Panel ──────────────────────────────────────────────────────────────

function RolesPanel({ roles }: { roles: Role[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-[#2563EB]" />
        <h2 className="text-base font-bold text-[#173B67] m-0">الأدوار والصلاحيات</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roles.map((role) => (
          <div key={role.id} className="border border-[#CBD5E1] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === role.id ? null : role.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] cursor-pointer border-none text-right"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ROLE_COLORS[role.name] ?? "bg-gray-100 text-gray-700"}`}>
                  {role.label}
                </span>
                <span className="text-xs text-[#64748B]">{role.permissions.length} صلاحية</span>
              </div>
              <span className="text-xs text-[#2563EB] font-medium">{expanded === role.id ? "إخفاء ▲" : "عرض ▼"}</span>
            </button>
            {expanded === role.id && (
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-medium">
                    <CheckCircle2 size={10} />
                    {PERM_LABELS[p] ?? p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers]   = useState<SystemUser[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  // Modals
  const [showCreate,     setShowCreate]     = useState(false);
  const [editingUser,    setEditingUser]    = useState<SystemUser | null>(null);
  const [resetUser,      setResetUser]      = useState<SystemUser | null>(null);
  const [confirmToggle,  setConfirmToggle]  = useState<SystemUser | null>(null);
  const [togglePending,  startToggleT]      = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const canManage = currentUser?.permissions?.includes("users.manage") ?? false;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [me, usersData, rolesData] = await Promise.all([
        getCurrentUser(),
        apiGet<{ users: SystemUser[] }>("/api/users"),
        apiGet<{ roles: Role[] }>("/api/users/roles"),
      ]);
      if (me) setCurrentUser(me);
      setUsers(usersData.users);
      setRoles(rolesData.roles);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = (user: SystemUser) => {
    setConfirmToggle(null);
    startToggleT(async () => {
      try {
        const action = user.is_active ? "deactivate" : "activate";
        await apiPatch(`/api/users/${user.id}/${action}`);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: user.is_active ? 0 : 1 } : u));
        showToast(user.is_active ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم");
      } catch (e: any) { showToast(e.message, false); }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-[#2563EB]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
        <AlertTriangle size={18} /> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون والصلاحيات"
        description="إدارة حسابات الموظفين وأدوارهم وصلاحيات كل منهم"
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.ok ? "bg-[#173B67] text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header actions */}
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] border-none cursor-pointer shadow-sm"
          >
            <UserPlus size={16} />
            إضافة مستخدم
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
          <Users size={18} className="text-[#2563EB]" />
          <h2 className="text-base font-bold text-[#173B67] m-0">
            المستخدمون ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F1F5F9] text-[#64748B] text-xs">
                <th className="text-right px-4 py-3 font-semibold">المستخدم</th>
                <th className="text-right px-4 py-3 font-semibold">الدور</th>
                <th className="text-right px-4 py-3 font-semibold">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold">تاريخ الإنشاء</th>
                {canManage && <th className="text-right px-4 py-3 font-semibold">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-sm shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#173B67] flex items-center gap-1.5">
                            {user.full_name}
                            {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold">أنت</span>}
                            {user.must_change_password === 1 && (
                              <span title="يجب تغيير كلمة المرور" className="text-amber-500"><KeyRound size={12} /></span>
                            )}
                          </div>
                          <div className="text-xs text-[#94A3B8] font-mono">{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {user.role_label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                          <CheckCircle2 size={14} /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                          <XCircle size={14} /> معطل
                        </span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">
                      {new Date(user.created_at).toLocaleDateString("ar-EG")}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => setEditingUser(user)}
                            title="تعديل"
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] bg-transparent border-none cursor-pointer transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Reset password */}
                          <button
                            onClick={() => setResetUser(user)}
                            title="إعادة تعيين كلمة المرور"
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-amber-600 hover:bg-amber-50 bg-transparent border-none cursor-pointer transition-colors"
                          >
                            <KeyRound size={15} />
                          </button>

                          {/* Activate / Deactivate */}
                          {!isSelf && (
                            <button
                              onClick={() => setConfirmToggle(user)}
                              title={user.is_active ? "تعطيل" : "تفعيل"}
                              className={`p-1.5 rounded-lg bg-transparent border-none cursor-pointer transition-colors ${
                                user.is_active
                                  ? "text-[#64748B] hover:text-red-600 hover:bg-red-50"
                                  : "text-[#64748B] hover:text-[#15803D] hover:bg-blue-50"
                              }`}
                            >
                              {user.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Panel */}
      <RolesPanel roles={roles} />

      {/* ── Modals ── */}
      {showCreate && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={(u) => {
            setUsers((prev) => [...prev, u]);
            setShowCreate(false);
            showToast("تم إضافة المستخدم بنجاح");
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          currentUserId={currentUser?.id ?? -1}
          onClose={() => setEditingUser(null)}
          onUpdated={(u) => {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, full_name: u.full_name, role_id: u.role_id, role: u.role, role_label: u.role_label } : x)));
            setEditingUser(null);
            showToast("تم تحديث بيانات المستخدم");
          }}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      {/* Confirm toggle dialog */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmToggle.is_active ? "bg-red-100 text-red-600" : "bg-blue-100 text-[#2563EB]"}`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="font-bold text-[#173B67] text-sm m-0">
                  {confirmToggle.is_active ? "تعطيل المستخدم؟" : "تفعيل المستخدم؟"}
                </p>
                <p className="text-xs text-[#64748B] m-0 mt-0.5">{confirmToggle.full_name}</p>
              </div>
            </div>
            {confirmToggle.is_active && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                سيتم إنهاء جميع جلساته النشطة فوراً
              </p>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setConfirmToggle(null)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#64748B] bg-white cursor-pointer hover:bg-[#F1F5F9]">
                إلغاء
              </button>
              <button
                onClick={() => handleToggle(confirmToggle)}
                disabled={togglePending}
                className={`px-5 py-2 rounded-xl text-white text-sm font-semibold border-none cursor-pointer disabled:opacity-60 flex items-center gap-2 ${confirmToggle.is_active ? "bg-red-600 hover:bg-red-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"}`}
              >
                {togglePending && <Loader2 size={14} className="animate-spin" />}
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
