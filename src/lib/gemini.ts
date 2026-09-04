import { GEMINI_PROOFREAD_MODEL } from "@/constants/gemini";

/**
 * The guardrails Gemini follows while proofreading. It must stay faithful to
 * the author's words — fixing errors, never rewriting ideas.
 */
export const PROOFREAD_SYSTEM_PROMPT = `You will be given a piece of text. Your task is to proofread and correct it thoroughly.

Correct all errors that negatively affect the clarity, correctness, or professional quality of the text, including:

- Spelling mistakes
- Grammar mistakes
- Punctuation mistakes
- Tense and verb-form errors
- Sentence structure problems
- Incorrect word usage
- Subject–verb agreement
- Articles, prepositions, and pronouns
- Awkward or unclear phrasing
- Capitalization errors
- Formatting and structural inconsistencies
- Repetition or unnecessarily confusing wording

Important rules:

1. Preserve the original meaning, intent, and tone of the text.
2. Do not add new information or change the author's ideas.
3. Do not unnecessarily rewrite sentences that are already correct.
4. Improve readability where necessary, but do not make the writing sound artificially sophisticated.
5. If the original text is informal, keep it reasonably informal. If it is formal, maintain a formal tone.
6. Preserve technical terms, names, terminology, code, commands, file paths, URLs, and other content that should not be modified.
7. Fix structural problems only when they genuinely improve the organization or readability of the text.
8. Do not explain every correction unless explicitly asked.
9. Return the corrected version as the primary output.

Your goal is to make the text grammatically correct, properly punctuated, structurally sound, natural, and easy to read while keeping it faithful to the original.`;

export interface ProofreadRequestShape {
  prompt: string;
  hadTitle: boolean;
  hadContent: boolean;
}

/**
 * Build the user message sent to Gemini. When a title exists it is included
 * so it gets fixed too, with a strict reply format the parser below can rely on.
 */
export function buildProofreadRequest(title: string, content: string): ProofreadRequestShape {
  const t = title.trim();
  const c = content;
  if (t === "") {
    return {
      prompt:
        "Fix this page of a personal diary. Return ONLY the corrected body text — no commentary, no quotes, no markdown, no labels.\n\n" +
        c,
      hadTitle: false,
      hadContent: true,
    };
  }
  if (c.trim() === "") {
    return {
      prompt:
        "Fix the title of a personal diary page. Return ONLY the corrected title — no commentary, no quotes, no labels, nothing else.\n\n" +
        `TITLE:\n${t}`,
      hadTitle: true,
      hadContent: false,
    };
  }
  return {
    prompt:
      "Fix this page of a personal diary. It has a title and a body.\n\n" +
      `TITLE:\n${t}\n\n` +
      `BODY:\n${c}\n\n` +
      "Return ONLY the corrected page in this exact format — no commentary, no quotes, no markdown:\n" +
      "Title: <corrected title>\n" +
      "<one blank line>\n" +
      "<corrected body>",
    hadTitle: true,
    hadContent: true,
  };
}

/**
 * Models sometimes wrap their reply in a code fence despite being told not
 * to. Strip one enclosing fence if present; leave everything else untouched.
 */
function stripCodeFence(text: string): string {
  const t = text.trim();
  const match = t.match(/^```[a-zA-Z]*\n([\s\S]*)\n?```$/);
  return match ? match[1].trim() : t;
}

/**
 * Split Gemini's reply back into title + body. Lenient: if the model ignored
 * the requested format, the whole reply is treated as the body and the title
 * is left untouched (returned as "").
 */
export function parseProofread(
  draft: string,
  shape: Pick<ProofreadRequestShape, "hadTitle" | "hadContent">,
): { title: string; content: string } {
  const text = stripCodeFence(draft).trim();
  if (!shape.hadTitle) return { title: "", content: text };
  if (!shape.hadContent) return { title: text.replace(/^title:\s*/i, "").trim(), content: "" };
  let body = text;
  if (/^title:\s*/i.test(body)) body = body.replace(/^title:\s*/i, "");
  const nl = body.indexOf("\n");
  if (nl !== -1) {
    const t = body.slice(0, nl).trim();
    const rest = body.slice(nl + 1).replace(/^\n/, "").trimEnd();
    // A title is short; if the "first line" is huge the format was ignored.
    if (t.length > 0 && t.length <= 200) return { title: t, content: rest };
  }
  return { title: "", content: text };
}

/**
 * Stream a proofread of `prompt` from Gemini, yielding text deltas as they
 * arrive. The SDK is imported lazily so the bundle — and the offline app —
 * stay untouched until this is actually used.
 */
export async function* streamProofread(
  apiKey: string,
  prompt: string,
  abortSignal: AbortSignal,
): AsyncGenerator<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const stream = await ai.models.generateContentStream({
    model: GEMINI_PROOFREAD_MODEL,
    contents: prompt,
    config: {
      systemInstruction: PROOFREAD_SYSTEM_PROMPT,
      temperature: 0.2,
      abortSignal,
    },
  });
  for await (const chunk of stream) {
    const delta = chunk.text;
    if (delta) yield delta;
  }
}

/** Turn SDK/network failures into a short, human sentence for the UI. */
export function friendlyGeminiError(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    if (status === 400 || status === 401 || status === 403) {
      return "Gemini rejected that API key. Check it in Settings.";
    }
    if (status === 404) {
      return `That model (${GEMINI_PROOFREAD_MODEL}) isn't available for your key.`;
    }
    if (status === 429) {
      return "You've hit Gemini's rate limit — give it a moment and try again.";
    }
    if (status !== undefined && status >= 500) {
      return "Gemini is having trouble right now. Try again shortly.";
    }
    if (/fetch|network|timeout/i.test(error.message)) {
      return "Couldn't reach Gemini. Check your internet connection.";
    }
    return error.message;
  }
  return "Something went wrong while contacting Gemini.";
}
