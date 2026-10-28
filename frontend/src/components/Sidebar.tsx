"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartPulse, LogOut, X, UserCircle, KeyRound, Shield } from "lucide-react";
import { NAV_GROUPS, type NavItem } from "@/lib/nav";
import { getCurrentUser, logoutUser, type UserProfile } from "@/lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenPasswordModal?: () => void;
}

export default function Sidebar({ open, onClose, onOpenPasswordModal }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser(u);
    });
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      <aside
        className={`
          bg-[#173B67] flex flex-col w-64 shrink-0
          transition-transform duration-200
          fixed inset-y-0 right-0 z-40 h-dvh
          ${open ? "translate-x-0" : "translate-x-full"}
          lg:static lg:translate-x-0 lg:h-full lg:z-auto
        `}
      >
        {/* Brand */}
        <div className="shrink-0 flex items-center justify-between px-5 h-[76px] border-b border-[#2563EB]/60">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md ring-1 ring-white/10">
              <HeartPulse size={22} className="text-[#3B82F6]" strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-white text-lg font-bold block leading-none">دوايا | Dawaya</span>
              <span className="text-[#3B82F6] text-[11px] font-medium block mt-1">إدارة صيدليتك ببساطة</span>
            </div>
          </Link>
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="shrink-0 mx-3 mt-3 px-3 py-2.5 rounded-xl bg-[#1e3a5f] border border-[#2563EB]/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white flex-shrink-0">
                <UserCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate m-0">{user.fullName || user.username}</p>
                <div className="flex items-center gap-1 text-[#3B82F6] text-[10px] mt-0.5">
                  <Shield size={10} />
                  <span>{user.roleLabel || user.role}</span>
                </div>
              </div>
            </div>
            {onOpenPasswordModal && (
              <button
                type="button"
                title="تغيير كلمة المرور"
                onClick={onOpenPasswordModal}
                className="p-1.5 rounded-lg text-[#3B82F6] hover:text-white hover:bg-[#2563EB]/40 bg-transparent border-none cursor-pointer transition-colors"
              >
                <KeyRound size={15} />
              </button>
            )}
          </div>
        )}

        {/* Navigation (the only part that scrolls) */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:#2563EB_transparent]">
          {NAV_GROUPS.map((group: NavItem[], gi: number) => (
            <div key={gi}>
              {gi > 0 && <div className="my-2 h-px bg-[#2563EB]/50" />}
              <ul className="list-none m-0 p-0 flex flex-col gap-1">
                {group.map(({ label, href, icon: Icon }: NavItem) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium no-underline transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]
                          ${active
                            ? "bg-[#2563EB] text-white font-bold shadow-sm"
                            : "text-white/80 hover:bg-[#2563EB]/40 hover:text-white"
                          }`}
                      >
                        {active && (
                          <span className="absolute right-0 top-2 bottom-2 w-1 rounded-full bg-[#3B82F6]" />
                        )}
                        <Icon size={17} className={active ? "text-[#3B82F6]" : "text-white/70"} />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout (always pinned at the bottom) */}
        <div className="shrink-0 p-3 border-t border-[#2563EB]/60 bg-[#173B67]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#FEE2E2] hover:bg-[#B91C1C]/20 hover:text-red-300 bg-transparent border-none cursor-pointer transition-colors outline-none"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}