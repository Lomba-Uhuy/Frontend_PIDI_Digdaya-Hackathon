"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { name: "Market Intelligence", path: "/market-intelligence", icon: "bar_chart" },
    { name: "Buyer Discovery", path: "/buyer-discovery", icon: "person_search" },
    { name: "Negotiation Hub", path: "/negotiation", icon: "forum" },
    { name: "Compliance", path: "/compliance", icon: "fact_check" },
    { name: "Purchase Order", path: "/purchase-order", icon: "request_quote" },
  ];

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
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Export Ready</p>
          </div>
        </div>

        <div className="px-4 mb-6">
          <button className="w-full bg-primary text-on-primary font-semibold text-sm py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            Consult AI Mentor
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
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Deal Close</span>
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
            <span className="text-sm">Settings</span>
          </Link>
          <Link href="/support" className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm">Support</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopAppBar */}
        <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                placeholder="Search..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/compliance"
              className="bg-primary text-on-primary font-semibold text-xs md:text-sm py-2 px-4 rounded-md hover:bg-surface-tint transition-colors shadow-sm hidden sm:flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">fact_check</span>
              Check Compliance
            </Link>
            <div className="flex items-center gap-1 md:gap-2 text-primary">
              <button className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors duration-150 relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-surface"></span>
              </button>
              <button className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors duration-150">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </button>
              <button className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors duration-150">
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden flex-shrink-0">
              <img 
                alt="User profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQpVJa8hieXzEItkyrzcOJjNGqQnUWgdvzRXjbALoURQ3UQZXDq2ecw3dgfu7DBAGJB2l_AJYyVdfeqhr2Rl--dT0FPs6DZJ8sOyOcQQjyuOoNPm7RqKgPbXBMc4-a3esYOA6tkx284IAaqU1zYfpUZwKOqXUehhOyOTPCu6p0eaW6JL9ufyc4g94hOOLc1MuuffzSUuzgWYZhh12Pigcxh5XcSr7km52-TL6yYUKKNYg4WOHMFgn-1Xqysb00cnUBP0geQjheNA"
              />
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
