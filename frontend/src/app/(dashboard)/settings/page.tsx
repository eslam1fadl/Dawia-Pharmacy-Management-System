"use client";

import { useEffect, useState } from "react";
import { Settings, Shield, User, Lock, KeyRound, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pharmacyName, setPharmacyName] = useState("");
  const [roles, setRoles] = useState<Array<{ name: string; label: string }>>([]);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);

    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.pharmacy) setPharmacyName(d.pharmacy);
        if (d.roles) setRoles(d.roles);
      })
      .catch(console.error);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setLoadingPw(true);
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
    } catch (err: any) {
      setPwError(err?.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoadingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="الإعدادات وحساب المستخدم"
        description="إدارة إعدادات النظام وتغيير كلمة المرور واستعراض الصلاحيات"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pharmacy Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE6E1] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#DCE6E1]">
            <Building2 size={20} className="text-[#087F68]" />
            <h3 className="font-bold text-sm text-[#172B24] m-0">بيانات الصيدلية</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[#64748B] block mb-1">اسم الصيدلية:</span>
              <span className="font-bold text-sm text-[#064E49]">{pharmacyName || "صيدلية دوائي"}</span>
            </div>
            <div>
              <span className="text-[#64748B] block mb-1">حالة السيرفر:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                متصل وجاهز للعمل
              </span>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#DCE6E1] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#DCE6E1]">
            <User size={20} className="text-[#087F68]" />
            <h3 className="font-bold text-sm text-[#172B24] m-0">بيانات الحساب الحالي</h3>
          </div>

          {user ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">اسم المستخدم:</span>
                <span className="font-bold text-[#172B24]">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">الاسم بالكامل:</span>
                <span className="font-bold text-[#172B24]">{user.fullName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">الدور الوظيفي:</span>
                <span className="inline-block px-2 py-0.5 rounded-md bg-[#E6F4F1] text-[#087F68] font-bold">
                  {user.roleLabel || user.role}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block mb-1">الصلاحيات الممنوحة:</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                  {user.permissions?.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-gray-100 text-[#172B24] text-[10px] font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B]">جاري تحميل بيانات المستخدم...</p>
          )}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE6E1] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#DCE6E1]">
          <KeyRound size={20} className="text-[#087F68]" />
          <h3 className="font-bold text-sm text-[#172B24] m-0">تغيير كلمة المرور</h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
          {pwError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>تم تغيير كلمة المرور بنجاح! تم إنهاء الجلسات الأخرى للحماية.</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#172B24] mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#DCE6E1] text-xs outline-none focus:border-[#20C997]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#172B24] mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 أحرف على الأقل"
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#DCE6E1] text-xs outline-none focus:border-[#20C997]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#172B24] mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#DCE6E1] text-xs outline-none focus:border-[#20C997]"
            />
          </div>

          <button
            type="submit"
            disabled={loadingPw}
            className="px-5 py-2.5 rounded-xl bg-[#087F68] hover:bg-[#066653] text-white text-xs font-bold transition-colors border-none cursor-pointer shadow-sm"
          >
            {loadingPw ? "جاري التحديث..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}
