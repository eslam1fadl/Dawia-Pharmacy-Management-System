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
    <div className="min-h-screen flex bg-[#F5F8F7]">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpenPasswordModal={() => {
          setForcePasswordChange(false);
          setShowPasswordModal(true);
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top header */}
        <header className="lg:hidden h-14 px-4 flex items-center justify-between bg-white border-b border-[#DCE6E1] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="فتح القائمة"
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg text-[#064E49] bg-transparent border-none cursor-pointer hover:bg-[#F5F8F7]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#087F68] flex items-center justify-center">
                <HeartPulse size={16} className="text-[#20C997]" />
              </div>
              <span className="text-[#064E49] font-bold text-lg">دوائي</span>
            </div>
          </div>
          {user && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#E6F4F1] text-[#087F68] font-medium">
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
          // Refresh user data
          getCurrentUser().then((u) => u && setUser(u));
        }}
      />
    </div>
  );
}
