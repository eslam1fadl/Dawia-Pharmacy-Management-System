"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pill,
  ShoppingCart,
  Boxes,
  Truck,
  FileText,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Package,
  Layers,
  ChevronLeft,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchMedicines, fetchCategories, type Medicine } from "@/lib/medicines";
import { fetchActivityLog, translateAction, type ActivityItem } from "@/lib/activity";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pharmacyName, setPharmacyName] = useState<string>("صيدليتي");
  const [medicinesTotal, setMedicinesTotal] = useState<number>(0);
  const [activeTotal, setActiveTotal] = useState<number>(0);
  const [categoriesCount, setCategoriesCount] = useState<number>(0);
  const [lowStockItems, setLowStockItems] = useState<Medicine[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Current user
        const u = await getCurrentUser();
        if (u) setUser(u);

        // Health check for pharmacy name
        fetch("/api/health")
          .then((r) => r.json())
          .then((d) => {
            if (d.pharmacy) setPharmacyName(d.pharmacy);
          })
          .catch(() => { });

        // Medicines data
        const [medsRes, cats] = await Promise.all([
          fetchMedicines({ pageSize: 50 }),
          fetchCategories(),
        ]);

        setMedicinesTotal(medsRes.total);
        setActiveTotal(medsRes.items.filter((m) => m.isActive).length);
        setCategoriesCount(cats.length);

        // Low stock or reorder level items
        const reorderItems = medsRes.items.filter((m) => m.reorderLevel > 0).slice(0, 5);
        setLowStockItems(reorderItems);

        // Recent activity
        const activityRes = await fetchActivityLog({ pageSize: 6 });
        setRecentActivities(activityRes.items);
      } catch (err) {
        console.error("Dashboard data error", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#173B67] to-[#2563EB] p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-[#3B82F6]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#BFDBFE] mb-3 backdrop-blur-sm">
              <ShieldCheck size={14} className="text-[#3B82F6]" />
              <span>{pharmacyName} — نظام التشغيل المتكامل</span>
            </div>

            <p className="text-sm text-white/80 mt-2 m-0 max-w-xl leading-relaxed">
              يمكنك متابعة الأصناف والأسعار وسجل العمليات بدقة وكفاءة.
            </p>
          </div>


        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medicines */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block mb-1">إجمالي الأدوية</span>
            <span className="text-2xl font-bold text-[#173B67]">{medicinesTotal}</span>
            <span className="text-[11px] text-[#2563EB] block mt-1 font-medium">مسجلة في قاعدة البيانات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
            <Pill size={24} />
          </div>
        </div>

        {/* Active Medicines */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block mb-1">الأدوية النشطة</span>
            <span className="text-2xl font-bold text-blue-600">{activeTotal}</span>
            <span className="text-[11px] text-[#64748B] block mt-1">متاحة للبيع المباشر</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block mb-1">التصنيفات الدوائية</span>
            <span className="text-2xl font-bold text-[#173B67]">{categoriesCount}</span>
            <span className="text-[11px] text-[#64748B] block mt-1">تصنيف معتمد</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers size={24} />
          </div>
        </div>

        {/* Low Stock Watch */}
        <div className="bg-white p-5 rounded-2xl border border-[#CBD5E1] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] block mb-1">أصناف تحت المتابعة</span>
            <span className="text-2xl font-bold text-amber-600">{lowStockItems.length}</span>
            <span className="text-[11px] text-amber-600 block mt-1 font-medium">محددة بحد إعادة طلب</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Shortcuts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left 2 Cols: Quick Navigation & Services */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#173B67] m-0">أقسام الصيدلية السريعة</h2>
              <span className="text-xs text-[#64748B]">انتقل مباشرة للوظيفة المطلوبة</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/medicines"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <Pill size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">دليل الأدوية</span>
                <span className="text-[11px] text-[#64748B]">بحث وتعديل وإضافة</span>
              </Link>

              <Link
                href="/pos"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <ShoppingCart size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">نقطة البيع (POS)</span>
                <span className="text-[11px] text-[#64748B]">فواتير وصرف أدوية</span>
              </Link>

              <Link
                href="/activity"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <Activity size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">سجل الحركات</span>
                <span className="text-[11px] text-[#64748B]">تدقيق النشاطات والأسعار</span>
              </Link>

              <Link
                href="/inventory"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <Boxes size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">المخزون والصلاحية</span>
                <span className="text-[11px] text-[#64748B]">كميات وتواريخ الانتهاء</span>
              </Link>

              <Link
                href="/suppliers"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <Truck size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">الموردين والشركات</span>
                <span className="text-[11px] text-[#64748B]">بيانات وأرصدة الموردين</span>
              </Link>

              <Link
                href="/reports"
                className="p-4 rounded-xl border border-[#CBD5E1] hover:border-[#3B82F6] hover:bg-[#F1F5F9] transition-all no-underline group flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] group-hover:bg-[#2563EB] flex items-center justify-center transition-colors">
                  <FileText size={18} className="text-[#2563EB] group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-[#173B67]">التقارير والأرباح</span>
                <span className="text-[11px] text-[#64748B]">إحصائيات المبيعات والأرباح</span>
              </Link>
            </div>
          </div>

          {/* Reorder Level Watch List */}
          <div className="bg-white p-6 rounded-2xl border border-[#CBD5E1] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                <h2 className="text-base font-bold text-[#173B67] m-0">أصناف تحت المتابعة (حد الطلب)</h2>
              </div>
              <Link href="/medicines" className="text-xs text-[#2563EB] font-bold no-underline hover:underline">
                عرض جميع الأدوية &larr;
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center m-0">
                لا توجد أدوية وصلت إلى حد إعادة الطلب حالياً.
              </p>
            ) : (
              <div className="divide-y divide-[#CBD5E1]">
                {lowStockItems.map((med) => (
                  <div key={med.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#173B67] block">{med.name}</span>
                      <span className="text-[11px] text-[#64748B]">{med.categoryName || "بدون تصنيف"}</span>
                    </div>
                    <div className="text-left">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                        حد الطلب: {med.reorderLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Activity Feed from Backend */}

      </div>
    </div>
  );
}