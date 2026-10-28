import { Undo2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="مرتجعات الأدوية"
        description="تسجيل مرتجعات المبيعات للعملاء ومرتجعات الشراء للشركات"
      />
      <ComingSoon
        icon={Undo2}
        title="إدارة المرتجعات"
        description="صفحة معالجة مرتجعات الفواتير وإرجاع المنتجات إلى المخزون أو للشركات قيد التجهيز."
      />
    </div>
  );
}
