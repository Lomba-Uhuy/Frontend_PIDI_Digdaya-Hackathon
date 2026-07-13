"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Bell,
  BadgeCheck,
  Building2,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  MessageCircle,
  Radar,
  Rocket,
  Settings,
  Sparkles,
  Trophy,
  X,
  Info,
  Bot,
} from "lucide-react";
import { getStep, TradeConnectStep } from "../../lib/state";
import { getIcon } from "../../lib/icon-map";
import { getPlan, getPlanInfo, type Plan } from "../../lib/plan";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Intelijen Pasar", path: "/market-intelligence", icon: "bar_chart" },
    { name: "Pencarian Pembeli", path: "/buyer-discovery", icon: "person_search" },
    { name: "Kalkulator Ekspor", path: "/calculator", icon: "calculate" },
    { name: "Pusat Negosiasi", path: "/negotiation", icon: "forum" },
    { name: "Kepatuhan Hukum", path: "/compliance", icon: "fact_check" },
    { name: "Purchase Order (PO)", path: "/purchase-order", icon: "request_quote" },
  ];
  const [currentStep, setCurrentStep] = useState<TradeConnectStep>("onboarding");
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [plan, setPlanState] = useState<Plan>("free");
  const [companyName, setCompanyName] = useState("CV Kopi Mandiri");
  const [productName, setProductName] = useState("Kopi Arabika");

  const menuItemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer";

  // Tour States
  const [tourStep, setTourStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const handleStartTour = () => {
    setTourStep(1);
  };

  const handleNextTourStep = () => {
    if (tourStep < 5) {
      setTourStep(tourStep + 1);
    } else {
      setTourStep(0);
    }
  };

  const handleSkipTour = () => {
    setTourStep(0);
  };

  const getTourHighlightClass = (path: string) => {
    if (tourStep === 2 && path === "/buyer-discovery") return "tour-highlight animate-pulse";
    if (tourStep === 3 && path === "/negotiation") return "tour-highlight animate-pulse";
    if (tourStep === 4 && path === "/compliance") return "tour-highlight animate-pulse";
    if (tourStep === 5 && path === "/purchase-order") return "tour-highlight animate-pulse";
    return "";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tourShown = localStorage.getItem("tradeconnect_tour_shown");
      if (!tourShown) {
        setTourStep(1);
        localStorage.setItem("tradeconnect_tour_shown", "true");
      }
    }
  }, []);

  useEffect(() => {
    if (tourStep === 1) {
      setCoords(null);
    } else {
      const targetId = `tour-step-${tourStep}`;
      const element = document.getElementById(targetId);
      if (element && typeof window !== "undefined" && window.innerWidth >= 768) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.right + 16,
        });
      } else {
        setCoords(null);
      }
    }
  }, [tourStep]);

  useEffect(() => {
    setCurrentStep(getStep());
    setPlanState(getPlan());
    const savedCompany = localStorage.getItem("tradeconnect_company_name");
    if (savedCompany) setCompanyName(savedCompany);
    const savedProduct = localStorage.getItem("tradeconnect_product_name");
    if (savedProduct) setProductName(savedProduct);

    const handleStateChange = () => {
      setCurrentStep(getStep());
      setHasNewNotifications(true);
      const updatedCompany = localStorage.getItem("tradeconnect_company_name");
      if (updatedCompany) setCompanyName(updatedCompany);
      const updatedProduct = localStorage.getItem("tradeconnect_product_name");
      if (updatedProduct) setProductName(updatedProduct);
    };
    const handlePlanChange = () => setPlanState(getPlan());
    window.addEventListener("tradeconnect_state_change", handleStateChange);
    window.addEventListener("tradeconnect_plan_change", handlePlanChange);
    return () => {
      window.removeEventListener("tradeconnect_state_change", handleStateChange);
      window.removeEventListener("tradeconnect_plan_change", handlePlanChange);
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
        description: `Klaus Weber (Hamburg, Jerman) sangat cocok dengan profil ${productName} Anda.`,
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
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Anchor className="size-5" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary font-heading">TradeConnect</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Siap Ekspor</p>
          </div>
        </div>

        <div className="px-4 mb-6">
          <button className="w-full bg-primary text-on-primary font-semibold text-sm py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors cursor-pointer">
            <Bot className="size-4" />
            Konsultasi Mentor AI
          </button>
        </div>

        <div className="flex-1 px-2 flex flex-col gap-0.5">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.path;
            const tourClass = getTourHighlightClass(item.path);
            const isTourHighlighted = tourClass !== "";
            const NavIcon = getIcon(item.icon);
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
                  id={
                    item.path === "/buyer-discovery"
                      ? "tour-step-2"
                      : item.path === "/negotiation"
                      ? "tour-step-3"
                      : item.path === "/compliance"
                      ? "tour-step-4"
                      : item.path === "/purchase-order"
                      ? "tour-step-5"
                      : undefined
                  }
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isTourHighlighted
                      ? tourClass
                      : isActive
                      ? "bg-secondary-container text-on-secondary-container font-semibold translate-x-1 duration-200"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <NavIcon className="size-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-auto px-3 pt-4">
          {plan !== "scale" ? (
            <Link
              href="/settings#tagihan"
              className="block rounded-xl border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-primary" />
                <span className="text-xs font-bold text-primary">Upgrade Paket</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">
                Paket <span className="font-bold text-on-surface">{getPlanInfo(plan).name}</span> — naik kelas untuk
                komisi lebih rendah &amp; pembeli lebih banyak.
              </p>
            </Link>
          ) : (
            <div className="rounded-xl border border-secondary/30 bg-secondary-container/40 p-3">
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-secondary" />
                <span className="text-xs font-bold text-on-secondary-container">Paket Scale Aktif</span>
              </div>
              <p className="mt-1 text-[11px] text-on-surface-variant">Anda menikmati seluruh fitur premium.</p>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopAppBar */}
        <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* MOBILE HAMBURGER BUTTON */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="flex md:hidden items-center justify-center size-11 -ml-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-colors shrink-0 cursor-pointer"
              title="Buka Menu Navigasi"
            >
              <Menu className="size-6" />
            </button>
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
                  setShowProfileMenu(false);
                  if (hasNewNotifications) {
                    setHasNewNotifications(false);
                  }
                }}
                className="flex items-center justify-center size-11 rounded-full hover:bg-surface-container-low transition-colors duration-150 relative cursor-pointer"
              >
                <Bell className="size-5" />
                {hasNewNotifications && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border border-surface animate-pulse"></span>
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
                    className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Tandai dibaca
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant">
                  {getNotifications().map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-surface-container-low transition-colors flex gap-3">
                      <div className="shrink-0 mt-0.5">
                        {notif.type === "success" && (
                          <BadgeCheck className="size-5 text-secondary" />
                        )}
                        {notif.type === "celebrate" && (
                          <Trophy className="size-5 text-secondary animate-bounce" />
                        )}
                        {notif.type === "match" && (
                          <Radar className="size-5 text-secondary" />
                        )}
                        {notif.type === "message" && (
                          <MessageCircle className="size-5 text-primary" />
                        )}
                        {notif.type === "info" && (
                          <Info className="size-5 text-primary-fixed-dim" />
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

            {/* Profile menu (company account) */}
            <div className="relative border-l border-outline-variant pl-4 md:pl-6">
              <button
                onClick={() => {
                  setShowProfileMenu((v) => !v);
                  setShowNotifications(false);
                }}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                className="flex items-center gap-2.5 rounded-lg p-1 pr-1 md:pr-2 transition-colors hover:bg-surface-container-low cursor-pointer"
              >
                <div className="text-right hidden md:block">
                  <div className="text-xs font-black text-on-surface leading-tight">{companyName}</div>
                  <div className="text-[9px] font-bold text-secondary uppercase tracking-wider">Eksportir Pemula</div>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <Building2 className="size-5" strokeWidth={2} />
                </div>
                <ChevronDown
                  className={cn(
                    "hidden md:block size-4 text-on-surface-variant transition-transform",
                    showProfileMenu && "rotate-180"
                  )}
                />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-outline-variant bg-surface p-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                        <Building2 className="size-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-on-surface">{companyName}</p>
                        <span className="mt-0.5 inline-block rounded-full bg-secondary-container px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-secondary-container">
                          Paket {getPlanInfo(plan).name}
                        </span>
                      </div>
                    </div>
                    {/* Items */}
                    <div className="p-1.5">
                      <Link href="/settings#tagihan" onClick={() => setShowProfileMenu(false)} className={menuItemClass}>
                        <Rocket className="size-[18px]" /> Upgrade Paket
                      </Link>
                      <Link href="/settings" onClick={() => setShowProfileMenu(false)} className={menuItemClass}>
                        <Settings className="size-[18px]" /> Pengaturan
                      </Link>
                      <Link href="/settings#bantuan" onClick={() => setShowProfileMenu(false)} className={menuItemClass}>
                        <HelpCircle className="size-[18px]" /> Bantuan
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleStartTour();
                        }}
                        className={menuItemClass}
                      >
                        <Sparkles className="size-[18px]" /> Lihat Tutorial
                      </button>
                    </div>
                    <div className="border-t border-outline-variant p-1.5">
                      <Link
                        href="/"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error-container cursor-pointer"
                      >
                        <LogOut className="size-[18px]" /> Keluar
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>

      {/* MOBILE NAVIGATION SIDEBAR OVERLAY */}
      {isMobileNavOpen && (
        <div className="flex md:hidden fixed inset-0 z-50 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
          />
          {/* Drawer Content */}
          <nav className="absolute left-0 top-0 bottom-0 w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="px-4 mb-8 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                  <Anchor className="size-5" strokeWidth={2.25} />
                </div>
                <div>
                  <h1 className="text-lg font-black text-primary font-heading">TradeConnect</h1>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">Siap Ekspor</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center justify-center size-11 text-on-surface-variant hover:text-error rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-4 mb-6">
              <button className="w-full bg-primary text-on-primary font-semibold text-xs py-2 px-4 rounded-md flex items-center justify-center gap-2 cursor-pointer">
                <Bot className="size-4" />
                Konsultasi AI
              </button>
            </div>

            <div className="flex-1 px-2 flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const showDivider = item.path === "/purchase-order";
                const NavIcon = getIcon(item.icon);
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
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-secondary-container text-on-secondary-container font-semibold"
                          : "text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <NavIcon className="size-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>
          </nav>
        </div>
      )}
      {/* GUIDED ONBOARDING TOUR */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tour-highlight {
          position: relative !important;
          z-index: 9999 !important;
          background-color: var(--color-secondary-container) !important;
          color: var(--color-on-secondary-container) !important;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.65), 0 0 20px rgba(5, 150, 105, 0.5) !important;
          pointer-events: none !important;
          border-radius: 8px !important;
        }
        .tour-card-glow {
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3), 0 8px 10px -6px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.05), 0 0 20px rgba(37, 99, 235, 0.15);
        }
      `}} />

      {tourStep > 0 && (
        <div className="fixed inset-0 z-[10000] overflow-hidden select-none pointer-events-auto">
          {/* Semi-transparent Backdrop for Step 1 or mobile */}
          {(tourStep === 1 || !coords) && (
            <div
              onClick={handleSkipTour}
              className="absolute inset-0 bg-primary/65 backdrop-blur-[2px] transition-all duration-300"
            />
          )}

          {/* Tour Card */}
          <div 
            className="bg-surface-container-lowest text-on-surface border border-outline-variant rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 tour-card-glow animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
            style={
              coords 
                ? {
                    position: "absolute",
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    transform: "translateY(-50%)",
                  }
                : {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            {/* Step Indicator & Header */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Langkah {tourStep} dari 5
              </span>
              <button
                onClick={handleSkipTour}
                className="flex items-center justify-center size-8 text-on-surface-variant hover:text-error rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Lewati Tutorial"
              >
                <X className="size-[18px]" />
              </button>
            </div>

            {/* Tour Content */}
            <div className="space-y-2 select-text font-sans">
              {tourStep === 1 && (
                <>
                  <h3 className="text-lg font-black text-primary font-heading">
                    Selamat datang di TradeConnect!
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Platform ekspor UMKM terintegrasi AI. Kami akan memandu Anda memahami fitur utama dalam 5 langkah mudah untuk memulai ekspor perdana Anda.
                  </p>
                </>
              )}
              {tourStep === 2 && (
                <>
                  <h3 className="text-lg font-black text-primary font-heading">
                    Cari Pembeli Global
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Temukan pembeli global secara instan di sini. AI kami secara cerdas memetakan deskripsi produk Anda untuk mencocokkan profil importir berpotensi tinggi dari sistem bea cukai global.
                  </p>
                </>
              )}
              {tourStep === 3 && (
                <>
                  <h3 className="text-lg font-black text-primary font-heading">
                    Negosiasi dan Risiko
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Masuk ke Pusat Negosiasi untuk berkomunikasi langsung via email terintegrasi. AI kami menyusun draf balasan pintar (RAG) untuk penyesuaian harga dan mendeteksi tanda bahaya kredibilitas pembeli secara otomatis.
                  </p>
                </>
              )}
              {tourStep === 4 && (
                <>
                  <h3 className="text-lg font-black text-primary font-heading">
                    Kepatuhan Hukum
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Analisis regulasi dan kepatuhan hukum untuk transaksi Anda. Gunakan pemindai risiko AI kami untuk memeriksa kesiapan ekspor dan memastikan dokumen transaksi Anda 100% aman dan sah.
                  </p>
                </>
              )}
              {tourStep === 5 && (
                <>
                  <h3 className="text-lg font-black text-primary font-heading">
                    Purchase Order dan Ekspor!
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Di menu ini, buat Purchase Order (PO) resmi secara instan. Kirim ke email pembeli dan pantau tanda tangannya secara real-time. Transaksi selesai tanpa perlu me-refresh halaman!
                  </p>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <button 
                onClick={handleNextTourStep}
                className="w-full bg-primary text-on-primary hover:bg-primary-hover font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all active:translate-y-0.5 cursor-pointer font-sans"
              >
                {tourStep === 5 ? "Mulai Jelajahi" : "Selanjutnya"}
              </button>
              {tourStep < 5 && (
                <button 
                  onClick={handleSkipTour}
                  className="w-full text-on-surface-variant hover:text-primary text-xs font-bold py-1.5 transition-colors uppercase tracking-wider cursor-pointer font-sans"
                >
                  Lewati Tour
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
