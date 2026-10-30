"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  KeyRound,
  Tag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Save,
  ShieldOff,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Types أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

interface SettingsMap {
  "pharmacy.name": string;
  "pharmacy.phone": string;
  "pharmacy.address": string;
  "pharmacy.logo": string;
  "currency.symbol": string;
  "date.format": string;
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Helper components أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${
        type === "success"
          ? "bg-blue-50 border-blue-200 text-blue-800"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
      ) : (
        <AlertCircle size={15} className="text-red-500 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="border-none bg-transparent cursor-pointer p-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-[#173B67] mb-1">
      {children}
      {required && <span className="text-red-500 mr-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] bg-white disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
    />
  );
}
function LogoUpload({
  currentLogo,
  disabled,
  onChange,
}: {
  currentLogo?: string;
  disabled?: boolean;
  onChange: (dataUrl: string | null) => void;
}) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("ط­ط¬ظ… ط§ظ„ط´ط¹ط§ط± ظٹط¬ط¨ ط£ظ„ط§ ظٹطھط¬ط§ظˆط² 2 ظ…ظٹط¬ط§ط¨ط§ظٹطھ"); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center overflow-hidden shrink-0">
        {currentLogo
          ? <img src={currentLogo} alt="ط´ط¹ط§ط± ط§ظ„طµظٹط¯ظ„ظٹط©" className="w-full h-full object-contain" />
          : <Building2 size={28} className="text-[#CBD5E1]" />
        }
      </div>
      <div className="space-y-1">
        {!disabled && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#173B67] bg-white hover:border-[#2563EB] cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            ط±ظپط¹ ط´ط¹ط§ط± ط¬ط¯ظٹط¯
          </label>
        )}
        {currentLogo && !disabled && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline cursor-pointer bg-transparent border-none">ط­ط°ظپ ط§ظ„ط´ط¹ط§ط±</button>
        )}
        <p className="text-[11px] text-[#94A3B8]">PNG ط£ظˆ JPGطŒ ط£ظ‚طµظ‰ 2 ظ…ظٹط¬ط§ط¨ط§ظٹطھ</p>
      </div>
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  loading,
  type = "button",
  disabled,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-colors border-none cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-xs"}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#173B67] font-semibold transition-colors cursor-pointer ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"}`}
    >
      {children}
    </button>
  );
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Tab definitions أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

const TABS = [
  { id: "pharmacy", label: "ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ©", icon: Building2 },
  { id: "categories", label: "ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آ¯ط¸ث†ط·آ§ط·آ¦ط¸ظ¹ط·آ©", icon: Tag },
  { id: "payment", label: "ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹", icon: CreditCard },
  { id: "password", label: "ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ±", icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Tab: Pharmacy Info أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

function PharmacyTab({ canManage }: { canManage: boolean }) {
  const [form, setForm] = useState<SettingsMap>({
    "pharmacy.name": "",
    "pharmacy.phone": "",
    "pharmacy.address": "",
    "pharmacy.logo": "",
    "currency.symbol": "ج.م",
    "date.format": "ar-EG",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm((prev) => ({
            ...prev,
            "pharmacy.name": d.settings["pharmacy.name"] ?? "",
            "pharmacy.phone": d.settings["pharmacy.phone"] ?? "",
            "pharmacy.address": d.settings["pharmacy.address"] ?? "",
            "currency.symbol": d.settings["currency.symbol"] ?? "ط·آ¬.ط¸â€¦",
            "date.format": d.settings["date.format"] ?? "ar-EG",
          }));
        }
      })
      .catch(() => setError("ط·ع¾ط·آ¹ط·آ°ط¸â€کط·آ± ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍ ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ©"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof SettingsMap) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!form["pharmacy.name"].trim()) {
      setError("ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ© ط¸â€¦ط·آ·ط¸â€‍ط¸ث†ط·آ¨");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·آ­ط¸ظ¾ط·آ¸ ط·آ§ط¸â€‍ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾");
      setSuccess("ط·ع¾ط¸â€¦ ط·آ­ط¸ظ¾ط·آ¸ ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ© ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£ ط·آ£ط·آ«ط¸â€ ط·آ§ط·طŒ ط·آ§ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#64748B]">ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍...</div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-5 max-w-xl">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {!canManage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <ShieldOff size={14} />
          <span>ط·آ¹ط·آ±ط·آ¶ ط¸ظ¾ط¸â€ڑط·آ· أ¢â‚¬â€‌ ط¸â€‍ط¸ظ¹ط·آ³ ط¸â€‍ط·آ¯ط¸ظ¹ط¸ئ’ ط·آµط¸â€‍ط·آ§ط·آ­ط¸ظ¹ط·آ© ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾</span>
        </div>
      )}

      <div>
        <FieldLabel required>ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ©</FieldLabel>
        <Input
          value={form["pharmacy.name"]}
          onChange={set("pharmacy.name")}
          placeholder="ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ©"
          disabled={!canManage}
        />
      </div>

      <div>
        <FieldLabel>ط·آ´ط·آ¹ط·آ§ط·آ± ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ©</FieldLabel>
        <LogoUpload
          currentLogo={form["pharmacy.logo" as keyof typeof form] as string | undefined}
          disabled={!canManage}
          onChange={(dataUrl) => setForm((p) => ({ ...p, "pharmacy.logo": dataUrl || "" }))}
        />
      </div>

      <div>
        <FieldLabel>ط·آ±ط¸â€ڑط¸â€¦ ط·آ§ط¸â€‍ط¸â€،ط·آ§ط·ع¾ط¸ظ¾</FieldLabel>
        <Input
          value={form["pharmacy.phone"]}
          onChange={set("pharmacy.phone")}
          placeholder="01xxxxxxxxx"
          disabled={!canManage}
        />
      </div>

      <div>
        <FieldLabel>ط·آ§ط¸â€‍ط·آ¹ط¸â€ ط¸ث†ط·آ§ط¸â€ </FieldLabel>
        <Input
          value={form["pharmacy.address"]}
          onChange={set("pharmacy.address")}
          placeholder="ط·آ§ط¸â€‍ط¸â€¦ط·آ­ط·آ§ط¸ظ¾ط·آ¸ط·آ©ط·إ’ ط·آ§ط¸â€‍ط¸â€¦ط·آ¯ط¸ظ¹ط¸â€ ط·آ©ط·إ’ ط·آ§ط¸â€‍ط·آ´ط·آ§ط·آ±ط·آ¹"
          disabled={!canManage}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>ط·آ±ط¸â€¦ط·آ² ط·آ§ط¸â€‍ط·آ¹ط¸â€¦ط¸â€‍ط·آ©</FieldLabel>
          <Input
            value={form["currency.symbol"]}
            onChange={set("currency.symbol")}
            placeholder="ط·آ¬.ط¸â€¦"
            disabled={!canManage}
          />
        </div>
        <div>
          <FieldLabel>ط·ع¾ط¸â€ ط·آ³ط¸ظ¹ط¸â€ڑ ط·آ§ط¸â€‍ط·ع¾ط·آ§ط·آ±ط¸ظ¹ط·آ®</FieldLabel>
          <select
            value={form["date.format"]}
            onChange={(e) => set("date.format")(e.target.value)}
            disabled={!canManage}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] bg-white disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]"
          >
            <option value="ar-EG">ط·آ¹ط·آ±ط·آ¨ط¸ظ¹ (ar-EG)</option>
            <option value="en-GB">ط·آ¥ط¸â€ ط·آ¬ط¸â€‍ط¸ظ¹ط·آ²ط¸ظ¹ (en-GB)</option>
            <option value="en-US">ط·آ£ط¸â€¦ط·آ±ط¸ظ¹ط¸ئ’ط¸ظ¹ (en-US)</option>
          </select>
        </div>
      </div>

      {canManage && (
        <PrimaryBtn onClick={handleSave} loading={saving}>
          <Save size={14} />
          {saving ? "ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸..." : "ط·آ­ط¸ظ¾ط·آ¸ ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ§ط¸â€ ط·آ§ط·ع¾"}
        </PrimaryBtn>
      )}
    </div>
  );
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Tab: Categories أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

function CategoriesTab({ canManage }: { canManage: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add new category
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/settings/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setError("ط·ع¾ط·آ¹ط·آ°ط¸â€کط·آ± ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ط·آ§ط·ع¾"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾");
      setSuccess("ط·ع¾ط¸â€¦ط·ع¾ ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­");
      setNewName("");
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;
    setEditLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾");
      setSuccess("ط·ع¾ط¸â€¦ ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­");
      setEditId(null);
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    if (!cat.isActive) {
      // Activating أ¢â‚¬â€‌ no confirm needed
    } else {
      if (!confirm(`ط¸â€،ط¸â€‍ ط·ع¾ط·آ±ط¸ظ¹ط·آ¯ ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ "${cat.name}"ط·ع؛ ط·آ³ط¸ظ¹ط·آ¤ط·آ«ط·آ± ط·آ°ط¸â€‍ط¸ئ’ ط·آ¹ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط·آ£ط·آ¯ط¸ث†ط¸ظ¹ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط·ع¾ط·آ¨ط·آ·ط·آ© ط·آ¨ط¸â€،.`)) return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/settings/categories/${cat.id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط·آ­ط·آ§ط¸â€‍ط·آ© ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾");
      setSuccess(data.message || "ط·ع¾ط¸â€¦ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط·آ­ط·آ§ط¸â€‍ط·آ©");
      load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£");
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-[#64748B]">ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍...</div>;

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex items-center justify-between">
        <p className="text-xs text-[#64748B]">
          ط·آ¥ط·آ¬ط¸â€¦ط·آ§ط¸â€‍ط¸ظ¹ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ط·آ§ط·ع¾: <span className="font-bold text-[#173B67]">{categories.length}</span>
          {" ط¢آ· "}
          ط¸â€ ط·آ´ط·آ·: <span className="font-bold text-green-700">{categories.filter((c) => c.isActive).length}</span>
        </p>
        {canManage && (
          <PrimaryBtn small onClick={() => { setShowAdd(true); setNewName(""); }}>
            <Plus size={13} />
            ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯
          </PrimaryBtn>
        )}
      </div>

      {showAdd && canManage && (
        <div className="flex gap-2 items-center p-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC]">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ ط·آ§ط¸â€‍ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯"
            className="flex-1 py-2 px-3 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6]"
          />
          <PrimaryBtn small onClick={handleAdd} loading={adding}>
            <Save size={12} />
            {adding ? "ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸..." : "ط·آ­ط¸ظ¾ط·آ¸"}
          </PrimaryBtn>
          <GhostBtn small onClick={() => setShowAdd(false)}>
            <X size={12} />
            ط·آ¥ط¸â€‍ط·ط›ط·آ§ط·طŒ
          </GhostBtn>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-right text-[#64748B] border-b border-[#CBD5E1]">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾</th>
              <th className="py-2.5 px-3 font-semibold text-center">ط·آ§ط¸â€‍ط·آ­ط·آ§ط¸â€‍ط·آ©</th>
              {canManage && <th className="py-2.5 px-3 font-semibold text-center">ط·آ¥ط·آ¬ط·آ±ط·آ§ط·طŒط·آ§ط·ع¾</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, i) => (
              <tr key={cat.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <td className="py-2.5 px-3 text-[#94A3B8]">{i + 1}</td>
                <td className="py-2.5 px-3">
                  {editId === cat.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(cat.id); if (e.key === "Escape") setEditId(null); }}
                        className="py-1.5 px-2 rounded-lg border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6] w-40"
                      />
                      <button
                        onClick={() => handleEdit(cat.id)}
                        disabled={editLoading}
                        className="text-[#2563EB] border-none bg-transparent cursor-pointer p-0 disabled:opacity-50"
                      >
                        <Save size={13} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-[#94A3B8] border-none bg-transparent cursor-pointer p-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-[#173B67]">{cat.name}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-[#64748B]"
                    }`}
                  >
                    {cat.isActive ? "ط¸â€ ط·آ´ط·آ·" : "ط¸â€¦ط¸ث†ط¸â€ڑط¸ث†ط¸ظ¾"}
                  </span>
                </td>
                {canManage && (
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·آ§ط·آ³ط¸â€¦"
                        onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-[#2563EB] border-none bg-transparent cursor-pointer transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        title={cat.isActive ? "ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾" : "ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾"}
                        onClick={() => handleToggle(cat)}
                        className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                          cat.isActive
                            ? "hover:bg-red-50 text-red-500"
                            : "hover:bg-green-50 text-green-600"
                        }`}
                      >
                        {cat.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#94A3B8]">
                  ط¸â€‍ط·آ§ ط·ع¾ط¸ث†ط·آ¬ط·آ¯ ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ط·آ§ط·ع¾ ط·آ¨ط·آ¹ط·آ¯
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Tab: Payment Methods أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

function PaymentTab({ canManage }: { canManage: boolean }) {
  const [methods, setMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMethod, setNewMethod] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/payment-methods")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods ?? []))
      .catch(() => setError("ط·ع¾ط·آ¹ط·آ°ط¸â€کط·آ± ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍ ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methods: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·آ­ط¸ظ¾ط·آ¸ ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹");
      setMethods(data.methods ?? updated);
      setSuccess("ط·ع¾ط¸â€¦ ط·آ­ط¸ظ¾ط·آ¸ ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹ ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;
    if (methods.includes(trimmed)) { setError("ط·آ·ط·آ±ط¸ظ¹ط¸â€ڑط·آ© ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹ ط¸â€¦ط¸ث†ط·آ¬ط¸ث†ط·آ¯ط·آ© ط·آ¨ط·آ§ط¸â€‍ط¸ظ¾ط·آ¹ط¸â€‍"); return; }
    const updated = [...methods, trimmed];
    setNewMethod("");
    save(updated);
  };

  const handleDelete = (m: string) => {
    if (!confirm(`ط¸â€،ط¸â€‍ ط·ع¾ط·آ±ط¸ظ¹ط·آ¯ ط·آ­ط·آ°ط¸ظ¾ ط·آ·ط·آ±ط¸ظ¹ط¸â€ڑط·آ© ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹ "${m}"ط·ع؛`)) return;
    save(methods.filter((x) => x !== m));
  };

  if (loading) return <div className="p-8 text-center text-xs text-[#64748B]">ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸â€¦ط¸ظ¹ط¸â€‍...</div>;

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4 max-w-md">
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {!canManage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <ShieldOff size={14} />
          <span>ط·آ¹ط·آ±ط·آ¶ ط¸ظ¾ط¸â€ڑط·آ· أ¢â‚¬â€‌ ط¸â€‍ط¸ظ¹ط·آ³ ط¸â€‍ط·آ¯ط¸ظ¹ط¸ئ’ ط·آµط¸â€‍ط·آ§ط·آ­ط¸ظ¹ط·آ© ط·ع¾ط·آ¹ط·آ¯ط¸ظ¹ط¸â€‍ ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹</span>
        </div>
      )}

      <div className="space-y-2">
        {methods.map((m) => (
          <div
            key={m}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC]"
          >
            <span className="text-xs font-semibold text-[#173B67]">{m}</span>
            {canManage && (
              <button
                onClick={() => handleDelete(m)}
                disabled={saving || methods.length <= 1}
                title="ط·آ­ط·آ°ط¸ظ¾"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {methods.length === 0 && (
          <p className="text-xs text-[#94A3B8] text-center py-4">ط¸â€‍ط·آ§ ط·ع¾ط¸ث†ط·آ¬ط·آ¯ ط·آ·ط·آ±ط¸â€ڑ ط·آ¯ط¸ظ¾ط·آ¹</p>
        )}
      </div>

      {canManage && (
        <div className="flex gap-2 items-center pt-2">
          <input
            type="text"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="ط·آ£ط·آ¶ط¸ظ¾ ط·آ·ط·آ±ط¸ظ¹ط¸â€ڑط·آ© ط·آ¯ط¸ظ¾ط·آ¹ ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯ط·آ©..."
            className="flex-1 py-2.5 px-3.5 rounded-xl border border-[#CBD5E1] text-xs outline-none focus:border-[#3B82F6]"
          />
          <PrimaryBtn small onClick={handleAdd} loading={saving} disabled={!newMethod.trim()}>
            <Plus size={13} />
            ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ©
          </PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Tab: Change Password أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·آ§ط¸â€‍ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯ط·آ© 8 ط·آ£ط·آ­ط·آ±ط¸ظ¾ ط·آ¹ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط·آ£ط¸â€ڑط¸â€‍");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("ط¸ئ’ط¸â€‍ط¸â€¦ط·ع¾ط·آ§ ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·ط›ط¸ظ¹ط·آ± ط¸â€¦ط·ع¾ط·آ·ط·آ§ط·آ¨ط¸â€ڑط·ع¾ط¸ظ¹ط¸â€ ");
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
      if (!res.ok) throw new Error(data.error || "ط¸ظ¾ط·آ´ط¸â€‍ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ±");
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      const err = e as Error;
      setPwError(err?.message || "ط·آ­ط·آ¯ط·آ« ط·آ®ط·آ·ط·آ£ ط·آ£ط·آ«ط¸â€ ط·آ§ط·طŒ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ±");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-6 space-y-4 max-w-md">
      {pwError && <Alert type="error" message={pwError} onClose={() => setPwError(null)} />}
      {pwSuccess && (
        <Alert
          type="success"
          message="ط·ع¾ط¸â€¦ ط·ع¾ط·ط›ط¸ظ¹ط¸ظ¹ط·آ± ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­! ط·ع¾ط¸â€¦ ط·آ¥ط¸â€ ط¸â€،ط·آ§ط·طŒ ط·آ§ط¸â€‍ط·آ¬ط¸â€‍ط·آ³ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آ£ط·آ®ط·آ±ط¸â€° ط¸â€‍ط¸â€‍ط·آ­ط¸â€¦ط·آ§ط¸ظ¹ط·آ©."
          onClose={() => setPwSuccess(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel required>ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·آ§ط¸â€‍ط·آ­ط·آ§ط¸â€‍ط¸ظ¹ط·آ©</FieldLabel>
          <Input
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢"
          />
        </div>
        <div>
          <FieldLabel required>ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·آ§ط¸â€‍ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯ط·آ©</FieldLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="8 ط·آ£ط·آ­ط·آ±ط¸ظ¾ ط·آ¹ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط·آ£ط¸â€ڑط¸â€‍"
          />
        </div>
        <div>
          <FieldLabel required>ط·ع¾ط·آ£ط¸ئ’ط¸ظ¹ط·آ¯ ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ± ط·آ§ط¸â€‍ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯ط·آ©</FieldLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢أ¢â‚¬آ¢"
          />
        </div>
        <PrimaryBtn type="submit" loading={loading}>
          <Save size={14} />
          {loading ? "ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·ع¾ط·آ­ط·آ¯ط¸ظ¹ط·آ«..." : "ط·آ­ط¸ظ¾ط·آ¸ ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ±"}
        </PrimaryBtn>
      </form>
    </div>
  );
}

// أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬ Main Page أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬أ¢â€‌â‚¬

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pharmacy");

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const canManage = !!(user?.permissions?.includes("settings.manage"));

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <PageHeader
        title="ط·آ§ط¸â€‍ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾"
        description="ط·آ¥ط·آ¯ط·آ§ط·آ±ط·آ© ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط·آµط¸ظ¹ط·آ¯ط¸â€‍ط¸ظ¹ط·آ© ط¸ث†ط·آ§ط¸â€‍ط·ع¾ط·آµط¸â€ ط¸ظ¹ط¸ظ¾ط·آ§ط·ع¾ ط¸ث†ط·آ·ط·آ±ط¸â€ڑ ط·آ§ط¸â€‍ط·آ¯ط¸ظ¾ط·آ¹ ط¸ث†ط¸ئ’ط¸â€‍ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط¸ث†ط·آ±"
      />

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-[#CBD5E1] shadow-sm p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-transparent text-[#64748B] hover:text-[#173B67] hover:bg-[#F1F5F9]"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "pharmacy" && <PharmacyTab canManage={canManage} />}
      {activeTab === "categories" && <CategoriesTab canManage={canManage} />}
      {activeTab === "payment" && <PaymentTab canManage={canManage} />}
      {activeTab === "password" && <PasswordTab />}
    </div>
  );
}
