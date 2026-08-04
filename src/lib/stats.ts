import type { DiaryEntry, MoodId } from "@/types";
import { addDays, differenceInCalendarDays, fromDateKey, toDateKey } from "@/lib/dates";
import { MOODS } from "@/constants/moods";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function readingTimeMinutes(text: string): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

export interface StreakResult {
  current: number;
  longest: number;
}

/** Consecutive days with writing, ending today (or yesterday if today is still blank). */
export function computeStreaks(entries: DiaryEntry[]): StreakResult {
  if (entries.length === 0) return { current: 0, longest: 0 };

  const days = new Set(entries.map((e) => e.date));
  const sorted = [...days].sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev === null || differenceInCalendarDays(fromDateKey(day), fromDateKey(prev)) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = day;
  }

  let current = 0;
  let cursor = toDateKey(new Date());
  if (!days.has(cursor)) {
    cursor = toDateKey(addDays(new Date(), -1));
  }
  while (days.has(cursor)) {
    current += 1;
    cursor = toDateKey(addDays(fromDateKey(cursor), -1));
  }

  return { current, longest };
}

export function favoriteMood(entries: DiaryEntry[]): MoodId | null {
  const counts = new Map<MoodId, number>();
  for (const entry of entries) {
    if (entry.mood) counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  let best: MoodId | null = null;
  let bestCount = 0;
  for (const [mood, count] of counts) {
    if (count > bestCount) {
      best = mood;
      bestCount = count;
    }
  }
  return best;
}

export interface DayStat {
  date: string;
  words: number;
  count: number;
  mood: MoodId | null;
}

/** Buckets for a heatmap ending today (the most recent `days` days). */
export function heatmapDays(entries: DiaryEntry[], days: number): DayStat[] {
  const end = new Date();
  const start = addDays(end, -days + 1);
  const byDate = new Map<string, DayStat>();
  const list: DayStat[] = [];

  let cursor = start;
  while (cursor <= end) {
    const key = toDateKey(cursor);
    byDate.set(key, { date: key, words: 0, count: 0, mood: null });
    list.push(byDate.get(key)!);
    cursor = addDays(cursor, 1);
  }

  for (const entry of entries) {
    const bucket = byDate.get(entry.date);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.words += countWords(entry.content);
    bucket.mood = entry.mood ?? bucket.mood;
  }

  return list;
}

export interface MonthStat {
  key: string;
  label: string;
  words: number;
  count: number;
}

/** Per-month writing totals for the last `months` months. */
export function monthlyStats(entries: DiaryEntry[], months: number): MonthStat[] {
  const now = new Date();
  const stats: MonthStat[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    stats.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }), words: 0, count: 0 });
  }
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    const bucket = stats.find((s) => s.key === key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.words += countWords(entry.content);
  }
  return stats;
}

export function moodLabel(mood: MoodId | null): string {
  const meta = MOODS.find((m) => m.id === mood);
  return meta ? meta.label : "No mood";
}
