import {
  LayoutDashboard, ShoppingCart, Pill, Boxes, Truck, FileText, Undo2,
  Users, Wallet, BarChart3, UserCog, Settings, Activity, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_GROUPS: NavItem[][] = [
  [
    { label: "الرئيسية", href: "/", icon: LayoutDashboard },
    { label: "نقطة البيع", href: "/pos", icon: ShoppingCart },
  ],
  [
    { label: "الأدوية", href: "/medicines", icon: Pill },
    { label: "المخزون والصلاحية", href: "/inventory", icon: Boxes },
    { label: "الموردين", href: "/suppliers", icon: Truck },
    { label: "فواتير الشراء", href: "/purchases", icon: FileText },
    { label: "المرتجعات", href: "/returns", icon: Undo2 },
  ],
  [
    { label: "العملاء", href: "/customers", icon: Users },
    { label: "المصروفات", href: "/expenses", icon: Wallet },
    { label: "التقارير", href: "/reports", icon: BarChart3 },
  ],
  [
    { label: "المستخدمون", href: "/users", icon: UserCog },
    { label: "سجل العمليات", href: "/activity", icon: Activity },
    { label: "الإعدادات", href: "/settings", icon: Settings },
  ],
];