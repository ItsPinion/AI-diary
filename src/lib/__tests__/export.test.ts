import { describe, expect, it } from "vitest";
import { entriesToMarkdown, entriesToTxt, entriesToJson, parseImport } from "@/lib/export";
import type { DiaryEntry } from "@/types";

function entry(patch: Partial<DiaryEntry> & Pick<DiaryEntry, "date">): DiaryEntry {
  return {
    id: `id-${patch.date}`,
    title: "",
    content: "",
    mood: null,
    favorite: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...patch,
  };
}

const sample: DiaryEntry[] = [
  entry({ date: "2026-07-04", title: "Trip", content: "Went to the coast.", mood: "happy", favorite: true }),
  entry({ date: "2026-01-02", content: "Quiet morning." }),
];

describe("entriesToJson", () => {
  it("wraps entries in the inkwell payload", () => {
    const payload = JSON.parse(entriesToJson(sample)) as {
      app: string;
      version: number;
      entries: DiaryEntry[];
    };
    expect(payload.app).toBe("inkwell");
    expect(payload.version).toBe(1);
    expect(payload.entries).toHaveLength(2);
    expect(payload.entries.some((e) => e.title === "Trip")).toBe(true);
  });
});

describe("entriesToMarkdown", () => {
  it("uses the title for the heading, the date when untitled", () => {
    const md = entriesToMarkdown(sample);
    expect(md).toContain("# Trip");
    expect(md).toContain("Went to the coast.");
    // The untitled page falls back to its long date as the heading.
    expect(md).toMatch(/^# Friday, 2 January 2026$/m);
  });

  it("marks favourites and moods", () => {
    const md = entriesToMarkdown(sample);
    expect(md).toContain("⭐ favourite");
    expect(md).toContain("😊 Happy");
  });

  it("separates pages with a rule", () => {
    expect(entriesToMarkdown(sample).split("\n---\n")).toHaveLength(2);
  });
});

describe("entriesToTxt", () => {
  it("sorts chronologically and labels moods", () => {
    const txt = entriesToTxt(sample);
    const quiet = txt.indexOf("Quiet morning.");
    const trip = txt.indexOf("Went to the coast.");
    expect(quiet).toBeGreaterThan(-1);
    expect(trip).toBeGreaterThan(quiet); // Jan comes before July
    expect(txt).toContain("😊 Happy");
  });
});

describe("parseImport", () => {
  it("rejects invalid JSON", () => {
    expect(() => parseImport("{nope")).toThrow(/valid JSON/i);
  });

  it("rejects payloads without an entry list", () => {
    expect(() => parseImport(JSON.stringify({ hello: "world" }))).toThrow(/list of entries/i);
  });

  it("accepts a bare array", () => {
    const entries = parseImport(JSON.stringify([{ date: "2026-01-01", title: "A" }]));
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("A");
  });

  it("accepts the { entries: [...] } export shape and round-trips", () => {
    const parsed = parseImport(entriesToJson(sample));
    expect(parsed).toHaveLength(2);
    expect(parsed.some((e) => e.mood === "happy" && e.favorite)).toBe(true);
  });

  it("drops entries with invalid dates and unknown moods", () => {
    const parsed = parseImport(
      JSON.stringify([
        { date: "2026-13-40", title: "bad date" },
        { date: "2026-01-01", title: "ok", mood: "ecstatic" },
      ]),
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].mood).toBeNull();
  });

  it("throws when nothing valid remains", () => {
    expect(() => parseImport(JSON.stringify([{ date: "nope" }]))).toThrow(/no valid entries/i);
  });

  it("de-duplicates by date (imported page wins)", () => {
    const parsed = parseImport(
      JSON.stringify([
        { date: "2026-01-01", title: "old" },
        { date: "2026-01-01", title: "new" },
      ]),
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("new");
  });
});
