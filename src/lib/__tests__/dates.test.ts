import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  daysAgo,
  fromDateKey,
  isValidDateKey,
  relativeDayLabel,
  toDateKey,
  todayKey,
} from "@/lib/dates";

describe("date key validation", () => {
  it("accepts real dates", () => {
    expect(isValidDateKey("2026-09-04")).toBe(true);
    expect(isValidDateKey("2024-02-29")).toBe(true); // leap day
    expect(isValidDateKey(todayKey())).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2023-02-29")).toBe(false); // not a leap year
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("2026-00-10")).toBe(false);
  });

  it("rejects malformed strings", () => {
    for (const bad of ["", "2026/09/04", "2026-9-4", "abcd-ef-gh", "2026-09-04T00:00:00Z", "2026-09-4"]) {
      expect(isValidDateKey(bad)).toBe(false);
    }
  });
});

describe("toDateKey / fromDateKey", () => {
  it("round-trips a date", () => {
    const d = new Date(2026, 8, 4); // Sept 4 2026, local
    const key = toDateKey(d);
    expect(key).toBe("2026-09-04");
    expect(fromDateKey(key).getTime()).toBe(d.getTime());
  });

  it("pads month and day", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("addDaysToKey", () => {
  it("steps forward and backward across months", () => {
    expect(addDaysToKey("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysToKey("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("daysAgo / relativeDayLabel", () => {
  const today = todayKey();

  it("labels today, yesterday and tomorrow", () => {
    expect(relativeDayLabel(today)).toBe("Today");
    expect(relativeDayLabel(addDaysToKey(today, -1))).toBe("Yesterday");
    expect(relativeDayLabel(addDaysToKey(today, 1))).toBe("Tomorrow");
  });

  it("labels other days with the long date", () => {
    expect(relativeDayLabel(addDaysToKey(today, -3))).not.toBe("Today");
    expect(relativeDayLabel(addDaysToKey(today, -3))).not.toBe("Yesterday");
  });

  it("counts days before today positively", () => {
    expect(daysAgo(today)).toBe(0);
    expect(daysAgo(addDaysToKey(today, -2))).toBe(2);
  });
});
