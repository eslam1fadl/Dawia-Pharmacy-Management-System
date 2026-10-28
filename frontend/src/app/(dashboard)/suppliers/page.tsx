import { Truck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الموردين والشركات"
        description="إدارة شركات توزيع الأدوية وحسابات الموردين والأرصدة الافتتاحية"
      />
      <ComingSoon
        icon={Truck}
        title="إدارة الموردين والشركات"
        description="تم إنشاء جدول الموردين في قاعدة البيانات وجاري تجهيز واجهات تسجيل الموردين ومتابعة كشوف الحسابات وفواتير التوريد."
      />
    </div>
  );
}
