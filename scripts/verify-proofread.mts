/**
 * Zero-dependency smoke test for the AI proofreading contract.
 *
 *   node scripts/verify-proofread.mts
 *
 * It imports the real module (no mocks, no build step) and checks the pieces
 * the browser and the server route both depend on: the guard-rail prompt, the
 * SSE decoding and the output cleanup.
 */

import {
  MAX_PROOFREAD_CHARS,
  PROOFREAD_MODEL,
  PROOFREAD_SYSTEM_PROMPT,
  buildProofreadInput,
  cleanProofreadOutput,
  interactionEventError,
  isProofreadEvent,
  readProofreadSse,
  textFromInteractionEvent,
  type ProofreadEvent,
} from "../src/lib/ai/proofread.ts";

let passed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    passed += 1;
  } else {
    failures.push(`${name}\n      expected ${b}\n      actual   ${a}`);
  }
}

// ---- Prompt & input framing ------------------------------------------------

check("model", PROOFREAD_MODEL, "gemini-3.8-flash");
check("prompt forbids rewrites", PROOFREAD_SYSTEM_PROMPT.includes("Do not add new information"), true);
check("prompt asks for the correction only", PROOFREAD_SYSTEM_PROMPT.includes("Return only the corrected text"), true);
check("prompt caps at a sane length", MAX_PROOFREAD_CHARS > 1000, true);

const input = buildProofreadInput("Today was a good day");
check("input wraps the page in tags", input.includes("<text>\nToday was a good day\n</text>"), true);

// ---- Cleaning whatever the model hands back --------------------------------

check("strips a bare fence", cleanProofreadOutput("```\nToday was a good day.\n```"), "Today was a good day.");
check("strips a tagged fence", cleanProofreadOutput("```markdown\nFixed.\n```\n"), "Fixed.");
check("trims plain text", cleanProofreadOutput("  Fixed.  \n"), "Fixed.");
check(
  "keeps a code block that belongs to the page",
  cleanProofreadOutput("Run this:\n```\nnpm i\n```\nDone."),
  "Run this:\n```\nnpm i\n```\nDone.",
);

// ---- Decoding Gemini interaction events ------------------------------------

check(
  "reads a text delta",
  textFromInteractionEvent({ event_type: "step.delta", index: 0, delta: { type: "text", text: "Hel" } }),
  "Hel",
);
check("ignores non-text deltas", textFromInteractionEvent({ event_type: "step.delta", delta: { type: "thought_summary", text: "hm" } }), "");
check("ignores lifecycle events", textFromInteractionEvent({ event_type: "interaction.completed", interaction: { id: "x" } }), "");
check("ignores junk", [textFromInteractionEvent(null), textFromInteractionEvent("nope"), textFromInteractionEvent(undefined)], ["", "", ""]);
check(
  "surfaces a stream error",
  interactionEventError({ event_type: "error", error: { message: "API key not valid", code: "401" } }),
  "API key not valid (401)",
);
check("no error on a normal event", interactionEventError({ event_type: "step.start", step: {} }), null);

// ---- Wire format -----------------------------------------------------------

check("accepts a chunk frame", isProofreadEvent({ text: "hi" }), true);
check("accepts a done frame", isProofreadEvent({ done: true, text: "hi" }), true);
check("accepts an error frame", isProofreadEvent({ error: "boom" }), true);
check("rejects anything else", [isProofreadEvent({ nope: 1 }), isProofreadEvent(null), isProofreadEvent("x")], [false, false, false]);

/** Feed a list of byte chunks through the reader the hook uses. */
async function decode(chunks: string[]): Promise<ProofreadEvent[]> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  const events: ProofreadEvent[] = [];
  await readProofreadSse(stream, (event) => events.push(event));
  return events;
}

const oneFrame = await decode(['data: {"text":"Hello"}\n\n']);
check("decodes a whole frame", oneFrame, [{ text: "Hello" }]);

const splitFrame = await decode(['data: {"te', 'xt":"wor', 'ld"}\n\n']);
check("buffers a frame split across chunks", splitFrame, [{ text: "world" }]);

const crlf = await decode(['data: {"text":"a"}\r\n\r\ndata: {"done":true,"text":"a"}\r\n\r\n']);
check("tolerates CRLF separators", crlf, [{ text: "a" }, { done: true, text: "a" }]);

const messy = await decode([
  'event: ping\ndata: not-json\n\n',
  'data: {"text":"kept"}\n\n',
  'data: {"done":true,"text":"kept"}',
]);
check("skips malformed frames, keeps the rest", messy, [{ text: "kept" }, { done: true, text: "kept" }]);

const done = await decode(['data: {"text":"A"}\n\ndata: {"text":"B"}\n\ndata: {"done":true,"text":"AB"}\n\n']);
check("keeps chunk order", done, [{ text: "A" }, { text: "B" }, { done: true, text: "AB" }]);

// ---- Report ----------------------------------------------------------------

if (failures.length) {
  console.error(`✗ ${failures.length} of ${passed + failures.length} checks failed:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ ${passed} checks passed (proofread prompt, SSE decoding, output cleanup)`);
