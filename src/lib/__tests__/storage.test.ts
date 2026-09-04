import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllStorage,
  createEntry,
  loadEntries,
  loadSettings,
  saveEntries,
  saveSettings,
} from "@/lib/storage";
import { STORAGE_KEYS } from "@/constants/settings";
import type { ThemeId } from "@/types";

/** Tiny in-memory localStorage for Node (the app only ever calls these). */
function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("storage", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = makeLocalStorage();
  });

  describe("entries", () => {
    it("returns an empty list when nothing is stored", () => {
      expect(loadEntries()).toEqual([]);
    });

    it("survives corrupt JSON", () => {
      localStorage.setItem(STORAGE_KEYS.entries, "{not json");
      expect(loadEntries()).toEqual([]);
    });

    it("ignores non-array payloads", () => {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify({ no: "list" }));
      expect(loadEntries()).toEqual([]);
    });

    it("drops invalid entries (bad date, wrong types)", () => {
      localStorage.setItem(
        STORAGE_KEYS.entries,
        JSON.stringify([
          { id: "1", date: "not-a-date", title: "bad" },
          { id: "2", date: "2026-02-30", title: "impossible" },
          { id: "3", date: "2026-01-01", title: "good", content: "kept" },
          "not an object",
        ]),
      );
      const entries = loadEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe("good");
    });

    it("normalises unknown moods to null and missing fields to defaults", () => {
      localStorage.setItem(
        STORAGE_KEYS.entries,
        JSON.stringify([{ id: "1", date: "2026-01-01", mood: "ecstatic", favorite: "yes" }]),
      );
      const [entry] = loadEntries();
      expect(entry.mood).toBeNull();
      expect(entry.favorite).toBe(false);
      expect(entry.title).toBe("");
    });

    it("keeps valid moods", () => {
      localStorage.setItem(
        STORAGE_KEYS.entries,
        JSON.stringify([{ id: "1", date: "2026-01-01", mood: "happy" }]),
      );
      expect(loadEntries()[0].mood).toBe("happy");
    });

    it("de-duplicates by date (last write wins)", () => {
      localStorage.setItem(
        STORAGE_KEYS.entries,
        JSON.stringify([
          { id: "a", date: "2026-01-01", title: "first" },
          { id: "b", date: "2026-01-01", title: "second" },
        ]),
      );
      const entries = loadEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe("second");
    });

    it("round-trips through saveEntries", () => {
      const list = [createEntry("2026-01-01", { title: "Hi", content: "Hello", mood: "calm" })];
      expect(saveEntries(list)).toBe(true);
      expect(loadEntries()).toEqual(list);
    });
  });

  describe("settings", () => {
    it("returns defaults when nothing is stored", () => {
      expect(loadSettings()).toEqual({
        theme: "aurora",
        fontSize: "md",
        compact: false,
        autosaveMs: 1000,
        geminiApiKey: "",
      });
    });

    it("falls back per-field on invalid values", () => {
      saveSettings({
        theme: "neon" as never,
        fontSize: "xl" as never,
        compact: "yes" as never,
        autosaveMs: 10 as never,
        geminiApiKey: "AIza123",
      });
      expect(loadSettings()).toEqual({
        theme: "aurora",
        fontSize: "md",
        compact: false,
        autosaveMs: 1000,
        geminiApiKey: "AIza123",
      });
    });

    it("accepts every valid theme", () => {
      const themes: ThemeId[] = ["aurora", "ocean", "forest", "lavender", "sunset", "midnight"];
      for (const theme of themes) {
        saveSettings({
          theme,
          fontSize: "md",
          compact: false,
          autosaveMs: 1000,
          geminiApiKey: "",
        });
        expect(loadSettings().theme).toBe(theme);
      }
    });

    it("drops a non-string gemini key", () => {
      localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify({ theme: "aurora", fontSize: "md", compact: false, autosaveMs: 1000, geminiApiKey: 42 }),
      );
      expect(loadSettings().geminiApiKey).toBe("");
    });

    it("clearAllStorage removes both keys", () => {
      saveEntries([createEntry("2026-01-01")]);
      saveSettings({
        theme: "midnight",
        fontSize: "sm",
        compact: true,
        autosaveMs: 5000,
        geminiApiKey: "x",
      });
      clearAllStorage();
      expect(loadEntries()).toEqual([]);
      expect(loadSettings().theme).toBe("aurora");
    });
  });
});
