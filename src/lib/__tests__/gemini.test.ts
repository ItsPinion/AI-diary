import { describe, expect, it } from "vitest";
import {
  buildProofreadRequest,
  friendlyGeminiError,
  parseProofread,
  PROOFREAD_SYSTEM_PROMPT,
} from "@/lib/gemini";
import { GEMINI_PROOFREAD_MODEL } from "@/constants/gemini";

describe("buildProofreadRequest", () => {
  it("sends title + body with a strict reply format", () => {
    const req = buildProofreadRequest(
      "My  day at the parkk",
      "I went to the park yesterday.\nIt was fun.",
    );
    expect(req.hadTitle).toBe(true);
    expect(req.hadContent).toBe(true);
    expect(req.prompt).toContain("TITLE:\nMy  day at the parkk");
    expect(req.prompt).toContain("BODY:\nI went to the park yesterday.");
    expect(req.prompt).toContain("Title: <corrected title>");
  });

  it("sends body only when the title is blank", () => {
    const req = buildProofreadRequest("   ", "This is so cool, im so happyy.");
    expect(req.hadTitle).toBe(false);
    expect(req.hadContent).toBe(true);
    expect(req.prompt).not.toContain("TITLE:");
    expect(req.prompt).toContain("im so happyy");
  });

  it("asks for a title-only fix when the body is blank", () => {
    const req = buildProofreadRequest("  Birthday  party ", "   ");
    expect(req.hadTitle).toBe(true);
    expect(req.hadContent).toBe(false);
    expect(req.prompt).toContain("TITLE:\nBirthday  party"); // trimmed, inner spaces kept
    expect(req.prompt).not.toContain("BODY:");
  });
});

describe("parseProofread", () => {
  const both = { hadTitle: true, hadContent: true };

  it("splits a well-formed title + body reply", () => {
    const out = parseProofread(
      "Title: My day at the park\n\nI went to the park yesterday.\nIt was a fun day, and my friends and I played.",
      both,
    );
    expect(out.title).toBe("My day at the park");
    expect(out.content).toBe(
      "I went to the park yesterday.\nIt was a fun day, and my friends and I played.",
    );
  });

  it("splits when the model dropped the 'Title:' label but kept the line break", () => {
    const out = parseProofread("My day at the park\n\nFixed body here.", both);
    expect(out.title).toBe("My day at the park");
    expect(out.content).toBe("Fixed body here.");
  });

  it("falls back to body-only when the model returned one blob", () => {
    const out = parseProofread(
      "My day at the park. I went to the park yesterday. It was fun.",
      both,
    );
    expect(out.title).toBe("");
    expect(out.content).toContain("went to the park");
  });

  it("treats a huge 'first line' as an ignored format, not a title", () => {
    const huge = "x".repeat(500);
    const out = parseProofread(`${huge}\n\nbody`, both);
    expect(out.title).toBe("");
    expect(out.content).toContain(huge);
  });

  it("parses a title-only reply", () => {
    const out = parseProofread("Title: Birthday party", { hadTitle: true, hadContent: false });
    expect(out.title).toBe("Birthday party");
    expect(out.content).toBe("");
  });

  it("parses a body-only reply", () => {
    const out = parseProofread("This is so cool, I'm so happy.", {
      hadTitle: false,
      hadContent: true,
    });
    expect(out.title).toBe("");
    expect(out.content).toBe("This is so cool, I'm so happy.");
  });

  it("strips a wrapping code fence before parsing", () => {
    const out = parseProofread("```markdown\nTitle: My day\n\nFixed body.\n```", both);
    expect(out.title).toBe("My day");
    expect(out.content).toBe("Fixed body.");
  });

  it("preserves multi-line body content and trailing whitespace trimming", () => {
    const out = parseProofread("Title: T\n\nLine one.\nLine two.\n\n\n", both);
    expect(out.title).toBe("T");
    expect(out.content).toBe("Line one.\nLine two.");
  });
});

describe("friendlyGeminiError", () => {
  it("maps auth failures to a key-check hint", () => {
    for (const status of [400, 401, 403]) {
      expect(friendlyGeminiError(Object.assign(new Error("nope"), { status }))).toContain(
        "API key",
      );
    }
  });

  it("maps 404 to an availability message naming the model", () => {
    const msg = friendlyGeminiError(Object.assign(new Error("nope"), { status: 404 }));
    expect(msg).toContain(GEMINI_PROOFREAD_MODEL);
  });

  it("maps 429 to a rate-limit message", () => {
    expect(friendlyGeminiError(Object.assign(new Error("nope"), { status: 429 }))).toContain(
      "rate limit",
    );
  });

  it("maps 5xx to a try-later message", () => {
    expect(friendlyGeminiError(Object.assign(new Error("nope"), { status: 503 }))).toContain(
      "Try again",
    );
  });

  it("maps network failures to a connection message", () => {
    expect(friendlyGeminiError(new TypeError("fetch failed"))).toContain("internet connection");
  });

  it("passes through unknown error messages", () => {
    expect(friendlyGeminiError(new Error("something odd happened"))).toBe("something odd happened");
  });

  it("handles non-Error values", () => {
    expect(friendlyGeminiError("plain string")).toContain("Gemini");
  });
});

describe("PROOFREAD_SYSTEM_PROMPT", () => {
  it("keeps the core guardrails intact", () => {
    expect(PROOFREAD_SYSTEM_PROMPT).toContain("Preserve the original meaning, intent, and tone");
    expect(PROOFREAD_SYSTEM_PROMPT).toContain("Do not add new information");
    expect(PROOFREAD_SYSTEM_PROMPT).toContain("Return the corrected version as the primary output");
  });
});
