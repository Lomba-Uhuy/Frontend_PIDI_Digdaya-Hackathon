"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const router = useRouter();
  const [loadingStep, setLoadingStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreOffset, setScoreOffset] = useState(352);

  const [companyName, setCompanyName] = useState("PT Nusantara Global Coffee");
  const [productName, setProductName] = useState("Premium Robusta Coffee Beans");
  const [productType, setProductType] = useState("coffee");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompany = localStorage.getItem("tradeconnect_company_name");
      if (savedCompany) setCompanyName(savedCompany);
      const savedProduct = localStorage.getItem("tradeconnect_product_name");
      if (savedProduct) setProductName(savedProduct);
      const savedType = localStorage.getItem("tradeconnect_product_type");
      if (savedType) setProductType(savedType);
    }
  }, []);

  useEffect(() => {
    // Simulate the verification pipeline
    const timer1 = setTimeout(() => setLoadingStep(1), 1500); // Verify NIB
    const timer2 = setTimeout(() => setLoadingStep(2), 3000); // NLP HS Code
    const timer3 = setTimeout(() => setLoadingStep(3), 4500); // Score Calculation
    const timer4 = setTimeout(() => setIsComplete(true), 6000); // Done

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Score ticking and progress circle filling animation when complete
  useEffect(() => {
    if (isComplete) {
      // 1. Animate SVG circle offset
      const strokeTimer = setTimeout(() => setScoreOffset(53), 100);

      // 2. Count up the score number
      let current = 0;
      const target = 85;
      const interval = setInterval(() => {
        current += 1;
        setScore(current);
        if (current >= target) {
          clearInterval(interval);
        }
      }, 12); // ~1 second total count up

      return () => {
        clearTimeout(strokeTimer);
        clearInterval(interval);
      };
    }
  }, [isComplete]);

  if (!isComplete) {
    return (
      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-surface-variant rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              rule
            </span>
          </div>
          
          <h2 className="text-xl font-bold text-primary mb-2">Analyzing Institutional Profile</h2>
          <p className="text-sm text-on-surface-variant mb-8">Please wait while TradeConnect AI verifies your data...</p>

          <div className="w-full flex flex-col gap-4 text-left">
            <div className={`flex items-center gap-4 transition-opacity duration-500 ${loadingStep >= 0 ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${loadingStep >= 1 ? 'bg-secondary text-on-secondary' : 'bg-surface-variant animate-pulse'}`}>
                {loadingStep >= 1 ? <span className="material-symbols-outlined text-[14px]">check</span> : <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>}
              </div>
              <span className="text-sm font-medium text-on-surface">Connecting to OSS RBA (Kementerian Investasi)</span>
            </div>

            <div className={`flex items-center gap-4 transition-opacity duration-500 ${loadingStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${loadingStep >= 2 ? 'bg-secondary text-on-secondary' : 'bg-surface-variant animate-pulse'}`}>
                {loadingStep >= 2 ? <span className="material-symbols-outlined text-[14px]">check</span> : <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>}
              </div>
              <span className="text-sm font-medium text-on-surface">NLP Classification for HS Code Mapping</span>
            </div>

            <div className={`flex items-center gap-4 transition-opacity duration-500 ${loadingStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${loadingStep >= 3 ? 'bg-secondary text-on-secondary' : 'bg-surface-variant animate-pulse'}`}>
                {loadingStep >= 3 ? <span className="material-symbols-outlined text-[14px]">check</span> : <span className="w-2 h-2 bg-on-surface-variant rounded-full"></span>}
              </div>
              <span className="text-sm font-medium text-on-surface">Calculating Verified Profile Score</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Success Header */}
        <div className="bg-primary p-6 md:p-8 text-center text-on-primary flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 shadow-lg z-10 border-4 border-on-primary/20">
            <span className="material-symbols-outlined text-[32px] text-on-secondary">verified</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 z-10">Verification Successful</h1>
          <p className="text-primary-fixed-dim text-sm z-10">Your institutional profile is now active and verified.</p>
        </div>

        {/* Verification Results */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Legal & Product Info */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface p-4 rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">gavel</span>
                <h3 className="text-base font-semibold text-on-surface">OSS RBA Validation</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
                <div className="text-on-surface-variant">Status</div>
                <div className="font-medium text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Active & Valid
                </div>
                
                <div className="text-on-surface-variant">Entity Type</div>
                <div className="font-medium text-on-surface">
                  {companyName.toUpperCase().includes("CV") ? "CV (Persekutuan Komanditer)" : "PT (Perseroan Terbatas)"}
                </div>
                
                <div className="text-on-surface-variant">Risk Level</div>
                <div className="font-medium text-on-surface">Low - Medium Risk</div>
                
                <div className="text-on-surface-variant">KBLI Match</div>
                <div className="font-medium text-on-surface">
                  {productType === "rattan" ? "31001 (Wholesale Furniture & Rattan)" : "46311 (Wholesale Coffee)"}
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                <h3 className="text-base font-semibold text-on-surface">AI HS Code Mapping</h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">NLP model mapped your description "{productName}" to:</p>
              
              <div className="bg-surface-variant p-3 rounded-md border border-outline-variant">
                <div className="text-xl font-mono-data font-bold text-primary tracking-widest mb-1">
                  {productType === "rattan" ? "9401.52" : "0901.11"}
                </div>
                <div className="text-xs font-medium text-on-surface">
                  {productType === "rattan" ? "Seats of rattan (Kursi rotan anyaman)" : "Coffee, not roasted, not decaffeinated"}
                </div>
                <div className="mt-2 pt-2 border-t border-outline-variant flex items-center gap-1 text-[11px] text-secondary font-medium">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  High global demand detected
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Score & Action */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface p-4 rounded-lg border border-outline-variant h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                <h3 className="text-base font-semibold text-on-surface">Verified Profile Score</h3>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-4">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-variant"></circle>
                    {/* Progress Circle (85%) */}
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="352" strokeDashoffset={scoreOffset} className="text-secondary drop-shadow-sm stroke-current transition-all duration-1000 ease-out"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-on-surface">{score}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">out of 100</span>
                  </div>
                </div>

                <p className="text-center text-xs text-on-surface-variant px-2">
                  Excellent! Your score unlocks access to premium global buyers and prioritized AI matchmaking.
                </p>
                
                <div className="w-full mt-4 space-y-2">
                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span>Identity completeness</span>
                    <span className="font-medium text-secondary">100%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-full"></div>
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-on-surface-variant mt-2">
                    <span>Capacity readiness</span>
                    <span className="font-medium text-secondary">80%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[80%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-surface-container-low p-4 md:p-6 border-t border-outline-variant flex justify-end gap-3">
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2.5 text-xs font-medium text-primary hover:bg-surface rounded-md transition-colors"
          >
            Review Data
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 text-xs font-medium bg-primary text-on-primary hover:bg-surface-tint rounded-md transition-colors flex items-center gap-2 shadow-sm"
          >
            Enter Founder Dashboard
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
}
