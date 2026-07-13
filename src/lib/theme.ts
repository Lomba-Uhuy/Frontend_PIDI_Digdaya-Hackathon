export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "tradeconnect_theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getResolvedTheme(): "light" | "dark" {
  const stored = getStoredTheme();
  return stored === "system" ? (getSystemPrefersDark() ? "dark" : "light") : stored;
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  const resolved = theme === "system" ? (getSystemPrefersDark() ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event("tradeconnect_theme_change"));
}
