import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "standard" | "ascii";

const STORAGE_KEY = "rx-theme";

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function readStoredTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ascii" || saved === "standard") return saved;
  } catch {
    return "standard";
  }
  return "standard";
}

export function ThemeProvider({ children, initial }: { children: ReactNode; initial?: ThemeName }) {
  const [theme, setThemeState] = useState<ThemeName>(() => initial ?? readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "ascii" ? "#0b0d10" : "#ffffff");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      return;
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => setThemeState(next), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "ascii" ? "standard" : "ascii")), []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
