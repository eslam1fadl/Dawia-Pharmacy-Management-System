import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "Dawaya | دوايا - نظام إدارة الصيدلية",
  description: "Dawaya Pharmacy Management System - إدارة صيدليتك ببساطة: الأدوية والمخزون والمبيعات والموردين والتقارير",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F5F8F7] text-[#172B24]">{children}</body>
    </html>
  );
}