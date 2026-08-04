import type { DiaryEntry } from "@/types";
import { formatDayShort, formatFull, formatLong } from "@/lib/dates";

/** Case-insensitive search across title, content and the human date. */
export function entryMatchesQuery(entry: DiaryEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entry.title.toLowerCase().includes(q)) return true;
  if (entry.content.toLowerCase().includes(q)) return true;
  const haystack = [formatFull(entry.date), formatLong(entry.date), formatDayShort(entry.date), entry.date]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterEntries(entries: DiaryEntry[], query: string): DiaryEntry[] {
  return entries.filter((entry) => entryMatchesQuery(entry, query));
}

/** First meaningful line of an entry, trimmed for previews. */
export function entryPreview(entry: DiaryEntry, maxChars = 120): string {
  const source = entry.content.trim();
  const firstLine = source.split("\n")[0] ?? "";
  const text = entry.title.trim() ? entry.title.trim() : firstLine || "A blank page";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}
