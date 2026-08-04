import type { DiarySettings } from "@/types";

export const DEFAULT_SETTINGS: DiarySettings = {
  theme: "aurora",
  fontSize: "md",
  compact: false,
  autosaveMs: 1000,
};

/** Body text classes for each type size, used by the editor. */
export function fontSizeClasses(size: DiarySettings["fontSize"]): string {
  switch (size) {
    case "sm":
      return "text-[0.95rem] leading-7";
    case "lg":
      return "text-lg leading-8";
    default:
      return "text-[1.06rem] leading-8";
  }
}

export const AUTOSAVE_OPTIONS: { value: number; label: string }[] = [
  { value: 1000, label: "Every second" },
  { value: 2000, label: "Every 2s" },
  { value: 5000, label: "Every 5s" },
  { value: 10000, label: "Every 10s" },
];

export const STORAGE_KEYS = {
  entries: "inkwell.entries.v1",
  settings: "inkwell.settings.v1",
} as const;

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘ / Ctrl + S", label: "Save now" },
  { keys: "⌘ / Ctrl + F", label: "Search your pages" },
  { keys: "⌘ / Ctrl + 1", label: "Open Today's page" },
  { keys: "⌘ / Ctrl + 2", label: "Open Journal" },
  { keys: "⌘ / Ctrl + 3", label: "Open Calendar" },
  { keys: "⌘ / Ctrl + 4", label: "Open Insights" },
  { keys: "⌘ / Ctrl + D", label: "Star / unstar page" },
  { keys: "?", label: "Show shortcuts" },
  { keys: "Esc", label: "Close dialogs · clear search" },
];
