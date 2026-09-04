import { describe, expect, it } from "vitest";
import { entryMatchesQuery, entryPreview, filterEntries } from "@/lib/search";
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

describe("entryMatchesQuery", () => {
  const julyPage = entry({ date: "2026-07-07", title: "Trip", content: "Went to the beach all day" });
  const janPage = entry({ date: "2026-01-13", title: "Cold day", content: "stayed inside" });

  it("matches the title case-insensitively", () => {
    expect(entryMatchesQuery(julyPage, "trip")).toBe(true);
    expect(entryMatchesQuery(julyPage, "TRIP")).toBe(true);
  });

  it("matches the content", () => {
    expect(entryMatchesQuery(julyPage, "beach")).toBe(true);
  });

  it("matches month names", () => {
    expect(entryMatchesQuery(julyPage, "july")).toBe(true);
    expect(entryMatchesQuery(janPage, "july")).toBe(false);
  });

  it("matches weekday names", () => {
    // 2026-07-07 is a Tuesday
    expect(entryMatchesQuery(julyPage, "tuesday")).toBe(true);
    expect(entryMatchesQuery(julyPage, "monday")).toBe(false);
  });

  it("matches the raw date key", () => {
    expect(entryMatchesQuery(julyPage, "2026-07-07")).toBe(true);
  });

  it("matches everything for a blank query", () => {
    expect(entryMatchesQuery(janPage, "")).toBe(true);
    expect(entryMatchesQuery(janPage, "   ")).toBe(true);
  });

  it("matches nothing when the query is absent from the page", () => {
    expect(entryMatchesQuery(janPage, "beach")).toBe(false);
  });
});

describe("filterEntries", () => {
  const entries = [
    entry({ date: "2026-07-07", title: "Beach", content: "sunny" }),
    entry({ date: "2026-01-13", title: "Snow", content: "cold" }),
  ];

  it("keeps only matching pages", () => {
    expect(filterEntries(entries, "sunny")).toHaveLength(1);
    expect(filterEntries(entries, "july")).toHaveLength(1);
    expect(filterEntries(entries, "zzz")).toHaveLength(0);
    expect(filterEntries(entries, "")).toHaveLength(2);
  });
});

describe("entryPreview", () => {
  it("prefers the title", () => {
    expect(entryPreview(entry({ date: "2026-01-01", title: "My title", content: "body text" }))).toBe(
      "My title",
    );
  });

  it("falls back to the first content line", () => {
    const e = entry({ date: "2026-01-01", content: "First line.\nSecond line." });
    expect(entryPreview(e)).toBe("First line.");
  });

  it("labels blank pages", () => {
    expect(entryPreview(entry({ date: "2026-01-01" }))).toBe("A blank page");
  });

  it("truncates long previews with an ellipsis", () => {
    const long = "x".repeat(200);
    const preview = entryPreview(entry({ date: "2026-01-01", content: long }), 40);
    expect(preview.length).toBeLessThanOrEqual(41);
    expect(preview.endsWith("…")).toBe(true);
  });
});
