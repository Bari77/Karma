"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME_ID, getTheme, type ThemeDefinition } from "@karma/shared";

function readThemeFromDom(): ThemeDefinition {
  if (typeof document === "undefined") return getTheme(DEFAULT_THEME_ID);

  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  const fallback = getTheme(DEFAULT_THEME_ID);
  return {
    id: DEFAULT_THEME_ID,
    label: fallback.label,
    accentFrom: read("--theme-accent-from", fallback.accentFrom),
    accentTo: read("--theme-accent-to", fallback.accentTo),
    accentFromNeon: read("--theme-accent-from-neon", fallback.accentFromNeon),
    accentToNeon: read("--theme-accent-to-neon", fallback.accentToNeon),
    accentFromDim: read("--theme-accent-from-dim", fallback.accentFromDim),
    accentToDim: read("--theme-accent-to-dim", fallback.accentToDim),
    glow: read("--theme-glow", fallback.glow),
  };
}

export function useThemeColors(): ThemeDefinition {
  const [colors, setColors] = useState<ThemeDefinition>(() =>
    typeof document !== "undefined" ? readThemeFromDom() : getTheme(DEFAULT_THEME_ID)
  );

  useEffect(() => {
    const refresh = () => setColors(readThemeFromDom());
    refresh();

    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
