import { describe, expect, it } from "vitest";
import { uid } from "@/lib/id";

describe("uid", () => {
  it("produces unique values", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(uid());
    expect(seen.size).toBe(1000);
  });

  it("returns a uuid shape when crypto.randomUUID is available", () => {
    expect(uid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
