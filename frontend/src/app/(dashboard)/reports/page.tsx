import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ComingSoon from "@/components/ComingSoon";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير والأرباح"
        description="تقارير حركة المبيعات، حسابات الأرباح، حركة الأصناف الأكثر مبيعاً وركوداً"
      />
      <ComingSoon
        icon={BarChart3}
        title="تقارير الصيدلية الذكية"
        description="جاري العمل على لوحات التحليل المالي، ومعدلات الأرباح الصافية والإجمالية، وتقارير الضرائب والمبيعات."
      />
    </div>
  );
}
