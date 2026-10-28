"use client";

import { useState } from "react";
import type { FormikHelpers } from "formik";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
import { HeartPulse, User, Lock, Eye, EyeOff, AlertCircle, Clock3, ShieldCheck } from "lucide-react";

interface LoginValues {
  username: string;
  password: string;
}

interface LoginResponse {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

const ValidationSchema: Yup.ObjectSchema<LoginValues> = Yup.object({
  username: Yup.string().required("يجب إدخال اسم المستخدم"),
  password: Yup.string().required("يجب إدخال كلمة المرور"),
});

export default function LoginPage() {
  const router = useRouter();
  const [sessionExpired] = useState<boolean>(false);
  const [showPw, setShowPw] = useState<boolean>(false);

  const formik = useFormik<LoginValues>({
    initialValues: { username: "", password: "" },
    validationSchema: ValidationSchema,
    onSubmit: async (values: LoginValues, { setStatus }: FormikHelpers<LoginValues>) => {
      setStatus(null);
      try {
        const res = await fetch(`/api/auth/login`, {
          method: "POST",
          body: JSON.stringify(values),
          headers: { "Content-Type": "application/json" },
        });

        const finalRes: LoginResponse = await res.json();

        if (!res.ok) {
          throw new Error(finalRes.error || finalRes.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
        }

        router.push("/");
        router.refresh();
      } catch (error: any) {
        setStatus(error?.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    },
  });

  const usernameError = Boolean(formik.errors.username && formik.touched.username);
  const passwordError = Boolean(formik.errors.password && formik.touched.password);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F5F8F7] flex items-center justify-center p-4 selection:bg-[#20C997]/20"
    >
      <div className="w-full max-w-[960px] bg-white rounded-[28px] border border-[#DCE6E1] shadow-[0_20px_50px_rgba(6,78,73,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* ── Brand panel ───────────────────────────── */}
        <div className="relative hidden md:flex flex-col justify-between bg-[#064E49] p-10 overflow-hidden text-white">
          {/* Subtle Ambient Glows */}
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-[#20C997]/20 blur-3xl pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#087F68]/40 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* Header Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#087F68] flex items-center justify-center shadow-lg ring-1 ring-white/20">
              <HeartPulse size={26} className="text-[#20C997]" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight m-0 leading-none">دوايا | Dawaya</h1>
              <span className="text-[#20C997] text-xs font-medium block mt-1">Pharmacy Management System</span>
            </div>
          </div>

          {/* Slogan */}
          <div className="relative z-10 my-8">
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#20C997] text-xs font-semibold mb-3">
              إدارة صيدليتك ببساطة
            </div>
            <h2 className="text-white text-3xl font-extrabold leading-snug m-0 mb-3">
              كل ما تحتاجه لإدارة صيدليتك
              <br />
              في مكان واحد
            </h2>
            <p className="text-white/70 text-sm leading-relaxed m-0 max-w-sm">
              تابع الأدوية والمخزون والمبيعات ونقاط البيع والموردين والتقارير بدقة وسهولة متناهية.
            </p>
          </div>

          {/* Security footnote */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/70">
            <ShieldCheck size={16} className="text-[#20C997]" />
            <span>نظام آمن وصلاحيات محكمة حسب دور كل مستخدم</span>
          </div>
        </div>

        {/* ── Form panel ────────────────────────────── */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8 text-center md:text-right">
            <div className="md:hidden w-12 h-12 rounded-2xl bg-[#064E49] flex items-center justify-center mx-auto mb-4">
              <HeartPulse size={24} className="text-[#20C997]" strokeWidth={2} />
            </div>
            <h2 className="text-[#172B24] text-2xl font-bold m-0">تسجيل الدخول</h2>
            <p className="text-[#64748B] text-sm mt-1.5 m-0">
              أهلاً بعودتك، سجّل دخولك لمتابعة العمل في الصيدلية
            </p>
          </div>

          {sessionExpired && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEF3C7] border border-[#B45309]/30 text-[#B45309] text-xs font-medium">
              <Clock3 size={15} className="flex-shrink-0" />
              <span>انتهت جلستك، يرجى تسجيل الدخول مجدداً</span>
            </div>
          )}

          {formik.status && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEE2E2] border border-[#B91C1C]/20 text-[#B91C1C] text-xs font-medium"
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{formik.status}</span>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="username" className="text-[#172B24] text-xs font-bold block mb-1.5">
                اسم المستخدم
              </label>
              <div className="relative">
                <User size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3A0]" />
                <input
                  id="username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="ادخل اسم المستخدم (مثال: admin)"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full py-3 pr-11 pl-4 rounded-xl bg-white text-[#172B24] text-sm placeholder:text-[#94A3A0] outline-none border transition-all ${
                    usernameError
                      ? "border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/15"
                      : "border-[#DCE6E1] hover:border-[#20C997]/60 focus:border-[#20C997] focus:ring-4 focus:ring-[#20C997]/20"
                  }`}
                />
              </div>
              {usernameError && <p className="text-[#B91C1C] text-xs mt-1 m-0">{formik.errors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="text-[#172B24] text-xs font-bold block mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3A0]" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="ادخل كلمة المرور"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full py-3 pr-11 pl-11 rounded-xl bg-white text-[#172B24] text-sm placeholder:text-[#94A3A0] outline-none border transition-all ${
                    passwordError
                      ? "border-[#B91C1C] focus:ring-4 focus:ring-[#B91C1C]/15"
                      : "border-[#DCE6E1] hover:border-[#20C997]/60 focus:border-[#20C997] focus:ring-4 focus:ring-[#20C997]/20"
                  }`}
                />
                <button
                  type="button"
                  aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3A0] hover:text-[#172B24] bg-transparent border-none cursor-pointer outline-none"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && <p className="text-[#B91C1C] text-xs mt-1 m-0">{formik.errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="mt-3 w-full py-3.5 rounded-xl border-none text-white text-sm font-bold transition-all outline-none bg-[#087F68] hover:bg-[#066653] disabled:opacity-60 cursor-pointer shadow-[0_6px_20px_rgba(8,127,104,0.25)] hover:shadow-[0_8px_25px_rgba(6,102,83,0.35)]"
            >
              {formik.isSubmitting ? "جاري التحقق والدخول..." : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}