import { Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="العملاء وحسابات الآجل"
        description="سجل العملاء، أرقام الهواتف، ونظام الديون والمدفوعات"
      />
      <ComingSoon
        icon={Users}
        title="إدارة العملاء والحسابات"
        description="صفحة إدارة بيانات المرضى والعملاء وحسابات الدفع الآجل وكشوف الحساب قيد الإعداد."
      />
    </div>
  );
}
