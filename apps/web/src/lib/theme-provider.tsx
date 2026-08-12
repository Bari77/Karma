"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_THEME_ID, ThemeId, getTheme, isThemeId, applyThemeCssVars } from "@karma/shared";
import { useAuth } from "./auth-context";

const STORAGE_KEY = "karma-theme";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  setThemeId: () => {},
});

export function applyTheme(themeId: ThemeId) {
  const root = document.documentElement;
  applyThemeCssVars(getTheme(themeId), {
    setAttribute: (name, value) => root.setAttribute(name, value),
    setProperty: (name, value) => root.style.setProperty(name, value),
  });
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    /* ignore */
  }
}

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME_ID;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  useEffect(() => {
    if (loading) return;
    const next = user?.themeId ?? readStoredTheme();
    setThemeIdState(next);
    applyTheme(next);
  }, [user?.themeId, loading]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    applyTheme(id);
  }, []);

  const value = useMemo(() => ({ themeId, setThemeId }), [themeId, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
