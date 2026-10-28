import { Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="المصروفات النثرية"
        description="تسجيل المصروفات اليومية والشهرية (إيجار، كهرباء، مرتبات، نثريات)"
      />
      <ComingSoon
        icon={Wallet}
        title="إدارة المصروفات اليومية"
        description="صفحة تسجيل وسندات الصرف ومتابعة بنود المصروفات وحسابات الخزينة قيد التطوير."
      />
    </div>
  );
}
