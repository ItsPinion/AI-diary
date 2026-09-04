import type { DiaryEntry } from "@/types";
import { formatFull, isValidDateKey, todayKey } from "@/lib/dates";
import { MOODS, moodById } from "@/constants/moods";
import { createEntry } from "@/lib/storage";

/** Export builders — JSON, plain text and Markdown. */

export function entriesToJson(entries: DiaryEntry[]): string {
  const payload = {
    app: "inkwell",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  return JSON.stringify(payload, null, 2);
}

function divider(): string {
  return "· · · · · · · · · · · · · · · · · · · · · · · · · ·";
}

export function entriesToTxt(entries: DiaryEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return "Inkwell diary — no entries yet.\n";
  const blocks = sorted.map((entry) => {
    const lines: string[] = [];
    lines.push(formatFull(entry.date));
    const meta = entry.mood ? moodById(entry.mood) : null;
    const heading = [entry.title.trim(), meta ? `${meta.emoji} ${meta.label}` : null]
      .filter(Boolean)
      .join("  ·  ");
    if (heading) lines.push(heading);
    lines.push(divider());
    if (entry.content.trim()) lines.push(entry.content.trim());
    return lines.join("\n");
  });
  return `${divider()}\nInkwell diary · exported ${new Date().toLocaleString()}\n${divider()}\n\n${blocks.join(
    "\n\n\n",
  )}\n`;
}

export function entriesToMarkdown(entries: DiaryEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return "# Inkwell diary\n\nNo entries yet.\n";
  const blocks = sorted.map((entry) => {
    const lines: string[] = [];
    const meta = entry.mood ? moodById(entry.mood) : null;
    lines.push(entry.title.trim() ? `# ${entry.title.trim()}` : `# ${formatFull(entry.date)}`);
    lines.push("");
    lines.push(`*${formatFull(entry.date)}${meta ? ` · ${meta.emoji} ${meta.label}` : ""}${
      entry.favorite ? " · ⭐ favourite" : ""
    }*`);
    lines.push("");
    if (entry.content.trim()) lines.push(entry.content.trim());
    return lines.join("\n");
  });
  return blocks.join("\n\n---\n\n");
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * One-click full backup: a single lossless JSON file (every page, mood and
 * star) named with today's date. Returns the file name so callers can confirm
 * what was saved.
 */
export function downloadBackup(entries: DiaryEntry[]): string {
  const name = `inkwell-backup-${todayKey()}.json`;
  downloadFile(name, entriesToJson(entries), "application/json");
  return name;
}

/** Parse an imported file (JSON array or { entries: [...] }) into valid entries. */
export function parseImport(text: string): DiaryEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  let rawList: unknown[] | null = null;
  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (typeof parsed === "object" && parsed !== null) {
    const entries = (parsed as { entries?: unknown }).entries;
    if (Array.isArray(entries)) rawList = entries;
  }

  if (!rawList) {
    throw new Error("The file doesn't contain a list of entries.");
  }

  const entries: DiaryEntry[] = [];
  for (const raw of rawList) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.date !== "string" || !isValidDateKey(r.date)) continue;
    entries.push(
      createEntry(r.date, {
        title: typeof r.title === "string" ? r.title : "",
        content: typeof r.content === "string" ? r.content : "",
        mood:
          r.mood === null || r.mood === undefined
            ? null
            : typeof r.mood === "string" && MOODS.some((m) => m.id === r.mood)
              ? (r.mood as DiaryEntry["mood"])
              : null,
        favorite: r.favorite === true,
        createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
        updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
      }),
    );
  }

  if (entries.length === 0) {
    throw new Error("No valid entries were found in that file.");
  }

  // De-duplicate by date — imported page wins.
  const byDate = new Map<string, DiaryEntry>();
  for (const entry of entries) byDate.set(entry.date, entry);
  return [...byDate.values()];
}
