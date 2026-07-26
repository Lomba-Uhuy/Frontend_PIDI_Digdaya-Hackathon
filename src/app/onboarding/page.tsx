"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Factory,
  FileText,
  FileUp,
  Globe,
  IdCard,
  Image,
  ImagePlus,
  Info,
  Lock,
  LogOut,
  Package,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { resetState, setStep as setJourneyStep, setFinalPrice } from "../../lib/state";
import { hasSession, logout } from "../../lib/auth";
import { getRole } from "../../lib/entitlements";
import { ensureUmkmAndProduct } from "../../lib/entities";
import { Stepper } from "../../components/ui/stepper";
import { Logo } from "../../components/ui/logo";

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
  const [nibError, setNibError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [moq, setMoq] = useState("");
  const [capacity, setCapacity] = useState("");
  const [logistics, setLogistics] = useState("fob");

  useEffect(() => {
    // Auth guard — onboarding is only for authenticated users.
    if (typeof window !== "undefined" && !hasSession()) {
      router.replace("/login");
      return;
    }
    // Onboarding belongs exclusively to UMKM. Admins never create a company/product.
    if (getRole() === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
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
      // Reset the consolidated Product model (incl. any cached HS classification)
      // so a fresh onboarding re-classifies for the new product.
      localStorage.removeItem("tradeconnect_product");
    }
  }, []);



  const handleCompleteSetup = async () => {
    const isRattan =
      (productName || "").toLowerCase().includes("rotan") ||
      (productName || "").toLowerCase().includes("rattan") ||
      (productName || "").toLowerCase().includes("kursi");

    const convertToUsd = (rpOrUsdStr: string, defaultValueUsd: number): number => {
      const val = parseFloat(rpOrUsdStr);
      if (isNaN(val)) return defaultValueUsd;
      // Nilai besar (> 1000) diasumsikan Rupiah → konversi ke USD (kurs 16.000).
      return val > 1000 ? val / 16000 : val;
    };

    const finalFloorPriceUsd = convertToUsd(floorPrice, isRattan ? 45.0 : 2.68);
    const finalAskingPriceUsd = convertToUsd(askingPrice, isRattan ? 55.0 : 2.85);
    // Journey price seed for the negotiation/PO calculators (not product data).
    setFinalPrice(finalAskingPriceUsd);

    // Backend-first: the company + product MUST persist server-side before we
    // continue. Ownership + all product/AI data are authoritative on the backend;
    // the frontend keeps NO local product store.
    const persisted = await ensureUmkmAndProduct({
      companyName,
      nib,
      productName,
      productDesc,
      moq,
      capacity,
      floorPriceUsd: finalFloorPriceUsd,
      askingPriceUsd: finalAskingPriceUsd,
    }).catch(() => null);
    if (!persisted) {
      window.alert(
        "Gagal menyimpan data perusahaan & produk ke server. Pastikan NIB 13 digit valid dan koneksi stabil, lalu coba lagi.",
      );
      return;
    }

    setJourneyStep("verified");
    router.push("/verification");
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
    // Step 2 (Legalitas): NIB is mandatory and must be exactly 13 digits — the
    // verification step validates it live against OSS RBA.
    if (step === 2) {
      const digits = nib.replace(/\D/g, "");
      if (digits.length !== 13) {
        setNibError("NIB wajib diisi dan harus terdiri dari tepat 13 digit angka.");
        return;
      }
      if (!companyName.trim()) {
        setNibError("Nama perusahaan terdaftar wajib diisi.");
        return;
      }
      setNibError("");
    }
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <main className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center min-h-screen">
      {/* Logout — onboarding is post-login; let users switch/exit the account. */}
      <button
        onClick={() => logout()}
        className="fixed top-4 right-4 z-20 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface bg-surface-container-lowest/80 backdrop-blur border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
      >
        <LogOut className="size-4" /> Keluar
      </button>

      {/* Header / Brand Anchor */}
      <header className="text-center mb-8 w-full max-w-3xl">
        <h1 className="text-4xl md:text-[48px] font-bold tracking-tight text-primary mb-2 flex items-center justify-center gap-3 font-heading">
          <Logo size={30} priority />
          TradeConnect
        </h1>
        <p className="text-base text-on-surface-variant">Institutional Export Terminal Initialization</p>
      </header>



      {/* Onboarding Wizard Card */}
      <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">

        {/* Progress Stepper Header */}
        <div className="bg-surface-container-low border-b border-outline-variant p-6 md:px-10 relative overflow-hidden">
          <div className="max-w-lg mx-auto">
            <Stepper steps={["Produk", "Legalitas", "Kapabilitas"]} currentStep={step} />
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
                <Sparkles className="text-primary mt-1 size-6" />
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
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
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
                      <span className="text-sm font-medium text-on-surface">Harga Dasar Minimum (Rp/unit) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant select-none">Rp</span>
                      <input 
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                        id="floor_price" 
                        placeholder="misal: 42880" 
                        required 
                        type="number" 
                        min="0" 
                        value={floorPrice}
                        onChange={(e) => setFloorPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant flex items-start gap-1.5">
                      <Lock className="text-primary mt-0.5 size-3.5" />
                      Harga ini bersifat rahasia dan hanya digunakan AI untuk melindungi margin Anda saat negosiasi.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col" htmlFor="asking_price">
                      <span className="text-sm font-medium text-on-surface">Harga Penawaran Awal (Rp/unit) *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant select-none">Rp</span>
                      <input 
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-md text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors" 
                        id="asking_price" 
                        placeholder="misal: 45600" 
                        required 
                        type="number" 
                        min="0" 
                        value={askingPrice}
                        onChange={(e) => setAskingPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant flex items-start gap-1.5">
                      <Info className="text-secondary mt-0.5 size-3.5" />
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
                    <ImagePlus className="text-outline mb-2 size-9" />
                    <p className="text-sm text-on-surface font-medium">Klik untuk mengunggah atau seret dan lepas file di sini</p>
                    <p className="text-xs text-on-surface-variant mt-1">PNG, JPG hingga 5MB</p>
                  </label>
                  {productPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {productPhotos.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-surface-variant px-3 py-1.5 rounded-md">
                          <Image className="text-on-surface-variant size-4" />
                          <span className="text-xs text-on-surface truncate max-w-[120px]">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, setProductPhotos)} className="text-error hover:text-on-error-container ml-1">
                            <X className="size-4" />
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
                <Sparkles className="text-primary mt-1 size-6" />
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
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
                    <input
                      className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-md text-sm text-on-surface focus:ring-1 focus:outline-none transition-colors ${nibError ? "border-error focus:border-error focus:ring-error" : "border-outline-variant focus:border-primary focus:ring-primary"}`}
                      id="nib"
                      placeholder="13 digit nomor identifikasi resmi"
                      required
                      inputMode="numeric"
                      maxLength={13}
                      type="text"
                      value={nib}
                      onChange={(e) => { setNib(e.target.value.replace(/\D/g, "").slice(0, 13)); if (nibError) setNibError(""); }}
                    />
                  </div>
                  {nibError && (
                    <p className="text-[11px] text-error font-medium flex items-center gap-1.5">
                      {nibError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex flex-col" htmlFor="company_name">
                    <span className="text-sm font-medium text-on-surface">Nama Perusahaan Terdaftar *</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
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
                    <FileUp className="text-outline mb-2 size-9" />
                    <p className="text-sm text-on-surface font-medium">Klik untuk mengunggah sertifikat (Halal, BPOM, SNI, dll.)</p>
                    <p className="text-xs text-on-surface-variant mt-1">PDF, PNG, JPG hingga 5MB</p>
                  </label>
                  {certFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {certFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 bg-surface border border-outline-variant px-3 py-2 rounded-md">
                          <FileText className="text-primary size-6" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm text-on-surface font-medium truncate">{file.name}</span>
                            <span className="text-[10px] text-on-surface-variant uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <button type="button" onClick={() => removeFile(i, setCertFiles)} className="text-error hover:text-on-error-container p-1 rounded hover:bg-error-container/30 transition-colors">
                            <Trash2 className="size-5" />
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
                    <ShoppingBasket className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
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
                    <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
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
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-outline size-6" />
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none size-6" />
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
                <ArrowLeft className="size-[18px]" />
                Kembali
              </button>
            ) : <div></div>}
            
            <button 
              onClick={step < 3 ? nextStep : handleCompleteSetup}
              className="bg-primary hover:bg-surface-tint text-on-primary font-medium text-sm px-8 py-3 rounded-md transition-colors flex items-center gap-2 ml-auto" 
              type="button"
            >
              {step < 3 ? 'Langkah Selanjutnya' : 'Selesaikan Konfigurasi'}
              {step < 3 && <ArrowRight className="size-[18px]" />}
              {step === 3 && <CheckCircle2 className="size-[18px]" />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
