"use client";

export default function MarketIntelligencePage() {
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-surface-bright">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Market Intelligence Explorer</h1>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Live data feed connected to UN Comtrade & BPS
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none border border-outline-variant rounded-md bg-surface-container-lowest flex text-sm overflow-hidden divide-x divide-outline-variant shadow-sm">
              <div className="px-4 py-2 hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">HS CODE / COMMODITY</div>
                <div className="font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">barcode</span> 0901.11 - Coffee, not roasted
                </div>
              </div>
              <div className="px-4 py-2 hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-0.5">TARGET REGION</div>
                <div className="font-semibold text-on-surface flex items-center gap-1">
                  Global Overview <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </div>
              </div>
            </div>
            <button className="h-full px-3 py-2 border border-outline-variant rounded-md bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Map */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">public</span>
                Global Import Volume Heat Map
              </h2>
              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded">VOL: USD</span>
                <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded border border-outline-variant">2023 YTD</span>
              </div>
            </div>
            
            <div className="relative flex-1 bg-[#dff3f0] min-h-[400px] flex items-center justify-center overflow-hidden">
              {/* Map Illustration Placeholder */}
              <div className="absolute inset-0 opacity-80" style={{
                backgroundImage: 'radial-gradient(circle at center, #68dba9 0%, transparent 70%)',
                backgroundSize: '100% 100%'
              }}></div>
              
              {/* Decorative nodes */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-primary rounded-full shadow-[0_0_0_4px_rgba(7,2,53,0.2)] animate-pulse"></div>
              <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-primary rounded-full shadow-[0_0_0_6px_rgba(7,2,53,0.2)] animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_0_3px_rgba(7,2,53,0.2)] animate-pulse" style={{ animationDelay: '0.5s' }}></div>

              {/* Map legend */}
              <div className="absolute bottom-6 right-6 bg-surface-container-lowest/90 backdrop-blur border border-outline-variant rounded-lg p-3 shadow-md z-10">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">IMPORT VOLUME (USD)</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">Low</span>
                  <div className="w-32 h-2 bg-gradient-to-r from-surface-variant to-secondary rounded-full"></div>
                  <span className="text-xs font-bold text-secondary">High</span>
                </div>
              </div>

              {/* Central stylized continent shapes to look like the design */}
              <div className="w-full h-full relative opacity-50 text-secondary-fixed mix-blend-multiply">
                 <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                   <path d="M200,150 Q250,120 300,180 T250,250 T150,300 T180,200 Z" fill="currentColor" />
                   <path d="M450,100 Q550,80 600,150 T500,300 T400,250 T420,150 Z" fill="currentColor" />
                   <path d="M700,150 Q800,120 850,200 T750,350 T650,250 Z" fill="currentColor" />
                 </svg>
              </div>
            </div>
          </div>

          {/* Right Panel: AI Mentor Insights */}
          <div className="bg-surface-container-lowest border-2 border-primary-fixed rounded-xl p-6 shadow-sm flex flex-col h-full">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              AI Mentor Insights
            </h2>
            
            <p className="text-sm text-on-surface leading-relaxed mb-6">
              Analysis of <strong>0901.11 (Coffee)</strong> indicates a 14% surge in demand from the <strong>European Union</strong> over the last quarter.
            </p>

            <div className="space-y-4 flex-1">
              {/* Opportunity Alert */}
              <div className="border border-outline-variant rounded-lg p-4 bg-surface flex gap-3 hover:border-secondary transition-colors cursor-default">
                <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-1">Opportunity Identified</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Germany shows highest premium price tolerance for certified organic beans.</p>
                </div>
              </div>

              {/* Regulatory Alert */}
              <div className="border border-error/30 rounded-lg p-4 bg-error-container/20 flex gap-3">
                <span className="material-symbols-outlined text-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <div>
                  <h3 className="text-sm font-bold text-error mb-1">Regulatory Alert</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">EU Deforestation Regulation (EUDR) compliance proof required by Q3.</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 bg-surface-container-lowest border border-primary text-primary font-semibold text-sm py-2.5 rounded-lg flex justify-center items-center gap-2 hover:bg-primary hover:text-on-primary transition-all">
              <span className="material-symbols-outlined text-[18px]">request_quote</span>
              Generate Strategy Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
