import { describe, expect, it } from "vitest";
import {
  computeStreaks,
  countWords,
  favoriteMood,
  heatmapDays,
  readingTimeMinutes,
} from "@/lib/stats";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { DiaryEntry } from "@/types";

function entry(date: string, patch?: Partial<DiaryEntry>): DiaryEntry {
  return {
    id: `id-${date}`,
    date,
    title: "",
    content: "",
    mood: null,
    favorite: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

describe("countWords / readingTimeMinutes", () => {
  it("counts nothing for empty or whitespace text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("splits on any whitespace", () => {
    expect(countWords("one two  three\nfour")).toBe(4);
  });

  it("estimates reading time at ~200 wpm, minimum one minute", () => {
    expect(readingTimeMinutes("")).toBe(0);
    expect(readingTimeMinutes("word ".repeat(100))).toBe(1);
    expect(readingTimeMinutes("word ".repeat(600))).toBe(3);
  });
});

describe("computeStreaks", () => {
  const today = todayKey();

  it("returns zeros with no entries", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });

  it("counts a streak ending today", () => {
    const entries = [0, -1, -2].map((n) => entry(addDaysToKey(today, n)));
    expect(computeStreaks(entries)).toEqual({ current: 3, longest: 3 });
  });

  it("still counts the streak when today is blank (ends yesterday)", () => {
    const entries = [-1, -2, -3].map((n) => entry(addDaysToKey(today, n)));
    expect(computeStreaks(entries).current).toBe(3);
  });

  it("breaks the current streak on a gap", () => {
    const entries = [0, -1, -3, -4].map((n) => entry(addDaysToKey(today, n)));
    const { current, longest } = computeStreaks(entries);
    expect(current).toBe(2);
    expect(longest).toBe(2);
  });

  it("tracks the longest streak separately from the current one", () => {
    const entries = [0, -5, -6, -7, -8].map((n) => entry(addDaysToKey(today, n)));
    const { current, longest } = computeStreaks(entries);
    expect(current).toBe(1);
    expect(longest).toBe(4);
  });

  it("ignores duplicate dates", () => {
    const entries = [
      entry(addDaysToKey(today, 0)),
      entry(addDaysToKey(today, 0), { id: "other" }),
      entry(addDaysToKey(today, -1)),
    ];
    expect(computeStreaks(entries)).toEqual({ current: 2, longest: 2 });
  });
});

describe("favoriteMood", () => {
  it("returns null when no mood is set", () => {
    expect(favoriteMood([entry("2026-01-01")])).toBeNull();
  });

  it("returns the most common mood", () => {
    const entries = [
      entry("2026-01-01", { mood: "happy" }),
      entry("2026-01-02", { mood: "happy" }),
      entry("2026-01-03", { mood: "sad" }),
    ];
    expect(favoriteMood(entries)).toBe("happy");
  });
});

describe("heatmapDays", () => {
  const today = todayKey();

  it("covers exactly the requested window, ending today", () => {
    const days = heatmapDays([], 30);
    expect(days).toHaveLength(30);
    expect(days[days.length - 1].date).toBe(today);
    expect(days[0].date).toBe(addDaysToKey(today, -29));
  });

  it("buckets words, counts and moods by day", () => {
    const days = heatmapDays(
      [
        entry(today, { content: "one two three", mood: "calm" }),
        entry(today, { content: "four five" }),
      ],
      7,
    );
    const todayBucket = days.find((d) => d.date === today)!;
    expect(todayBucket.count).toBe(2);
    expect(todayBucket.words).toBe(5);
    expect(todayBucket.mood).toBe("calm");
  });

  it("ignores entries outside the window", () => {
    const days = heatmapDays([entry(addDaysToKey(today, -400), { content: "old words" })], 365);
    expect(days.reduce((sum, d) => sum + d.words, 0)).toBe(0);
  });
});
