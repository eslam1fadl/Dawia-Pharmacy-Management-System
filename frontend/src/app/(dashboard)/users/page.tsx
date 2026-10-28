"use client";

import { useEffect, useState } from "react";
import { UserCog, Shield, Users, Check, Lock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Array<{ name: string; label: string }>>([]);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (d.roles) setRoles(d.roles);
      })
      .catch(console.error);
  }, []);

  const rolesDetails = [
    {
      name: "manager",
      label: "مدير النظام",
      desc: "صلاحيات كاملة على كل شيء (الأدوية، التسعير، المستخدمين، النشاطات، النسخ الاحتياطي)",
      color: "bg-purple-100 text-purple-800",
    },
    {
      name: "pharmacist",
      label: "صيدلي",
      desc: "صلاحية إدارة الأدوية والبيع والمخزون والمشتريات والموردين (بدون تعديل أسعار بدون إذن)",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      name: "cashier",
      label: "كاشير",
      desc: "صلاحية البيع عبر نقطة البيع (POS) وعرض الأدوية والعملاء فقط",
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "stock_keeper",
      label: "أمين مخزن",
      desc: "صلاحية إدارة المخزون والأدوية والمشتريات وتواريخ الصلاحية وتنبيهات النواقص",
      color: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون والأدوار"
        description="إدارة حسابات مستخدمي النظام والصلاحيات المخصصة لكل دور"
      />

      {/* Active User Card */}
      {currentUser && (
        <div className="bg-white p-5 rounded-2xl border border-[#DCE6E1] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#087F68]">
              <Users size={24} />
            </div>
            <div>
              <span className="font-bold text-sm text-[#172B24] block">
                {currentUser.fullName || currentUser.username} (حسابك الحالي)
              </span>
              <span className="text-xs text-[#64748B] block mt-0.5">
                اسم المستخدم: <span className="font-mono">{currentUser.username}</span>
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#E6F4F1] text-[#087F68] text-xs font-bold">
            {currentUser.roleLabel || currentUser.role}
          </span>
        </div>
      )}

      {/* Roles & Permissions Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE6E1] shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#064E49] m-0">الأدوار والصلاحيات في النظام</h3>
        <p className="text-xs text-[#64748B] m-0 leading-relaxed">
          يعتمد نظام الصيدلية على نموذج التحكم في الوصول المستند إلى الأدوار (Role-Based Access Control - RBAC).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {rolesDetails.map((r) => (
            <div key={r.name} className="p-4 rounded-xl border border-[#DCE6E1] bg-[#F5F8F7]/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#172B24]">{r.label}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${r.color}`}>
                  {r.name}
                </span>
              </div>
              <p className="text-xs text-[#64748B] m-0 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
