import { FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="فواتير الشراء والتوريد"
        description="تسجيل فواتير الشراء الواردة من الشركات وتحديث المخزون والأسعار"
      />
      <ComingSoon
        icon={FileText}
        title="فواتير المشتريات"
        description="صفحة تسجيل فواتير الشراء واستلام الشحنات وتحديث أسعار التكلفة قيد التجهيز وستتوفر قريباً."
      />
    </div>
  );
}
