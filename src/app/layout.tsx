import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "TradeConnect — Platform Ekspor untuk UMKM Indonesia",
  description: "Bantu UMKM Indonesia menyiapkan produk, menemukan peluang internasional, dan mengelola kesiapan ekspor dalam satu platform terpadu.",
  icons: { icon: "/logo-tradeconnect.webp", shortcut: "/logo-tradeconnect.webp", apple: "/logo-tradeconnect.webp" },
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('tradeconnect_theme');var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lexend.variable} font-sans h-full antialiased`}
    >
      <head>
        {/* Anti-FOUC theme init: Next injects beforeInteractive scripts into the
            initial HTML (runs before paint) without the raw-<script> warning. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
