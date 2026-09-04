"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppView, DiaryEntry, DiarySettings, MoodId } from "@/types";
import { DEFAULT_SETTINGS } from "@/constants/settings";
import { clearAllStorage, createEntry, loadEntries, loadSettings, saveEntries, saveSettings } from "@/lib/storage";
import { backupStatus, isMeaningfulEntry, type BackupStatus } from "@/lib/backup";
import { todayKey } from "@/lib/dates";

export type EntryPatch = Partial<Pick<DiaryEntry, "title" | "content" | "mood" | "favorite">>;

interface DiaryApi {
  /** All entries, any order. */
  entries: DiaryEntry[];
  /** Entries newest first. */
  sortedEntries: DiaryEntry[];
  /** Entries starred by the reader. */
  favorites: DiaryEntry[];
  settings: DiarySettings;
  view: AppView;
  selectedDate: string;
  /** Today's key, kept fresh across midnight. */
  today: string;
  hydrated: boolean;
  /**
   * True only when the server was started with a Gemini API key. The editor
   * hides "Fix with AI" otherwise, so the button can never be dead.
   */
  aiEnabled: boolean;
  /** Whether a backup reminder is due, and how much would be lost. */
  backup: BackupStatus;
  setView: (view: AppView) => void;
  /** Open a page (any date) in the editor. */
  openEntry: (date: string) => void;
  /** Update an entry; creates it silently if it doesn't exist yet. */
  updateEntry: (date: string, patch: EntryPatch) => void;
  deleteEntry: (date: string) => void;
  setMood: (date: string, mood: MoodId | null) => void;
  toggleFavorite: (date: string) => void;
  importEntries: (entries: DiaryEntry[], mode: "merge" | "replace") => void;
  updateSettings: (patch: Partial<DiarySettings>) => void;
  resetAll: () => void;
}

const DiaryContext = createContext<DiaryApi | null>(null);

export function DiaryProvider({ children, aiEnabled }: { children: ReactNode; aiEnabled: boolean }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [settings, setSettings] = useState<DiarySettings>(DEFAULT_SETTINGS);
  const [view, setView] = useState<AppView>("editor");
  const [selectedDate, setSelectedDate] = useState<string>(() => todayKey());
  const [today, setToday] = useState<string>(() => todayKey());
  const [hydrated, setHydrated] = useState(false);

  // ---- Hydration -----------------------------------------------------
  useEffect(() => {
    const stored = loadEntries();
    const t = todayKey();
    const list = stored.some((e) => e.date === t) ? stored : [...stored, createEntry(t)];
    setEntries(list);
    setSettings(loadSettings());
    setSelectedDate(t);
    setToday(t);
    const timer = setTimeout(() => setHydrated(true), 480);
    return () => clearTimeout(timer);
  }, []);

  // ---- Persistence ---------------------------------------------------
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEntries(entries), 200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [entries, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
  }, [settings, hydrated]);

  // Flush pending writes when the tab closes.
  useEffect(() => {
    const flush = () => saveEntries(entriesRef.current);
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // ---- Apply theme attribute (palette) -------------------------------
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // ---- Midnight rollover ---------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      const t = todayKey();
      setToday((prev) => (prev === t ? prev : t));
    }, 30_000);
    return () => clearInterval(id);
  }, [hydrated]);

  // When the day changes while the app is open, a fresh page appears.
  useEffect(() => {
    if (!hydrated) return;
    setEntries((prev) => (prev.some((e) => e.date === today) ? prev : [...prev, createEntry(today)]));
  }, [today, hydrated]);

  // ---- Actions --------------------------------------------------------
  const updateEntry = useCallback((date: string, patch: EntryPatch) => {
    const now = new Date().toISOString();
    setEntries((prev) => {
      const existing = prev.find((e) => e.date === date);
      if (!existing) {
        return [...prev, createEntry(date, { ...patch, updatedAt: now })];
      }
      return prev.map((e) => (e.date === date ? { ...e, ...patch, updatedAt: now } : e));
    });
  }, []);

  const deleteEntry = useCallback((date: string) => {
    setEntries((prev) => prev.filter((e) => e.date !== date));
  }, []);

  const setMood = useCallback(
    (date: string, mood: MoodId | null) => updateEntry(date, { mood }),
    [updateEntry],
  );

  const toggleFavorite = useCallback(
    (date: string) => {
      setEntries((prev) =>
        prev.map((e) => (e.date === date ? { ...e, favorite: !e.favorite } : e)),
      );
    },
    [],
  );

  const openEntry = useCallback((date: string) => {
    setSelectedDate(date);
    setView("editor");
  }, []);

  const importEntries = useCallback(
    (incoming: DiaryEntry[], mode: "merge" | "replace") => {
      const t = todayKey();
      setEntries((prev) => {
        if (mode === "replace") {
          const base = incoming.some((e) => e.date === t)
            ? incoming
            : [...incoming, createEntry(t)];
          return base;
        }
        const merged = new Map(prev.map((e) => [e.date, e]));
        for (const entry of incoming) merged.set(entry.date, entry);
        const list = [...merged.values()];
        return list.some((e) => e.date === t) ? list : [...list, createEntry(t)];
      });
    },
    [],
  );

  const updateSettings = useCallback((patch: Partial<DiarySettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    clearAllStorage();
    const t = todayKey();
    setEntries([createEntry(t)]);
    setSettings(DEFAULT_SETTINGS);
    setSelectedDate(t);
    setToday(t);
    setView("editor");
  }, []);

  // ---- Derived ---------------------------------------------------------
  // A page counts once it carries words, a title, a mood or a star.
  // Blank auto-created placeholders stay in storage but don't clutter
  // the journal, search results or statistics.
  const sortedEntries = useMemo(() => {
    const meaningful = entries.filter(isMeaningfulEntry);
    return [...meaningful].sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const backup = useMemo(
    () => backupStatus(entries, settings),
    [entries, settings.lastBackupAt, settings.backupReminderDays], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const favorites = useMemo(
    () => sortedEntries.filter((e) => e.favorite),
    [sortedEntries],
  );

  const api = useMemo<DiaryApi>(
    () => ({
      entries,
      sortedEntries,
      favorites,
      settings,
      view,
      selectedDate,
      today,
      hydrated,
      aiEnabled,
      backup,
      setView,
      openEntry,
      updateEntry,
      deleteEntry,
      setMood,
      toggleFavorite,
      importEntries,
      updateSettings,
      resetAll,
    }),
    [
      entries,
      sortedEntries,
      favorites,
      settings,
      view,
      selectedDate,
      today,
      hydrated,
      aiEnabled,
      backup,
      openEntry,
      updateEntry,
      deleteEntry,
      setMood,
      toggleFavorite,
      importEntries,
      updateSettings,
      resetAll,
    ],
  );

  return <DiaryContext.Provider value={api}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryApi {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary must be used within a DiaryProvider");
  return ctx;
}
