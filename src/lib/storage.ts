import type { DiaryEntry, DiarySettings } from "@/types";
import { BACKUP_REMINDER_OPTIONS, DEFAULT_SETTINGS, STORAGE_KEYS } from "@/constants/settings";
import { isValidDateKey } from "@/lib/dates";
import { uid } from "@/lib/id";
import { MOOD_ORDER } from "@/constants/moods";
import type { MoodId } from "@/types";

/**
 * LocalStorage layer. Every read is defensive — a corrupt value must never
 * crash the app; it is simply ignored.
 */

export function createEntry(date: string, patch?: Partial<DiaryEntry>): DiaryEntry {
  const now = new Date().toISOString();
  return {
    id: patch?.id ?? uid(),
    date,
    title: patch?.title ?? "",
    content: patch?.content ?? "",
    mood: patch?.mood ?? null,
    favorite: patch?.favorite ?? false,
    createdAt: patch?.createdAt ?? now,
    updatedAt: patch?.updatedAt ?? now,
  };
}

function sanitizeEntry(raw: unknown): DiaryEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.date !== "string" || !isValidDateKey(r.date)) return null;
  const mood = MOOD_ORDER.includes(r.mood as MoodId) ? (r.mood as MoodId) : null;
  return {
    id: typeof r.id === "string" ? r.id : uid(),
    date: r.date,
    title: typeof r.title === "string" ? r.title : "",
    content: typeof r.content === "string" ? r.content : "",
    mood,
    favorite: r.favorite === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString(),
  };
}

export function loadEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.entries);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    const entries = list.map(sanitizeEntry).filter((e): e is DiaryEntry => e !== null);
    // One entry per date — last write wins.
    const byDate = new Map<string, DiaryEntry>();
    for (const entry of entries) byDate.set(entry.date, entry);
    return [...byDate.values()];
  } catch {
    return [];
  }
}

export function saveEntries(entries: DiaryEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): DiarySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DiarySettings>;
    return {
      theme: ["aurora", "ocean", "forest", "lavender", "sunset", "midnight"].includes(
        parsed.theme as string,
      )
        ? (parsed.theme as DiarySettings["theme"])
        : DEFAULT_SETTINGS.theme,
      fontSize: ["sm", "md", "lg"].includes(parsed.fontSize as string)
        ? (parsed.fontSize as DiarySettings["fontSize"])
        : DEFAULT_SETTINGS.fontSize,
      compact: parsed.compact === true,
      autosaveMs:
        typeof parsed.autosaveMs === "number" && parsed.autosaveMs >= 500
          ? parsed.autosaveMs
          : DEFAULT_SETTINGS.autosaveMs,
      lastBackupAt:
        typeof parsed.lastBackupAt === "string" && !Number.isNaN(Date.parse(parsed.lastBackupAt))
          ? parsed.lastBackupAt
          : null,
      backupReminderDays: BACKUP_REMINDER_OPTIONS.some((option) => option.value === parsed.backupReminderDays)
        ? (parsed.backupReminderDays as number)
        : DEFAULT_SETTINGS.backupReminderDays,
      geminiApiKey: typeof parsed.geminiApiKey === "string" ? parsed.geminiApiKey.trim() : "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: DiarySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    // Ignore quota errors on settings — they are tiny.
  }
}

export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.entries);
    localStorage.removeItem(STORAGE_KEYS.settings);
  } catch {
    // noop
  }
}
