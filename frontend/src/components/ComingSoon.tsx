import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
}

export default function ComingSoon({
  icon: Icon,
  title,
  description = "الصفحة قيد التطوير وستتوفر بالكامل في التحديث القادم مع استكمال الربط مع الـ Backend.",
  badge = "قريباً",
}: Props) {
  return (
    <div className="bg-white border border-[#DCE6E1] rounded-2xl p-12 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#F5F8F7] border border-[#DCE6E1] flex items-center justify-center mb-4 text-[#087F68]">
        <Icon size={32} />
      </div>
      <div className="inline-block px-3 py-1 rounded-full bg-[#E6F4F1] text-[#087F68] text-xs font-bold mb-3">
        {badge}
      </div>
      <h2 className="text-[#064E49] text-xl font-bold m-0 mb-2">{title}</h2>
      <p className="text-[#64748B] text-sm leading-relaxed max-w-md m-0 mb-6">{description}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#087F68] text-white text-sm font-semibold hover:bg-[#066653] transition-colors no-underline"
      >
        <ArrowRight size={16} />
        <span>العودة للرئيسية</span>
      </Link>
    </div>
  );
}
