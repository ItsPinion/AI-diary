/**
 * Shared contract for the AI proofreading feature.
 *
 * The guard-rail prompt, the stream wire format and the decoding helpers live
 * here so the server route (which owns the API key) and the browser (which
 * renders the stream) can never drift apart.
 */

/** Model used for proofreading. Override server-side with `GEMINI_MODEL`. */
export const PROOFREAD_MODEL = "gemini-3.8-flash";

/**
 * Guard rails: fix what is broken, leave everything else alone.
 * Sent as the system instruction on every request.
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

Return only the corrected text. No preamble, no commentary, no markdown code fences.

Your goal is to make the text grammatically correct, properly punctuated, structurally sound, natural, and easy to read while keeping it faithful to the original.`;

/** Refuse absurd payloads before they reach the API (and your bill). */
export const MAX_PROOFREAD_CHARS = 30_000;

/**
 * Header the browser uses to lend the route a key typed into Settings. The
 * server's own `GEMINI_API_KEY` always takes precedence.
 */
export const GEMINI_KEY_HEADER = "x-gemini-api-key";

/** Where the key that served a request came from. */
export type GeminiKeySource = "browser" | "server";

/** A key that Google accepted. */
export interface KeyTestSuccess {
  ok: true;
  /** Which model answered. */
  model: string;
  /** Tokens Google counted for the ping — proof the model accepted input. */
  totalTokens: number | null;
  /** Whether the key came from Settings or from the server environment. */
  source: GeminiKeySource;
  ms: number;
}

/** A key that didn't work, with a message safe to show. */
export interface KeyTestFailure {
  ok: false;
  error: string;
  source: GeminiKeySource | null;
}

export type KeyTestResult = KeyTestSuccess | KeyTestFailure;

/** Turn a thrown SDK/network failure into something a writer can act on. */
export function describeGeminiFailure(error: unknown, source: GeminiKeySource): string {
  if (!(error instanceof Error)) return "Something went wrong while talking to Gemini.";
  const status = (error as Error & { status?: number }).status;
  const keyLabel = source === "browser" ? "That Gemini key" : "The server's Gemini key";
  if (status === 400) {
    // Gemini reports an unusable key as a 400 with a code like API_KEY_INVALID.
    return /api.?key/i.test(error.message) ? `${keyLabel} isn't valid.` : "Gemini didn't understand that request.";
  }
  if (status === 401 || status === 403) return `${keyLabel} was rejected by Google.`;
  if (status === 404) return `Gemini couldn't find the model "${PROOFREAD_MODEL}".`;
  if (status === 429) return "Gemini is rate-limiting this key. Give it a minute and try again.";
  if (status && status >= 500) return "Gemini is having trouble right now. Try again in a moment.";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(error.message)) {
    return "Couldn't reach Gemini — this server has no route to Google's API.";
  }
  if (/abort/i.test(error.message)) return "The request was cancelled.";
  return error.message || "Something went wrong while talking to Gemini.";
}

/** Wrap the page in delimiters so the model can't mistake it for instructions. */
export function buildProofreadInput(text: string): string {
  return [
    "Proofread and correct the text between the <text> tags. Reply with the corrected text only.",
    "",
    "<text>",
    text,
    "</text>",
  ].join("\n");
}

/**
 * Strip the markdown fence the model sometimes wraps its answer in.
 * Only a fence that spans the *whole* reply is removed, so a diary page that
 * legitimately contains code keeps its own blocks.
 */
export function cleanProofreadOutput(raw: string): string {
  const trimmed = raw.trim();
  const fence = /^```[a-zA-Z0-9_+-]*\s*\n([\s\S]*?)\n?```\s*$/;
  const match = fence.exec(trimmed);
  return (match ? match[1] : trimmed).trim();
}

// ---- Gemini `interactions` SSE events (server side) ------------------------

/** Pull the text chunk out of a streamed interaction event, if it carries one. */
export function textFromInteractionEvent(event: unknown): string {
  if (typeof event !== "object" || event === null) return "";
  const shape = event as { event_type?: unknown; delta?: unknown };
  if (shape.event_type !== "step.delta") return "";
  const delta = shape.delta as { type?: unknown; text?: unknown } | undefined;
  if (typeof delta !== "object" || delta === null) return "";
  if (delta.type !== "text" || typeof delta.text !== "string") return "";
  return delta.text;
}

/** Surface a failure reported inside the stream instead of ending silently. */
export function interactionEventError(event: unknown): string | null {
  if (typeof event !== "object" || event === null) return null;
  const shape = event as { event_type?: unknown; error?: unknown };
  if (shape.event_type !== "error") return null;
  const error = shape.error as { message?: unknown; code?: unknown } | undefined;
  const message = typeof error?.message === "string" && error.message ? error.message : "Gemini stopped the request.";
  const code = typeof error?.code === "string" && error.code ? ` (${error.code})` : "";
  return `${message}${code}`;
}

// ---- Wire format between the route and the browser -------------------------

/** An incremental chunk of the correction. */
export interface ProofreadChunk {
  text: string;
}
/** Stream finished; `text` is the full, cleaned correction. */
export interface ProofreadDone {
  done: true;
  text: string;
}
/** Stream failed; `error` is safe to show the writer. */
export interface ProofreadError {
  error: string;
}

export type ProofreadEvent = ProofreadChunk | ProofreadDone | ProofreadError;

export function isProofreadEvent(value: unknown): value is ProofreadEvent {
  if (typeof value !== "object" || value === null) return false;
  const shape = value as Record<string, unknown>;
  return typeof shape.text === "string" || shape.done === true || typeof shape.error === "string";
}

/**
 * Read an SSE body (`data: {...}` frames separated by a blank line) and hand
 * each decoded event to `onEvent`. Chunk boundaries that split a frame in half
 * are buffered, and a malformed frame is skipped rather than fatal.
 */
export async function readProofreadSse(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ProofreadEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleFrame = (frame: string) => {
    const payload = frame
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!payload || payload === "[DONE]") return;
    try {
      const parsed: unknown = JSON.parse(payload);
      if (isProofreadEvent(parsed)) onEvent(parsed);
    } catch {
      // A broken frame must never take the editor down with it.
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        handleFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
    }
    buffer += decoder.decode().replace(/\r\n/g, "\n");
    if (buffer.trim()) handleFrame(buffer);
  } finally {
    reader.releaseLock();
  }
}
