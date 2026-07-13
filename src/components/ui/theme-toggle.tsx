"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { getResolvedTheme, setTheme } from "@/lib/theme";

function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(getResolvedTheme() === "dark");
    const sync = () => setIsDark(getResolvedTheme() === "dark");
    window.addEventListener("tradeconnect_theme_change", sync);
    return () => window.removeEventListener("tradeconnect_theme_change", sync);
  }, []);

  if (!mounted) {
    return <div className={cn("size-11", className)} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode Terang" : "Mode Gelap"}
      className={cn(
        "flex items-center justify-center size-11 rounded-full hover:bg-surface-container-low transition-colors duration-150 cursor-pointer",
        className
      )}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

export { ThemeToggle };
