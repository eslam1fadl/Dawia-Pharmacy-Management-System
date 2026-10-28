"use client";

import { useEffect, useState } from "react";
import { Menu, HeartPulse } from "lucide-react";
import Sidebar from "./Sidebar";
import PasswordChangeModal from "./PasswordChangeModal";
import { getCurrentUser, type UserProfile } from "@/lib/auth";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        if (u.mustChangePassword) {
          setForcePasswordChange(true);
          setShowPasswordModal(true);
        }
      }
    });
  }, []);

  return (
    <div className="h-screen overflow-hidden flex bg-[#F1F5F9]">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpenPasswordModal={() => {
          setForcePasswordChange(false);
          setShowPasswordModal(true);
        }}
      />

      <div className="flex-1 min-w-0 h-full overflow-y-auto flex flex-col">
        {/* Mobile top header */}
        <header className="lg:hidden h-14 px-4 flex items-center justify-between bg-white border-b border-[#CBD5E1] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="فتح القائمة"
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg text-[#173B67] bg-transparent border-none cursor-pointer hover:bg-[#F1F5F9]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
                <HeartPulse size={16} className="text-[#3B82F6]" />
              </div>
              <span className="text-[#173B67] font-bold text-lg">دوائي</span>
            </div>
          </div>
          {user && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">
              {user.roleLabel || user.username}
            </span>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        forced={forcePasswordChange}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          setForcePasswordChange(false);
          getCurrentUser().then((u) => u && setUser(u));
        }}
      />
    </div>
  );
}