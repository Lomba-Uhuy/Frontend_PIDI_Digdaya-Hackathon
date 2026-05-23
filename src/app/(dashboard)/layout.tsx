"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStep, TradeConnectStep } from "../../lib/state";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<TradeConnectStep>("onboarding");
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Intelijen Pasar", path: "/market-intelligence", icon: "bar_chart" },
    { name: "Pencarian Pembeli", path: "/buyer-discovery", icon: "person_search" },
    { name: "Pusat Negosiasi", path: "/negotiation", icon: "forum" },
    { name: "Kepatuhan Hukum", path: "/compliance", icon: "fact_check" },
    { name: "Purchase Order (PO)", path: "/purchase-order", icon: "request_quote" },
  ];

  useEffect(() => {
    setCurrentStep(getStep());
    const handleStateChange = () => {
      setCurrentStep(getStep());
      setHasNewNotifications(true);
    };
    window.addEventListener("tradeconnect_state_change", handleStateChange);
    return () => {
      window.removeEventListener("tradeconnect_state_change", handleStateChange);
    };
  }, []);

  const getNotifications = () => {
    const list = [];
    
    // Always include a general notification
    list.push({
      id: "welcome",
      title: "Selamat Datang di TradeConnect",
      description: "Platform Anda siap untuk mencocokkan produk dengan pembeli global.",
      type: "info",
      time: "Baru saja",
    });

    if (currentStep === "onboarding" || currentStep === "verified") {
      list.unshift({
        id: "credential-verify",
        title: "Pemeriksaan Kredensial Berhasil",
        description: "NIB & dokumen utama perusahaan Anda telah tervalidasi 100% (OSS & INATRADE).",
        type: "success",
        time: "5 menit yang lalu",
      });
      list.unshift({
        id: "match-found",
        title: "Rekomendasi Pembeli Baru",
        description: "Klaus Weber (Hamburg, Jerman) sangat cocok dengan profil Kopi Arabika Anda.",
        type: "match",
        time: "2 menit yang lalu",
      });
    }

    if (currentStep === "contacted_klaus" || currentStep === "negotiating") {
      list.unshift({
        id: "credential-verify",
        title: "Pemeriksaan Kredensial Berhasil",
        description: "NIB & dokumen utama perusahaan Anda telah tervalidasi 100% (OSS & INATRADE).",
        type: "success",
        time: "15 menit yang lalu",
      });
      list.unshift({
        id: "klaus-reply",
        title: "Pesan Masuk: Klaus Weber",
        description: "Klaus Weber membalas tawaran Anda di Pusat Negosiasi: 'Halo! Kami berminat...'",
        type: "message",
        time: "Baru saja",
      });
    }

    if (currentStep === "compliance" || currentStep === "po_sent") {
      list.unshift({
        id: "klaus-ready",
        title: "Pesan Masuk: Klaus Weber",
        description: "Klaus Weber setuju dengan finalisasi harga dan menunggu tanda tangan PO.",
        type: "message",
        time: "10 menit yang lalu",
      });
      list.unshift({
        id: "compliance-clear",
        title: "Analisis Kepatuhan Selesai",
        description: "Transaksi #TRX-892-IDN dinyatakan 100% Bersih & Aman oleh Pemindai Risiko.",
        type: "success",
        time: "5 menit yang lalu",
      });
      list.unshift({
        id: "po-sent-notif",
        title: "Purchase Order Terkirim",
        description: "Dokumen PO berhasil dibuat dan dikirim ke Klaus Weber untuk ditandatangani.",
        type: "success",
        time: "Baru saja",
      });
    }

    if (currentStep === "po_signed") {
      list.unshift({
        id: "po-signed-notif",
        title: "Tanda Tangan Digital Berhasil",
        description: "Klaus Weber telah resmi menandatangani dokumen Purchase Order secara digital!",
        type: "celebrate",
        time: "Baru saja",
      });
      list.unshift({
        id: "po-ready",
        title: "Dokumen Siap Ekspor",
        description: "Purchase Order final dan dokumen komersial siap diunduh di menu PO.",
        type: "info",
        time: "2 menit yang lalu",
      });
      list.unshift({
        id: "klaus-celebrate",
        title: "Pesan Masuk: Klaus Weber",
        description: "Exciting partnership ahead! We have signed the PO.",
        type: "message",
        time: "3 menit yang lalu",
      });
    }

    return list;
  };

  return (
    <div className="bg-surface text-on-surface flex h-screen overflow-hidden">
      {/* SideNavBar */}
      <nav className="left-0 h-screen w-64 border-r border-outline-variant bg-surface-container-low flex-col py-6 overflow-y-auto hidden md:flex flex-shrink-0 z-50">
        <div className="px-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined font-bold text-2xl">anchor</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-primary">TradeConnect</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Siap Ekspor</p>
          </div>
        </div>

        <div className="px-4 mb-6">
          <button className="w-full bg-primary text-on-primary font-semibold text-sm py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            Konsultasi Mentor AI
          </button>
        </div>

        <div className="flex-1 px-2 flex flex-col gap-0.5">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path;
            // Insert a visual separator before Purchase Order
            const showDivider = item.path === "/purchase-order";
            return (
              <React.Fragment key={item.path}>
                {showDivider && (
                  <div className="my-2 px-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-outline-variant"></div>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Transaksi Selesai</span>
                    <div className="flex-1 h-px bg-outline-variant"></div>
                  </div>
                )}
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container font-semibold translate-x-1 duration-200"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.name}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-auto px-2 flex flex-col gap-1 pt-4 border-t border-outline-variant">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">Pengaturan</span>
          </Link>
          <Link href="/support" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm">Bantuan</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopAppBar */}
        <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Left side is left clean and elegant */}
            <span className="text-sm font-semibold text-on-surface-variant hidden md:inline-block">
              Selamat Datang Kembali, UMKM Ekspor Indonesia
            </span>
          </div>
          <div className="flex items-center gap-4 md:gap-6 relative">
            <div className="flex items-center gap-1 md:gap-2 text-primary">
              {/* Bell Notification Button */}
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (hasNewNotifications) {
                    setHasNewNotifications(false);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors duration-150 relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {hasNewNotifications && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface animate-pulse"></span>
                )}
              </button>
            </div>

            {/* Popover Dropdown Notifikasi */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 md:w-96 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-outline-variant bg-surface flex justify-between items-center">
                  <span className="font-bold text-on-surface text-sm">Notifikasi Transaksi</span>
                  <button 
                    onClick={() => {
                      setHasNewNotifications(false);
                      setShowNotifications(false);
                    }} 
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Tandai dibaca
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant">
                  {getNotifications().map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-surface-container-low transition-colors flex gap-3">
                      <div className="shrink-0 mt-0.5">
                        {notif.type === "success" && (
                          <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                        {notif.type === "celebrate" && (
                          <span className="material-symbols-outlined text-emerald-500 animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        )}
                        {notif.type === "match" && (
                          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
                        )}
                        {notif.type === "message" && (
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        )}
                        {notif.type === "info" && (
                          <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-on-surface truncate">{notif.title}</h4>
                          <span className="text-[9px] text-on-surface-variant shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed font-medium">{notif.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Avatar & Indonesian Company Label */}
            <div className="flex items-center gap-3 border-l border-outline-variant pl-4 md:pl-6">
              <div className="text-right hidden md:block">
                <div className="text-xs font-black text-on-surface">CV Kopi Mandiri</div>
                <div className="text-[9px] font-bold text-secondary uppercase tracking-wider">Eksportir Pemula</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden flex-shrink-0">
                <img 
                  alt="Profil pengguna" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQpVJa8hieXzEItkyrzcOJjNGqQnUWgdvzRXjbALoURQ3UQZXDq2ecw3dgfu7DBAGJB2l_AJYyVdfeqhr2Rl--dT0FPs6DZJ8sOyOcQQjyuOoNPm7RqKgPbXBMc4-a3esYOA6tkx284IAaqU1zYfpUZwKOqXUehhOyOTPCu6p0eaW6JL9ufyc4g94hOOLc1MuuffzSUuzgWYZhh12Pigcxh5XcSr7km52-TL6yYUKKNYg4WOHMFgn-1Xqysb00cnUBP0geQjheNA"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
