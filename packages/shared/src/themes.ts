export const THEME_IDS = [
  "cyan-purple",
  "green-sky",
  "violet-orange",
  "green-beige",
  "navy-white",
  "red-orange",
  "pink-sky",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "cyan-purple";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  accentFrom: string;
  accentTo: string;
  accentFromNeon: string;
  accentToNeon: string;
  accentFromDim: string;
  accentToDim: string;
  glow: string;
}

/** Palettes calibrées — accentFrom = jauge basse / MA, accentTo = jauge haute / BA */
export const THEMES: ThemeDefinition[] = [
  {
    id: "cyan-purple",
    label: "Cyan / Violet",
    accentFrom: "#22d3ee",
    accentTo: "#c026d3",
    accentFromNeon: "#00f0ff",
    accentToNeon: "#e040fb",
    accentFromDim: "#0e7490",
    accentToDim: "#581c87",
    glow: "#a855f7",
  },
  {
    id: "green-sky",
    label: "Bleu clair / Vert",
    accentFrom: "#007EC3",
    accentTo: "#3B7D01",
    accentFromNeon: "#33a3d9",
    accentToNeon: "#5ca028",
    accentFromDim: "#004a73",
    accentToDim: "#234a01",
    glow: "#3B7D01",
  },
  {
    id: "violet-orange",
    label: "Violet / Orange",
    accentFrom: "#330B7B",
    accentTo: "#A7701B",
    accentFromNeon: "#5520b0",
    accentToNeon: "#cc9228",
    accentFromDim: "#1a0540",
    accentToDim: "#6b4810",
    glow: "#A7701B",
  },
  {
    id: "green-beige",
    label: "Beige / Vert",
    accentFrom: "#C3AC76",
    accentTo: "#154D1A",
    accentFromNeon: "#dcc99a",
    accentToNeon: "#2a7a32",
    accentFromDim: "#8a7854",
    accentToDim: "#0a3010",
    glow: "#154D1A",
  },
  {
    id: "navy-white",
    label: "Blanc / Bleu foncé",
    accentFrom: "#D7D0C8",
    accentTo: "#00438E",
    accentFromNeon: "#f5f2ee",
    accentToNeon: "#0066bb",
    accentFromDim: "#9a958f",
    accentToDim: "#002654",
    glow: "#00438E",
  },
  {
    id: "red-orange",
    label: "Rouge / Orange",
    accentFrom: "#7D0001",
    accentTo: "#FD7B00",
    accentFromNeon: "#a81818",
    accentToNeon: "#ff9933",
    accentFromDim: "#450000",
    accentToDim: "#994a00",
    glow: "#FD7B00",
  },
  {
    id: "pink-sky",
    label: "Rose / Bleu ciel",
    accentFrom: "#9E0C51",
    accentTo: "#00A4AD",
    accentFromNeon: "#d41a72",
    accentToNeon: "#33c4cc",
    accentFromDim: "#5a062e",
    accentToDim: "#006066",
    glow: "#9E0C51",
  },
];

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyThemeCssVars(
  theme: ThemeDefinition,
  target: {
    setAttribute: (name: string, value: string) => void;
    setProperty: (name: string, value: string) => void;
  }
) {
  target.setAttribute("data-theme", theme.id);
  target.setProperty("--theme-accent-from", theme.accentFrom);
  target.setProperty("--theme-accent-to", theme.accentTo);
  target.setProperty("--theme-accent-from-neon", theme.accentFromNeon);
  target.setProperty("--theme-accent-to-neon", theme.accentToNeon);
  target.setProperty("--theme-accent-from-dim", theme.accentFromDim);
  target.setProperty("--theme-accent-to-dim", theme.accentToDim);
  target.setProperty("--theme-glow", theme.glow);
}
