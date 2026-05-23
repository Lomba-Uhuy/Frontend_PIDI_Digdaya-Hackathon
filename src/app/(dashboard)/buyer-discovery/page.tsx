"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setStep as setJourneyStep } from "../../../lib/state";

interface BuyerDetails {
  established: string;
  importRecords: string;
  preferredPorts: string;
  certifications: string;
  complianceHistory: string;
  contactPerson: string;
  financialScore: string;
}

interface Buyer {
  id: string;
  name: string;
  logo: string;
  location: string;
  category: string;
  score: number;
  lastShipment: string;
  origin: string;
  avgVolume: string;
  hsCodes: string;
  confidence: string;
  rationale: string;
  details: BuyerDetails;
}

export default function BuyerDiscoveryPage() {
  const router = useRouter();
  const [isPitching, setIsPitching] = useState(false);
  const [pitchStep, setPitchStep] = useState(0);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  // Pitching process simulation effect
  useEffect(() => {
    if (!isPitching) return;
    if (pitchStep === 1) {
      const timer = setTimeout(() => setPitchStep(2), 1200);
      return () => clearTimeout(timer);
    } else if (pitchStep === 2) {
      const timer = setTimeout(() => setPitchStep(3), 2000);
      return () => clearTimeout(timer);
    } else if (pitchStep === 3) {
      const timer = setTimeout(() => setPitchStep(4), 2800);
      return () => clearTimeout(timer);
    } else if (pitchStep === 4) {
      const timer = setTimeout(() => {
        setJourneyStep("contacted_klaus");
        setIsPitching(false);
        router.push('/negotiation');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isPitching, pitchStep]);

  const buyers: Buyer[] = [
    {
      id: "globaltech",
      name: "GlobalTech Imports GmbH",
      logo: "G",
      location: "Frankfurt, Germany",
      category: "Global Commodities & Foodstuffs",
      score: 94,
      lastShipment: "4 Days Ago",
      origin: "Indonesia",
      avgVolume: "18.0 TEU / mo",
      hsCodes: "0901.11, 0901.21",
      confidence: "98% Confidence",
      rationale: "This German B2B importer is actively searching for robusta coffee bean suppliers to Q3 Hamburg port. They have stable container shipment demands (avg 18 TEUs monthly) and match PT Nusantara's capacity perfectly.",
      details: {
        established: "2008",
        importRecords: "1,240 successful shipments",
        preferredPorts: "Port of Hamburg (DEHAM), Port of Bremen (DEBRE)",
        certifications: "ISO 9001, Fairtrade Imp., Rainforest Alliance",
        complianceHistory: "100% Clean Manifest Records (No Customs Holds)",
        contactPerson: "Klaus Weber (Director of Global Sourcing)",
        financialScore: "A+ (Dun & Bradstreet Rated)",
      }
    },
    {
      id: "eurocafe",
      name: "EuroCafé Logistics Group",
      logo: "E",
      location: "Hamburg, Germany",
      category: "Wholesale Distribution",
      score: 82,
      lastShipment: "45 Days Ago",
      origin: "Brazil / Vietnam",
      avgVolume: "12 TEU / mo",
      hsCodes: "0901.21, 1801.00",
      confidence: "85% Confidence",
      rationale: "Strong volume match for your capacity. However, bill of lading history shows they primarily source bulk unroasted beans (HS 0901.11) rather than your roasted specification. Proceed with a tailored pitch highlighting your roasting quality.",
      details: {
        established: "2012",
        importRecords: "850 successful shipments",
        preferredPorts: "Port of Hamburg (DEHAM), Port of Rotterdam (NLROT)",
        certifications: "IFS Broker Certificate, Organic EU Importer",
        complianceHistory: "Excellent (Minor delays cleared in 2024)",
        contactPerson: "Dr. Elena Brandt (Head of Supply Chain)",
        financialScore: "A- Rated",
      }
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header & Context */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[20px] text-surface-tint">auto_awesome</span>
              <span className="text-xs font-bold text-surface-tint tracking-widest uppercase">AI Semantic Match Engine</span>
            </div>
            <h2 className="text-3xl font-bold text-primary mb-2">Global Buyer Discovery</h2>
            <p className="text-base text-on-surface-variant max-w-2xl">Analyzing billions of global Bill of Lading records and public manifests to find high-probability importers for your specific MSME catalog.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-outline-variant rounded-md bg-surface-container-lowest text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-semibold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add_alert</span>
              Create Alert
            </button>
          </div>
        </div>

        {/* Terminal Filter Bar - 5 Columns featuring Sort */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Target HS Code</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">inventory_2</span>
                <input className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" type="text" defaultValue="0901.21 (Roasted Coffee)"/>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Destination Market</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">public</span>
                <select className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option>European Union (EU27)</option>
                  <option>North America</option>
                  <option>East Asia</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Min. Monthly Volume</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">equalizer</span>
                <select className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option>1 TEU / Month</option>
                  <option>5+ TEU / Month</option>
                  <option>LCL Freight Only</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            {/* NEW: Sort dropdown (relevance, score, terbaru) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sort By</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">sort</span>
                <select className="w-full pl-9 pr-8 py-2 bg-surface border border-outline-variant rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                  <option>Relevance</option>
                  <option>Match Score</option>
                  <option>Terbaru (Latest)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">arrow_drop_down</span>
              </div>
            </div>
            <div className="flex items-end">
              <button className="w-full h-[38px] bg-primary text-white rounded-md border border-transparent hover:bg-surface-tint transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Apply Filters
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-surface-container rounded-full text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/50">
              Semantic Match &gt; 80% <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">close</span>
            </span>
            <span className="px-3 py-1 bg-surface-container rounded-full text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 border border-outline-variant/50">
              Credibility &gt; 70 <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error">close</span>
            </span>
            <button className="text-primary text-xs font-bold hover:underline ml-2">Clear All</button>
          </div>
        </div>

        {/* Bento/Grid Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main List (Left) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Buyer Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg border border-outline-variant bg-surface flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-2xl font-black text-primary">G</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-primary">GlobalTech Imports GmbH</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#85f8c4]/30 text-emerald-800 flex items-center gap-1 border border-[#85f8c4]">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> Verified
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> Frankfurt, Germany
                      <span className="text-outline-variant">•</span>
                      Global Commodities & Foodstuffs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">Credibility Score</div>
                  <div className="text-3xl font-black text-secondary flex items-baseline justify-end gap-0.5 leading-none tracking-tight">
                    94<span className="text-sm text-on-surface-variant font-medium">/100</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface">
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span> Last Shipment
                  </div>
                  <div className="text-sm font-bold text-on-surface">4 Days Ago</div>
                  <div className="text-xs text-on-surface-variant mt-1 font-semibold text-secondary">Origin: Indonesia</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">local_shipping</span> Avg. Volume
                  </div>
                  <div className="text-sm font-bold text-on-surface">18.0 TEU / mo</div>
                  <div className="text-xs text-on-surface-variant mt-1">High demand</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">category</span> Top HS Codes
                  </div>
                  <div className="text-sm font-bold text-on-surface">0901.11, 0901.21</div>
                  <div className="text-xs text-on-surface-variant mt-1">Direct Match</div>
                </div>
              </div>
              
              <div className="p-4 bg-surface-container-lowest">
                <div className="bg-surface-container-low border-l-4 border-surface-tint p-4 rounded-r-lg flex gap-3 shadow-inner">
                  <span className="material-symbols-outlined text-surface-tint mt-0.5 text-[20px]">auto_awesome</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">AI Match Rationale: 98% Confidence</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      This German B2B importer is actively searching for robusta coffee bean suppliers to Q3 Hamburg port. They have stable container shipment demands (avg 18 TEUs monthly) and match PT Nusantara's capacity perfectly.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedBuyer(buyers[0])}
                  className="px-4 py-2 border border-outline-variant rounded-md text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  View Full Profile
                </button>
                <button onClick={() => { setIsPitching(true); setPitchStep(1); }} className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Generate Intro Pitch
                </button>
              </div>
            </div>
            
            {/* Buyer Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg border border-outline-variant bg-surface flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-2xl text-primary font-black">E</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-primary">EuroCafé Logistics Group</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> Hamburg, Germany
                      <span className="text-outline-variant">•</span>
                      Wholesale Distribution
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 tracking-wider">Credibility Score</div>
                  <div className="text-3xl font-black text-on-surface flex items-baseline justify-end gap-0.5 leading-none tracking-tight">
                    82<span className="text-sm text-on-surface-variant font-medium">/100</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface">
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span> Last Shipment
                  </div>
                  <div className="text-sm font-bold text-on-surface">45 Days Ago</div>
                  <div className="text-xs text-error flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">warning</span> Irregular
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">local_shipping</span> Avg. Volume
                  </div>
                  <div className="text-sm font-bold text-on-surface">12 TEU / mo</div>
                  <div className="text-xs text-on-surface-variant mt-1">High capacity</div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 flex items-center gap-1.5 tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">category</span> Top HS Codes
                  </div>
                  <div className="text-sm font-bold text-on-surface">0901.21, 1801.00</div>
                  <div className="text-xs text-on-surface-variant mt-1">Mixed commodities</div>
                </div>
              </div>
              
              <div className="p-4 bg-surface-container-lowest">
                <div className="bg-surface-container-low border-l-4 border-surface-tint p-4 rounded-r-lg flex gap-3 shadow-inner">
                  <span className="material-symbols-outlined text-surface-tint mt-0.5 text-[20px]">auto_awesome</span>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface mb-1">AI Match Rationale: 85% Confidence</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Strong volume match for your capacity. However, bill of lading history shows they primarily source bulk unroasted beans (HS 0901.11) rather than your roasted specification. Proceed with a tailored pitch highlighting your roasting quality.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedBuyer(buyers[1])}
                  className="px-4 py-2 border border-outline-variant rounded-md text-on-surface text-sm font-bold hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  View Full Profile
                </button>
                <button onClick={() => { setIsPitching(true); setPitchStep(1); }} className="px-4 py-2 bg-primary text-on-primary rounded-md text-sm font-bold hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Generate Intro Pitch
                </button>
              </div>
            </div>
          </div>

          {/* Contextual Sidebar (Right) */}
          <div className="xl:col-span-4 space-y-6">
            {/* Context Widget 1: Map/Heatmap */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">travel_explore</span>
                <h3 className="text-base font-bold text-on-surface">Demand Heatmap</h3>
              </div>
              <div className="h-48 relative group flex items-center justify-center bg-[#dff3f0]">
                 <div className="absolute inset-0 opacity-80" style={{
                    backgroundImage: 'radial-gradient(circle at center, #68dba9 0%, transparent 70%)',
                    backgroundSize: '100% 100%'
                  }}></div>
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full shadow-[0_0_0_4px_rgba(7,2,53,0.2)] animate-pulse"></div>
              </div>
              <div className="p-4 bg-surface-container-lowest">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-on-surface-variant font-medium">Top Region (HS 0901.21)</span>
                  <span className="text-sm text-primary font-bold">EU27</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5 mb-3">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: "65%" }}></div>
                </div>
                <p className="text-xs text-on-surface-variant">EU import volume up 4.2% YoY based on Q3 manifest data.</p>
              </div>
            </div>

            {/* Context Widget 2: Terminal Stats */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">troubleshoot</span>
                <h3 className="text-base font-bold text-on-surface">Search Diagnostics</h3>
              </div>
              <div className="p-0 divide-y divide-outline-variant">
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">Total Records Scanned</span>
                  <span className="text-sm text-on-surface font-bold">1.2M+</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">Active Buyers (30d)</span>
                  <span className="text-sm text-on-surface font-bold">342</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-surface-container-lowest">
                  <span className="text-sm text-on-surface-variant font-medium">High-Probability Matches</span>
                  <span className="text-sm text-secondary font-black">14</span>
                </div>
              </div>
            </div>

            {/* Context Widget 3: Compliance Alert */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 border-l-[4px] border-l-error shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px]">gavel</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface mb-1">EU Deforestation Reg (EUDR)</h4>
                  <p className="text-xs text-on-surface-variant mb-2 leading-relaxed">Ensure your geolocation coordinates for coffee plots are updated before pitching to EU buyers. Strict compliance required.</p>
                  <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider">
                    Update Coordinates <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 pt-4 border-t border-outline-variant flex justify-between items-center text-on-surface-variant">
          <span className="text-xs font-semibold tracking-wide">Showing 1-2 of 14 matches</span>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
            <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary text-on-primary rounded text-xs font-bold shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors text-xs font-bold shadow-sm">3</button>
            <span className="w-8 h-8 flex items-center justify-center text-xs font-bold">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-container-low transition-colors shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
          </div>
        </div>

        {/* INTERACTIVE BUYER PROFILE MODAL */}
        {selectedBuyer && (
          <div className="fixed inset-0 bg-[#070235]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-outline-variant text-[#070235] rounded-xl flex items-center justify-center font-black text-xl">
                    {selectedBuyer.logo}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary leading-tight">{selectedBuyer.name}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">{selectedBuyer.location} • {selectedBuyer.category}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-on-surface-variant">
                {/* Score Widget */}
                <div className="grid grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-outline-variant shadow-sm shrink-0">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Verified Credibility Score</span>
                    <span className="text-3xl font-black text-secondary">{selectedBuyer.score}<span className="text-sm font-medium text-on-surface-variant">/100</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Financial Rating</span>
                    <span className="text-3xl font-black text-primary">{selectedBuyer.details.financialScore}</span>
                  </div>
                </div>

                {/* Import History */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">history</span> Import History & Manifest Records
                  </h4>
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-lg p-4 space-y-2 text-xs font-medium">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Company Established</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.established}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Total Shipments Recorded</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.importRecords}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Average Monthly Volume</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.avgVolume}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Destination Ports</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.preferredPorts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top Target Commodities</span>
                      <span className="font-mono text-primary font-bold">{selectedBuyer.hsCodes}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance & Standards */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">workspace_premium</span> Global Compliance & Certifications
                  </h4>
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-lg p-4 space-y-2 text-xs font-medium">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
                      <span>Active Certifications</span>
                      <span className="text-on-surface font-bold">{selectedBuyer.details.certifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customs & Compliance Track</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {selectedBuyer.details.complianceHistory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Context */}
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span> TradeConnect Match Analysis
                  </h4>
                  <div className="bg-[#85f8c4]/10 border-l-4 border-secondary p-4 rounded-r-xl">
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
                      "{selectedBuyer.rationale}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant pt-4 mt-6 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="px-5 py-2 border border-outline-variant hover:bg-surface rounded-lg text-xs font-bold text-on-surface transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    setSelectedBuyer(null);
                    setIsPitching(true);
                    setPitchStep(1);
                  }}
                  className="px-6 py-2 bg-primary text-on-primary hover:bg-surface-tint rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Mulai Komunikasi (Outbound)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pitching Simulation Modal */}
        {isPitching && (
          <div className="fixed inset-0 bg-[#070235]/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col items-center animate-in zoom-in-95 duration-300">
              
              {/* Spinner & AI Icon */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 border-4 border-outline-variant rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse">auto_awesome</span>
              </div>

              <h3 className="text-xl font-bold text-primary mb-1">TradeConnect AI Outbound Pipeline</h3>
              <p className="text-xs text-on-surface-variant mb-6 uppercase tracking-wider font-bold">Fase 2: Pengiriman Email Penawaran Resmi</p>

              {/* Progress Steps */}
              <div className="w-full space-y-4 mb-6">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 2 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 2 ? '✓' : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 1 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Analyzing catalog and legal compliance score</span>
                </div>

                {/* Step 2 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 3 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 3 ? '✓' : '2'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 2 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Semantic matching with GlobalTech import manifests</span>
                </div>

                {/* Step 3 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 4 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 4 ? '✓' : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 3 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Drafting professional B2B intro pitch in English</span>
                </div>

                {/* Step 3.5: Preview of the drafted email */}
                {pitchStep === 3 && (
                  <div className="bg-surface border border-outline-variant p-3.5 rounded-lg text-[10px] font-mono text-on-surface-variant shadow-inner max-h-24 overflow-y-auto animate-in slide-in-from-top-2 duration-300 w-full text-left">
                    <span className="text-primary font-bold">Subject:</span> B2B Introduction: Premium Robusta Coffee Beans Grade 1<br/>
                    <span className="text-primary font-bold">To:</span> klaus.weber@globaltech.de<br/>
                    <span className="text-slate-400">---</span><br/>
                    Dear Mr. Weber,<br/>
                    PT Nusantara Coffee offers Premium Grade 1 Robusta Coffee Beans (HS 0901.11) with moisture content below 12.5%. Our monthly production capacity is 50,000 Units and NIB is fully verified...
                  </div>
                )}

                {/* Step 4 */}
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${pitchStep >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${pitchStep >= 5 ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-variant animate-pulse text-on-surface-variant'}`}>
                    {pitchStep >= 5 ? '✓' : '4'}
                  </div>
                  <span className={`text-xs font-semibold ${pitchStep >= 4 ? 'text-on-surface' : 'text-on-surface-variant'}`}>Sending secure outbound email to Klaus Weber</span>
                </div>
              </div>

              <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${(pitchStep / 4) * 100}%` }}
                ></div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
