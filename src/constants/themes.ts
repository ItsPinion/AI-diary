import type { ThemeId } from "@/types";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  /** Accent swatches used in the picker: [accent, secondary]. */
  swatch: [string, string];
  /** Short poetic description. */
  description: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "aurora",
    name: "Aurora",
    swatch: ["#FF7E67", "#FFD369"],
    description: "Morning light on cream paper",
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: ["#4A90B5", "#8FC3D9"],
    description: "Quiet water, clear sky",
  },
  {
    id: "forest",
    name: "Forest",
    swatch: ["#4E8D6A", "#A8C686"],
    description: "Moss, ferns and soft rain",
  },
  {
    id: "lavender",
    name: "Lavender",
    swatch: ["#8E7CC3", "#C9B8E8"],
    description: "Dusk in a quiet garden",
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: ["#D96C75", "#F0A868"],
    description: "Warm light at day's end",
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: ["#8FB8E8", "#6C7FD9"],
    description: "Stars over a sleeping town",
  },
];

export const THEME_MAP: Record<ThemeId, ThemeMeta> = THEMES.reduce(
  (acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  },
  {} as Record<ThemeId, ThemeMeta>,
);

/** The palette a fresh diary opens in — kept in step with DEFAULT_SETTINGS. */
export const DEFAULT_THEME: ThemeId = "lavender";

export function themeById(id: ThemeId): ThemeMeta {
  return THEME_MAP[id] ?? THEME_MAP[DEFAULT_THEME] ?? THEMES[0];
}
