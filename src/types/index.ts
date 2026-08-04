/** The eight moods a page can carry. */
export type MoodId =
  | "happy"
  | "calm"
  | "loved"
  | "sad"
  | "angry"
  | "tired"
  | "excited"
  | "anxious";

/** A single diary page. One entry per calendar day (local time). */
export interface DiaryEntry {
  id: string;
  /** Local calendar date, "yyyy-MM-dd". */
  date: string;
  title: string;
  content: string;
  mood: MoodId | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Main views of the application. */
export type AppView = "editor" | "journal" | "calendar" | "stats";

/** Handcrafted colour palettes. */
export type ThemeId =
  | "aurora"
  | "ocean"
  | "forest"
  | "lavender"
  | "sunset"
  | "midnight";

export type FontSize = "sm" | "md" | "lg";

export interface DiarySettings {
  theme: ThemeId;
  fontSize: FontSize;
  /** Tighter spacing throughout the interface. */
  compact: boolean;
  /** Autosave cadence in milliseconds. */
  autosaveMs: number;
}
