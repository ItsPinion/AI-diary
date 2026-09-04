/**
 * Drives the real `POST /api/proofread` handler with a stubbed Gemini SDK, so
 * the streaming loop, the error mapping and the SSE frames the browser reads
 * are all executed for real (no live API key, no mocks inside app code).
 *
 *   node scripts/verify-route.mts
 */

import { register } from "node:module";
import { readProofreadSse, type ProofreadEvent } from "../src/lib/ai/proofread.ts";

register("./stub-hooks.mjs", import.meta.url);

const sandbox = globalThis as typeof globalThis & {
  __genAiOptions?: { apiKey?: string };
  __lastParams?: Record<string, unknown>;
  __lastCountTokens?: Record<string, unknown>;
  __fakeInteractionsCreate?: (params: Record<string, unknown>) => unknown;
  __fakeCountTokens?: (params: Record<string, unknown>) => unknown;
};

let passed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) passed += 1;
  else failures.push(`${name}\n      expected ${b}\n      actual   ${a}`);
}

const textEvent = (text: string) => ({ event_type: "step.delta", index: 0, delta: { type: "text", text } });

function eventStream(...events: unknown[]) {
  return (async function* () {
    for (const event of events) yield event;
  })();
}

const { POST } = await import("../src/app/api/proofread/route.ts");

function requestFor(body: unknown, init?: { headers?: Record<string, string>; signal?: AbortSignal }) {
  return new Request("http://localhost:3000/api/proofread", {
    method: "POST",
    headers: { "content-type": "application/json", ...init?.headers },
    body: JSON.stringify(body),
    signal: init?.signal,
  });
}

async function run(body: unknown, init?: { headers?: Record<string, string>; signal?: AbortSignal }) {
  const response = await POST(requestFor(body, init) as unknown as Parameters<typeof POST>[0]);
  const events: ProofreadEvent[] = [];
  if (response.body && response.headers.get("content-type")?.includes("text/event-stream")) {
    await readProofreadSse(response.body, (event) => events.push(event));
  }
  return { response, events };
}

// ---- Without a server key the route refuses before calling Gemini ----------

delete process.env.GEMINI_API_KEY;
sandbox.__fakeInteractionsCreate = () => eventStream(textEvent("should never happen"));
const noKey = await run({ text: "hello" });
check("no key → 503", noKey.response.status, 503);
check("no key → JSON, not a stream", noKey.response.headers.get("content-type"), "application/json");
check(
  "no key → explains itself",
  await noKey.response.json(),
  { error: "No Gemini key found. Add one in Settings, or set GEMINI_API_KEY on the server." },
);
check("no key → never calls the SDK", sandbox.__genAiOptions, undefined);

// ---- Happy path: chunks in, chunks out, then a cleaned final frame ---------

process.env.GEMINI_API_KEY = "env-key";
sandbox.__fakeInteractionsCreate = (params) => {
  sandbox.__lastParams = params;
  return eventStream(
    { event_type: "interaction.created", interaction: { id: "abc" } },
    textEvent("Today "),
    { event_type: "step.start", index: 0, step: {} },
    textEvent("I went to the store and bought milk."),
  );
};

const happy = await run({ text: "Today i went to teh store, and buyed milk." });

check("streams as SSE", happy.response.headers.get("content-type"), "text/event-stream; charset=utf-8");
check("forwards each text chunk", happy.events.slice(0, 2), [{ text: "Today " }, { text: "I went to the store and bought milk." }]);
check(
  "finishes with the whole correction",
  happy.events.at(-1),
  { done: true, text: "Today I went to the store and bought milk." },
);
check("uses the server key", sandbox.__genAiOptions?.apiKey, "env-key");
check("asks for a stream", sandbox.__lastParams?.stream, true);
check("uses the flash model", sandbox.__lastParams?.model, "gemini-3.8-flash");
check(
  "sends the guard rails as the system instruction",
  String(sandbox.__lastParams?.system_instruction).includes("Do not add new information"),
  true,
);
check(
  "sends the page as the input",
  String(sandbox.__lastParams?.input).includes("<text>\nToday i went to teh store, and buyed milk.\n</text>"),
  true,
);

// ---- A key from Settings takes precedence over the server's ----------------

sandbox.__genAiOptions = undefined;
sandbox.__fakeInteractionsCreate = () => eventStream(textEvent("Fixed."));
const ownKey = await run({ text: "Fixd." }, { headers: { "x-gemini-api-key": "browser-key" } });
check("uses the key from Settings", sandbox.__genAiOptions?.apiKey, "browser-key");
check("still streams a single chunk", ownKey.events, [{ text: "Fixed." }, { done: true, text: "Fixed." }]);

delete process.env.GEMINI_API_KEY;
sandbox.__genAiOptions = undefined;
sandbox.__fakeInteractionsCreate = () => eventStream(textEvent("Fixed."));
const onlyBrowserKey = await run({ text: "Fixd." }, { headers: { "x-gemini-api-key": "browser-key" } });
check("works with only a browser key", sandbox.__genAiOptions?.apiKey, "browser-key");
process.env.GEMINI_API_KEY = "env-key";

// ---- A fenced reply is unwrapped in the final frame ------------------------

sandbox.__fakeInteractionsCreate = () => eventStream(textEvent("```\n"), textEvent("All good.\n"), textEvent("```"));
const fenced = await run({ text: "all good" });
check("unwraps a fenced reply", fenced.events.at(-1), { done: true, text: "All good." });

// ---- Errors reported inside the stream -------------------------------------

