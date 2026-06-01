"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetState, setStep as setJourneyStep } from "../lib/state";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productPhotos, setProductPhotos] = useState<File[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);

  // Controlled States for Form Inputs
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [floorPrice, setFloorPrice] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [nib, setNib] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [moq, setMoq] = useState("");
  const [capacity, setCapacity] = useState("");
  const [logistics, setLogistics] = useState("fob");

  useEffect(() => {
    resetState();
    // Clear custom localStorage items on onboarding
    if (typeof window !== "undefined") {
      localStorage.removeItem("tradeconnect_product_name");
      localStorage.removeItem("tradeconnect_product_desc");
      localStorage.removeItem("tradeconnect_floor_price");
      localStorage.removeItem("tradeconnect_asking_price");
      localStorage.removeItem("tradeconnect_nib");
      localStorage.removeItem("tradeconnect_company_name");
      localStorage.removeItem("tradeconnect_moq");
      localStorage.removeItem("tradeconnect_capacity");
      localStorage.removeItem("tradeconnect_logistics");
      localStorage.removeItem("tradeconnect_product_type");
    }
  }, []);



  const handleCompleteSetup = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tradeconnect_product_name", productName || "Biji Kopi Robusta Premium");
      localStorage.setItem("tradeconnect_product_desc", productDesc || "Biji kopi robusta Grade 1 premium buatan petani lokal Indonesia dengan keasaman seimbang.");
      localStorage.setItem("tradeconnect_floor_price", floorPrice || "2.68");
      localStorage.setItem("tradeconnect_asking_price", askingPrice || "2.85");
      localStorage.setItem("tradeconnect_nib", nib || "1234567890123");
      localStorage.setItem("tradeconnect_company_name", companyName || "PT Nusantara Global Coffee");
      localStorage.setItem("tradeconnect_moq", moq || "1000 Pcs");
      localStorage.setItem("tradeconnect_capacity", capacity || "50,000 Units");
      localStorage.setItem("tradeconnect_logistics", logistics || "fob");
      
      const isRattan = (productName || "").toLowerCase().includes("rotan") || (productName || "").toLowerCase().includes("rattan") || (productName || "").toLowerCase().includes("kursi");
      localStorage.setItem("tradeconnect_product_type", isRattan ? "rattan" : "coffee");
      
      // Save final price
      const price = parseFloat(askingPrice || "2.85");
      localStorage.setItem("tradeconnect_final_price", price.toString());
    }
    setJourneyStep("verified");
    router.push('/verification');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      setter((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen">
      {/* Header / Brand Anchor */}
      <header className="text-center mb-8 w-full max-w-3xl">
        <h1 className="text-4xl md:text-[48px] font-bold tracking-tight text-primary mb-2 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
          TradeConnect
        </h1>
        <p className="text-base text-on-surface-variant">Institutional Export Terminal Initialization</p>
      </header>



      {/* Onboarding Wizard Card */}
      <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
        
        {/* Progress Stepper Header */}
        <div className="bg-surface-container-low border-b border-outline-variant p-6 md:px-10 relative overflow-hidden">
          <div className="relative flex justify-between items-center w-full z-10 max-w-lg mx-auto">
            {/* Connecting Background Line */}
            <div className="absolute left-0 top-4 w-full h-[2px] bg-surface-variant -z-10"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute left-0 top-4 h-[2px] bg-primary -z-10 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${step >= 1 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant'}`}>
                1
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Produk</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${step >= 2 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant'}`}>
                2
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Legalitas</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${step >= 3 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant'}`}>
                3
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Kapabilitas</span>
            </div>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="p-6 md:p-10 flex flex-col gap-8 min-h-[500px]">
          
          {/* STEP 1: PRODUCT */}
          {step === 1 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-semibold text-primary">Data Produk</h2>
                <p className="text-sm text-on-surface-variant mt-4 max-w-2xl">
                  Harap berikan detail tentang produk utama yang ingin Anda ekspor.
                </p>
              </div>

              <div className="bg-surface border-l-4 border-primary p-4 rounded-r-md flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <div>
                  <p className="text-sm text-on-surface font-semibold mb-1">Pemetaan HS Code AI TradeConnect</p>
                  <p className="text-sm text-on-surface-variant">
                    Model NLP kami akan memetakan deskripsi produk Anda secara otomatis ke HS Code 6 digit yang paling relevan untuk pasar global.
                  </p>
                </div>
              </div>

              <form className="grid grid-cols-1 gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="product_name">
                    <span className="text-sm font-medium text-on-surface">Nama Produk *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">inventory_2</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                      id="product_name" 
                      placeholder="misal: Biji Kopi Robusta Premium" 
                      required 
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="product_desc">
                    <span className="text-sm font-medium text-on-surface">Deskripsi Produk *</span>
                  </label>
                  <textarea 
                    className="w-full p-4 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors min-h-[120px]" 
                    id="product_desc" 
                    placeholder="Gambarkan bahan, asal, kualitas, dan keunggulan produk..." 
                    required
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col" htmlFor="floor_price">
                      <span className="text-sm font-medium text-on-surface">Harga Dasar Minimum (USD/unit) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">price_check</span>
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                        id="floor_price" 
                        placeholder="misal: 2.68" 
                        required 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={floorPrice}
                        onChange={(e) => setFloorPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">lock</span>
                      Harga ini bersifat rahasia dan hanya digunakan AI untuk melindungi margin Anda saat negosiasi.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col" htmlFor="asking_price">
                      <span className="text-sm font-medium text-on-surface">Harga Penawaran Awal (USD/unit) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">sell</span>
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                        id="asking_price" 
                        placeholder="misal: 2.85" 
                        required 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value={askingPrice}
                        onChange={(e) => setAskingPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5">info</span>
                      Harga yang ditampilkan ke pembeli. AI akan menjaga agar tidak jatuh di bawah Floor Price.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium text-on-surface">Foto Produk *</span>
                  </label>
                  <label className="border-2 border-dashed border-outline-variant rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-variant/50 transition-colors">
                    <input type="file" multiple accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleFileChange(e, setProductPhotos)} />
                    <span className="material-symbols-outlined text-outline text-4xl mb-2">add_photo_alternate</span>
                    <p className="text-sm text-on-surface font-medium">Klik untuk mengunggah atau seret dan lepas file di sini</p>
                    <p className="text-xs text-on-surface-variant mt-1">PNG, JPG hingga 5MB</p>
                  </label>
                  {productPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productPhotos.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-variant px-3 py-1.5 rounded-md">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">image</span>
                          <span className="text-xs text-on-surface truncate max-w-[120px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, setProductPhotos)} className="text-error hover:text-on-error-container ml-1">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: LEGAL */}
          {step === 2 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-semibold text-primary">Data Legalitas &amp; Kepatuhan</h2>
                <p className="text-sm text-on-surface-variant mt-4 max-w-2xl">
                  Harap berikan detail pendaftaran bisnis resmi Anda untuk membuat profil institusional Anda.
                </p>
              </div>

              <div className="bg-surface border-l-4 border-primary p-4 rounded-r-md flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <div>
                  <p className="text-sm text-on-surface font-semibold mb-1">Verifikasi AI TradeConnect</p>
                  <p className="text-sm text-on-surface-variant">
                    NIB Anda bertindak sebagai kunci utama. Kami menyinkronkannya dengan aman dengan sistem OSS untuk memetakan tingkat kepatuhan Anda secara instan dan membuka pasar ekspor tujuan.
                  </p>
                </div>
              </div>

              <form className="grid grid-cols-1 gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="nib">
                    <span className="text-sm font-medium text-on-surface">NIB (Nomor Induk Berusaha) *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">badge</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                      id="nib" 
                      placeholder="13 digit nomor identifikasi resmi" 
                      required 
                      type="text"
                      value={nib}
                      onChange={(e) => setNib(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="company_name">
                    <span className="text-sm font-medium text-on-surface">Nama Perusahaan Terdaftar *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">domain</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                      id="company_name" 
                      placeholder="misal: PT. Nusantara Global" 
                      required 
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium text-on-surface">Unggah Sertifikasi Pendukung (Opsional)</span>
                  </label>
                  <label className="border-2 border-dashed border-outline-variant rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-variant/50 transition-colors">
                    <input type="file" multiple accept=".pdf, image/png, image/jpeg" className="hidden" onChange={(e) => handleFileChange(e, setCertFiles)} />
                    <span className="material-symbols-outlined text-outline text-4xl mb-2">upload_file</span>
                    <p className="text-sm text-on-surface font-medium">Klik untuk mengunggah sertifikat (Halal, BPOM, SNI, dll.)</p>
                    <p className="text-xs text-on-surface-variant mt-1">PDF, PNG, JPG hingga 5MB</p>
                  </label>
                  {certFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {certFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 bg-surface border border-outline-variant px-3 py-2 rounded-md">
                          <span className="material-symbols-outlined text-primary">description</span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium truncate">{file.name}</span>
                            <span className="text-[10px] text-on-surface-variant uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <button type="button" onClick={() => removeFile(i, setCertFiles)} className="text-error hover:text-on-error-container p-1 rounded hover:bg-error-container/30 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CAPABILITY */}
          {step === 3 && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-semibold text-primary">Kapasitas Produksi &amp; Logistik</h2>
                <p className="text-sm text-on-surface-variant mt-4 max-w-2xl">
                  Beri tahu pembeli global kapasitas produksi dan pengiriman Anda.
                </p>
              </div>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="moq">
                    <span className="text-sm font-medium text-on-surface">Batas Pesanan Minimum (MOQ) *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">shopping_basket</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                      id="moq" 
                      placeholder="misal: 1000 Pcs atau 1 Kontainer 20ft" 
                      required 
                      type="text"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="capacity">
                    <span className="text-sm font-medium text-on-surface">Kapasitas Produksi Bulanan *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">factory</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                      id="capacity" 
                      placeholder="misal: 50.000 Unit" 
                      required 
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="flex flex-col" htmlFor="logistics">
                    <span className="text-sm font-medium text-on-surface">Preferensi Syarat Logistik (Incoterms)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">local_shipping</span>
                    <select 
                      className="w-full pl-10 pr-10 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none appearance-none transition-colors cursor-pointer" 
                      id="logistics"
                      value={logistics}
                      onChange={(e) => setLogistics(e.target.value)}
                    >
                      <option value="fob">FOB (Free on Board) - Direkomendasikan</option>
                      <option value="exw">EXW (Ex Works)</option>
                      <option value="cif">CIF (Cost, Insurance, and Freight)</option>
                      <option value="negotiable">Terbuka untuk Negosiasi</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-auto pt-6 border-t border-surface-variant flex justify-between items-center">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                className="text-primary hover:bg-surface px-6 py-3 rounded-md font-medium text-sm transition-colors flex items-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
              </button>
            ) : <div></div>}
            
            <button 
              onClick={step < 3 ? nextStep : handleCompleteSetup}
              className="bg-primary hover:bg-surface-tint text-on-primary font-medium text-sm px-8 py-3 rounded-md transition-colors flex items-center gap-2 ml-auto" 
              type="button"
            >
              {step < 3 ? 'Langkah Selanjutnya' : 'Selesaikan Konfigurasi'}
              {step < 3 && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              {step === 3 && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
