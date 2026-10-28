"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  forced?: boolean; // When true, user cannot dismiss without changing password
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordChangeModal({ isOpen, forced = false, onClose, onSuccess }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (currentPassword === newPassword) {
      setError("كلمة المرور الجديدة يجب أن تختلف عن الحالية");
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
      if (!res.ok) {
        throw new Error(data.error || "فشل تغيير كلمة المرور");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DCE6E1] overflow-hidden">
        <div className="px-6 py-4 bg-[#064E49] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#087F68] flex items-center justify-center">
              <Lock size={16} className="text-[#20C997]" />
            </div>
            <div>
              <h3 className="font-bold text-base m-0">
                {forced ? "مطلوب تغيير كلمة المرور" : "تغيير كلمة المرور"}
              </h3>
              <p className="text-xs text-[#B8DCD3] m-0">
                {forced ? "يرجى تعيين كلمة مرور جديدة للمتابعة" : "قم بتحديث كلمة المرور الخاصة بحسابك"}
              </p>
            </div>
          </div>
          {!forced && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FBE1E3] border border-[#F0AEB4] text-[#C24B54] text-xs">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E6F4F1] border border-[#20C997] text-[#087F68] text-xs font-semibold">
              <CheckCircle2 size={16} className="flex-shrink-0 text-[#20C997]" />
              <span>تم تغيير كلمة المرور بنجاح! جاري التحديث...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#172B24] mb-1.5">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                required
                className="w-full py-2.5 px-3.5 pr-3.5 pl-10 rounded-xl border border-[#DCE6E1] text-sm focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172B24] bg-transparent border-none cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B24] mb-1.5">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                required
                minLength={8}
                className="w-full py-2.5 px-3.5 pr-3.5 pl-10 rounded-xl border border-[#DCE6E1] text-sm focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172B24] bg-transparent border-none cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B24] mb-1.5">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور الجديدة"
              required
              className="w-full py-2.5 px-3.5 rounded-xl border border-[#DCE6E1] text-sm focus:border-[#20C997] focus:ring-2 focus:ring-[#20C997]/20 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            {!forced && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#DCE6E1] text-[#64748B] hover:bg-[#F5F8F7] text-sm font-medium bg-transparent cursor-pointer"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 rounded-xl bg-[#087F68] text-white hover:bg-[#066653] text-sm font-semibold border-none cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
