"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor, Loader2, Lock, Mail } from "lucide-react";
import { loginUser, registerUser, hasSession } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already authenticated → straight to the app (the onboarding gate takes over).
  useEffect(() => {
    if (hasSession()) router.replace("/dashboard");
  }, [router]);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Isi email dan kata sandi.");
      return;
    }
    if (mode === "register") {
      if (password.length < 8) {
        setError("Kata sandi minimal 8 karakter.");
        return;
      }
      if (password !== confirm) {
        setError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }
    setBusy(true);
    const res =
      mode === "login"
        ? await loginUser(email.trim(), password)
        : await registerUser(email.trim(), password);
    setBusy(false);
    if (res.ok) {
      // New/returning user → dashboard; the layout gate routes to onboarding if needed.
      router.replace("/dashboard");
    } else {
      setError(res.error ?? "Terjadi kesalahan.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-bright p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Anchor className="size-6" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary font-heading">TradeConnect</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Infrastruktur Ekspor AI</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex gap-1 p-1 bg-surface-container-high rounded-lg mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${mode === m ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant"}`}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submit()}
                  placeholder="nama@perusahaan.co.id"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-outline-variant rounded-lg outline-none focus:border-primary"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kata Sandi</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submit()}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-outline-variant rounded-lg outline-none focus:border-primary"
                />
              </div>
            </label>

            {mode === "register" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Konfirmasi Kata Sandi</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-outline-variant rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="text-xs text-error font-medium bg-error/5 border border-error/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              onClick={() => void submit()}
              disabled={busy}
              className="mt-1 bg-primary text-on-primary font-bold text-sm py-3 rounded-lg hover:bg-surface-tint transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Masuk" : "Buat Akun"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-variant mt-4">
          {mode === "login" ? "Belum punya akun? Pilih “Daftar” di atas." : "Sudah punya akun? Pilih “Masuk” di atas."}
        </p>
      </div>
    </div>
  );
}
