"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFinalPrice, setStep as setJourneyStep } from "../../../lib/state";

export default function CompliancePage() {
  const router = useRouter();
  const [agreedPrice, setAgreedPrice] = useState(2.75);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Sync price from negotiation
  useEffect(() => {
    setAgreedPrice(getFinalPrice());
  }, []);

  // Scan simulation pipeline
  useEffect(() => {
    if (!isScanning) return;
    if (scanStep === 1) {
      const timer = setTimeout(() => setScanStep(2), 800);
      return () => clearTimeout(timer);
    } else if (scanStep === 2) {
      const timer = setTimeout(() => setScanStep(3), 1600);
      return () => clearTimeout(timer);
    } else if (scanStep === 3) {
      const timer = setTimeout(() => setScanStep(4), 2400);
      return () => clearTimeout(timer);
    } else if (scanStep === 4) {
      const timer = setTimeout(() => {
        setJourneyStep("po_sent");
        setIsScanning(false);
        router.push('/purchase-order');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isScanning, scanStep]);

  const handleStartScan = () => {
    setIsScanning(true);
    setScanStep(1);
  };

  // PO Calculations aligned with final price
  const coffeeQuantityKg = 18 * 1000; // 18 MT
  const coffeeTotal = agreedPrice * coffeeQuantityKg;
  const shippingTotal = 2100;
  const grandTotal = coffeeTotal + shippingTotal;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright pb-16 relative">
      {/* Self-contained CSS for Laser Scan Sweep */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes laser-sweep {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .laser-line {
          animation: laser-sweep 2s infinite linear;
        }
      `}} />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header & Stepper */}
        <div className="flex flex-col gap-4 border-b border-outline-variant pb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Deal Readiness & Compliance Checker</h2>
            <p className="text-sm text-on-surface-variant mt-1 font-medium">Reviewing Export Transaction: <span className="font-bold text-primary">#TRX-892-IDN</span></p>
          </div>
          
          {/* Wizard Progress Stepper */}
          <div className="flex items-center justify-between w-full max-w-3xl mt-4 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-primary z-0"></div>
            
            {/* Step 1: Done */}
            <div className="relative z-10 flex flex-col items-center gap-2 bg-surface-bright px-4">
              <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container border border-secondary flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-on-surface tracking-wider">Documents</span>
            </div>
            
            {/* Step 2: Active */}
            <div className="relative z-10 flex flex-col items-center gap-2 bg-surface-bright px-4">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md border-4 border-surface-bright">
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-primary tracking-wider">Pricing</span>
            </div>
            
            {/* Step 3: Pending */}
            <div className="relative z-10 flex flex-col items-center gap-2 bg-surface-bright px-4">
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant text-on-surface-variant flex items-center justify-center">
                <span className="text-sm font-bold">3</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider">Red Flags</span>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column (Span 4): Step 1 Summary */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Document Checklist Widget */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-outline-variant/50 pb-3">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">folder_managed</span>
                  Step 1: Core Docs
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant shadow-sm">
                  <span className="text-sm font-semibold text-on-surface">NIB (Business License)</span>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 border border-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Valid
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant shadow-sm">
                  <span className="text-sm font-semibold text-on-surface">HS Code Validation</span>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 border border-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[14px]">verified</span> 0901.11
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant shadow-sm">
                  <span className="text-sm font-semibold text-on-surface">BPOM / Halal Cert</span>
                  <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 border border-secondary-fixed-dim">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Cleared
                  </span>
                </div>
              </div>
            </section>
            
            {/* Preview of Step 3 */}
            <section className="bg-surface-container-low border border-outline-variant border-dashed rounded-xl p-5 opacity-80">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">policy</span>
                <span className="text-base font-bold">Next: Scanner</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed font-medium">Awaiting price finalization to run comprehensive OFAC & Route risk analysis.</p>
            </section>
            
          </div>
          
          {/* Right Column (Span 8): Step 2 Active Area */}
          <div className="md:col-span-8">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              
              {/* Header */}
              <div className="bg-surface p-5 border-b border-outline-variant flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">calculate</span>
                    Export Price Calculator
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium">Convert Ex-Works base cost to standard international incoterms (FOB/CIF).</p>
                </div>
                <div className="bg-primary-container/10 text-primary px-3 py-1 rounded text-[10px] font-bold uppercase border border-primary/20 tracking-wider">
                  Currency: USD
                </div>
              </div>
              
              {/* Main Calculator Body */}
              <div className="p-6 flex-1 flex flex-col gap-6">
                
                {/* Input Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {/* Group 1: Base Costs */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Base Product Cost (Ex-Works)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
                        <input className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded-md bg-surface-container-low text-on-surface-variant text-sm font-bold outline-none shadow-inner" type="text" readOnly value={formatCurrency(coffeeTotal * 0.77).replace('$', '')}/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Target Margin (%)</label>
                      <div className="relative">
                        <input className="w-full pl-3 pr-8 py-2 border border-outline-variant rounded-md bg-surface-container-low text-on-surface-variant text-sm font-bold outline-none shadow-inner" type="text" readOnly value="23.00"/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Group 2: Logistics */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Local Handling & Transport (to Port)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
                        <input className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded-md bg-surface-container-low text-on-surface-variant text-sm font-bold outline-none shadow-inner" type="text" readOnly value="0.00 (Incl. in FOB)"/>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ocean Freight & Insurance (Est)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">$</span>
                        <input className="w-full pl-7 pr-3 py-2 border border-outline-variant rounded-md bg-surface text-sm font-bold text-on-surface outline-none shadow-inner" type="text" readOnly value={formatCurrency(shippingTotal).replace('$', '')}/>
                      </div>
                    </div>
                  </div>
                </div>
                
                <hr className="border-outline-variant border-t my-2"/>
                
                {/* Results Board */}
                <div className="bg-surface p-5 rounded-xl border border-outline-variant grid grid-cols-2 gap-4 relative overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-low opacity-50 pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">FOB Value (Free On Board)</span>
                    <span className="text-3xl font-black text-on-surface tracking-tight">{formatCurrency(coffeeTotal)}</span>
                  </div>
                  <div className="relative z-10 flex flex-col border-l border-outline-variant pl-5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">CIF Value (Cost, Insurance, Freight)</span>
                    <span className="text-3xl font-black text-primary tracking-tight">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
                
                {/* Mentor Callout Component */}
                <div className="bg-primary-container/5 border-l-[4px] border-primary rounded-r-xl p-4 flex gap-3 mt-auto shadow-sm">
                  <div className="text-primary mt-0.5">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-1">AI Mentor: Price Compliance</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                      Your finalized price of <strong>{formatCurrency(agreedPrice)}/kg</strong> is securely within your parameters. This maintains a healthy 15%+ profit margin. Compliance and shipping routes are ready to be scanned!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="bg-surface-container-low p-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
                <button className="px-5 py-2 rounded-md border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface transition-colors shadow-sm bg-surface-container-lowest">Recalculate</button>
                <button onClick={handleStartScan} className="px-5 py-2 rounded-md bg-primary text-on-primary text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm">
                  Run AI Compliance & Generate PO
                  <span className="material-symbols-outlined text-[18px]">request_quote</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* AI LASER SCANNING OVERLAY MODAL */}
      {isScanning && (
        <div className="fixed inset-0 bg-[#070235]/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          
          {/* Laser Scanning Line Bar */}
          <div className="laser-line absolute left-0 w-full h-[6px] bg-emerald-400 shadow-[0_0_15px_#10b981,0_0_30px_#10b981] z-20 pointer-events-none"></div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col items-center relative overflow-hidden z-10 animate-in zoom-in-95 duration-300">
            
            {/* Spinning Radar Icon */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              <span className="material-symbols-outlined text-emerald-500 text-4xl animate-pulse">security</span>
            </div>

            <h3 className="text-xl font-bold text-[#070235] mb-1">AI Deal Compliance Scanner</h3>
            <p className="text-xs text-on-surface-variant mb-6 uppercase tracking-wider font-bold">Fase 6: Deal Readiness & Red Flag Checker</p>

            {/* Scanning Checks */}
            <div className="w-full space-y-4 mb-6">
              {/* Check 1 */}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${scanStep >= 2 ? 'bg-emerald-500 text-slate-950 border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                  {scanStep >= 2 ? '✓' : '1'}
                </div>
                <span className={`text-xs font-semibold ${scanStep >= 1 ? 'text-[#070235]' : 'text-on-surface-variant'}`}>Scanning legal credentials against OSS & INATRADE</span>
              </div>

              {/* Check 2 */}
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${scanStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${scanStep >= 3 ? 'bg-emerald-500 text-slate-950 border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                  {scanStep >= 3 ? '✓' : '2'}
                </div>
                <span className={`text-xs font-semibold ${scanStep >= 2 ? 'text-[#070235]' : 'text-on-surface-variant'}`}>Analyzing GlobalTech regional shipping & default history</span>
              </div>

              {/* Check 3 */}
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${scanStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${scanStep >= 4 ? 'bg-emerald-500 text-slate-950 border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                  {scanStep >= 4 ? '✓' : '3'}
                </div>
                <span className={`text-xs font-semibold ${scanStep >= 3 ? 'text-[#070235]' : 'text-on-surface-variant'}`}>Checking Incoterms, HPP conversions & under-pricing</span>
              </div>

              {/* Check 4 */}
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${scanStep >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${scanStep >= 5 ? 'bg-emerald-500 text-slate-950 border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                  {scanStep >= 5 ? '✓' : '4'}
                </div>
                <span className={`text-xs font-semibold ${scanStep >= 4 ? 'text-[#070235]' : 'text-on-surface-variant'}`}>Running NLP red flags scan on payment contracts</span>
              </div>
            </div>

            <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out animate-pulse" 
                style={{ width: `${(scanStep / 4) * 100}%` }}
              ></div>
            </div>

            {scanStep === 4 && (
              <div className="mt-4 text-emerald-600 text-xs font-bold flex items-center gap-1 animate-bounce">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                100% Cleared! Generating Secure Purchase Order...
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
