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
  /** ISO time of the last JSON backup download, or null if there hasn't been one. */
  lastBackupAt: string | null;
  /** How often to nudge about backing up, in days. 0 turns reminders off. */
  backupReminderDays: number;
  /**
   * Optional personal Gemini API key for "Fix with AI". Empty means "use the
   * server's GEMINI_API_KEY". Stored in this browser only.
   */
  geminiApiKey: string;
}