sandbox.__fakeInteractionsCreate = () => eventStream(textEvent("Par"), { event_type: "error", error: { message: "Rate limit exceeded", code: "429" } });
const streamError = await run({ text: "partial" });
check("keeps what arrived before the error", streamError.events.at(0), { text: "Par" });
check("surfaces the in-stream error", streamError.events.at(-1), { error: "Rate limit exceeded (429)" });
check("sends no done frame after an error", streamError.events.some((e) => "done" in e), false);

// ---- Errors thrown by the SDK ----------------------------------------------

sandbox.__fakeInteractionsCreate = () => {
  throw Object.assign(new Error("API_KEY_INVALID"), { status: 401 });
};
const rejected = await run({ text: "hello" });
check("maps a 401 to advice", rejected.events, [{ error: "The server's Gemini key was rejected by Google." }]);

sandbox.__fakeInteractionsCreate = () => {
  throw Object.assign(new Error("quota"), { status: 429 });
};
const throttled = await run({ text: "hello" });
check("maps a 429 to advice", throttled.events, [{ error: "Gemini is rate-limiting this key. Give it a minute and try again." }]);

// ---- An empty reply is an error, not a silent success ----------------------

sandbox.__fakeInteractionsCreate = () => eventStream({ event_type: "step.start", index: 0, step: {} });
const empty = await run({ text: "hello" });
check("reports an empty reply", empty.events, [{ error: "Gemini came back empty-handed. Try again." }]);

// ---- Aborting stops before the final frame ---------------------------------

const controller = new AbortController();
sandbox.__fakeInteractionsCreate = () =>
  (async function* () {
    yield textEvent("Before the stop.");
    controller.abort();
    yield textEvent("After the stop.");
  })();
const aborted = await run({ text: "hello" }, { signal: controller.signal });
check("sends what arrived before the abort", aborted.events, [{ text: "Before the stop." }]);
check("sends nothing after the abort", aborted.events.some((e) => "done" in e || "error" in e), false);

// ===========================================================================
// POST /api/gemini/test — proves a key before the writer relies on it
// ===========================================================================

const { POST: TEST } = await import("../src/app/api/gemini/test/route.ts");

async function testKey(headers?: Record<string, string>) {
  const response = await TEST(
    new Request("http://localhost:3000/api/gemini/test", { method: "POST", headers }) as unknown as Parameters<
      typeof TEST
    >[0],
  );
  return (await response.json()) as Record<string, unknown>;
}

delete process.env.GEMINI_API_KEY;
const noKeyTest = await testKey();
check("test with no key at all", noKeyTest, {
  ok: false,
  error: "Add a key here first, or set GEMINI_API_KEY on the server.",
  source: null,
});

sandbox.__lastCountTokens = undefined;
sandbox.__fakeCountTokens = (params) => {
  sandbox.__lastCountTokens = params;
  return { totalTokens: 1 };
};
const goodBrowserKey = await testKey({ "x-gemini-api-key": "AIzaSyGood" });
check("a good key passes", goodBrowserKey.ok, true);
check("reports the model", goodBrowserKey.model, "gemini-3.8-flash");
check("reports the token count", goodBrowserKey.totalTokens, 1);
check("says the key came from Settings", goodBrowserKey.source, "browser");
check("measures the round trip", typeof goodBrowserKey.ms, "number");
check("used the key under test", sandbox.__genAiOptions?.apiKey, "AIzaSyGood");
check("pings the model for free", sandbox.__lastCountTokens, { model: "gemini-3.8-flash", contents: "ping" });

process.env.GEMINI_API_KEY = "env-key";
const goodServerKey = await testKey();
check("falls back to the server key", goodServerKey.source, "server");
check("and the server key passes", goodServerKey.ok, true);

sandbox.__fakeCountTokens = () => {
  throw Object.assign(new Error("API_KEY_INVALID"), { status: 400 });
};
const badKey = await testKey({ "x-gemini-api-key": "AIzaSyBogus" });
check("a rejected key fails cleanly", badKey.ok, false);
check("and says whose key it was", badKey, {
  ok: false,
  error: "That Gemini key isn't valid.",
  source: "browser",
});

sandbox.__fakeCountTokens = () => {
  throw Object.assign(new Error("Invalid JSON payload received"), { status: 400 });
};
const oddBadRequest = await testKey({ "x-gemini-api-key": "AIzaSyGood" });
check("a non-key 400 stays generic", oddBadRequest.error, "Gemini didn't understand that request.");

sandbox.__fakeCountTokens = () => {
  throw Object.assign(new Error("models/gemini-3.8-flash is not found"), { status: 404 });
};
const missingModel = await testKey({ "x-gemini-api-key": "AIzaSyGood" });
check("a missing model is named", missingModel.error, 'Gemini couldn\'t find the model "gemini-3.8-flash".');

sandbox.__fakeCountTokens = () => {
  throw Object.assign(new Error("API key not valid"), { status: 401 });
};
const rejectedKey = await testKey({ "x-gemini-api-key": "AIzaSyBogus" });
check("names the browser key in the error", rejectedKey.error, "That Gemini key was rejected by Google.");

const rejectedServerKey = await testKey();
check("names the server key in the error", rejectedServerKey.error, "The server's Gemini key was rejected by Google.");

sandbox.__fakeCountTokens = () => {
  throw new Error("Unable to make request: TypeError: fetch failed");
};
const offline = await testKey({ "x-gemini-api-key": "AIzaSyGood" });
check("a dead network is explained", offline.error, "Couldn't reach Gemini — this server has no route to Google's API.");

// ---- Report ----------------------------------------------------------------

if (failures.length) {
  console.error(`✗ ${failures.length} of ${passed + failures.length} checks failed:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ ${passed} checks passed (streaming route, key handling, key test, abort)`);
