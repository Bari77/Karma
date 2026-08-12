"use client";

import clsx from "clsx";
import { THEMES, ThemeId } from "@karma/shared";
import { useTheme } from "@/lib/theme-provider";

interface ThemePickerProps {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  disabled?: boolean;
}

export function ThemePicker({ value, onChange, disabled }: ThemePickerProps) {
  const { themeId: liveThemeId } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((theme) => {
        const selected = value === theme.id;
        const previewActive = liveThemeId === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(theme.id)}
            className={clsx(
              "theme-swatch text-left",
              selected && "theme-swatch-active",
              previewActive && !selected && "ring-1 ring-theme-from"
            )}
            aria-pressed={selected}
          >
            <div className="theme-swatch-preview">
              <div
                className="theme-swatch-preview-from"
                style={{ backgroundColor: theme.accentFrom }}
              />
              <div
                className="theme-swatch-preview-to"
                style={{ backgroundColor: theme.accentTo }}
              />
            </div>
            <p className="px-2 py-2 text-xs font-semibold text-theme-muted">{theme.label}</p>
          </button>
        );
      })}
    </div>
  );
}
