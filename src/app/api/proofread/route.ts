import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import {
  GEMINI_KEY_HEADER,
  MAX_PROOFREAD_CHARS,
  PROOFREAD_MODEL,
  PROOFREAD_SYSTEM_PROMPT,
  buildProofreadInput,
  cleanProofreadOutput,
  describeGeminiFailure,
  interactionEventError,
  textFromInteractionEvent,
  type GeminiKeySource,
  type ProofreadEvent,
} from "@/lib/ai/proofread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status: number, error: string): Response {
  return Response.json({ error } satisfies ProofreadEvent, { status });
}

/**
 * POST /api/proofread
 *
 * Streams a corrected version of `{ text }` back as Server-Sent Events:
 *   data: {"text":"chunk"}        — as many as Gemini sends
 *   data: {"done":true,"text":"…"} — the full, cleaned correction
 *   data: {"error":"…"}           — if anything fails mid-stream
 *
 * The key comes from `GEMINI_API_KEY` on the server, or from the
 * `x-gemini-api-key` header when the writer pasted their own into Settings.
 * Either way it is used here and never echoed back.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let text: string;
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text : "";
  } catch {
    return json(400, "Send JSON like { \"text\": \"…\" }.");
  }

  if (!text.trim()) return json(400, "There's nothing to proofread yet.");
  if (text.length > MAX_PROOFREAD_CHARS) {
    return json(413, `That page is too long — ${MAX_PROOFREAD_CHARS.toLocaleString()} characters at most.`);
  }

  const browserKey = request.headers.get(GEMINI_KEY_HEADER)?.trim();
  const apiKey = browserKey || process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return json(503, "No Gemini key found. Add one in Settings, or set GEMINI_API_KEY on the server.");
  }
  const keySource: GeminiKeySource = browserKey ? "browser" : "server";

  const model = process.env.GEMINI_MODEL?.trim() || PROOFREAD_MODEL;
  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProofreadEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      let received = "";
      try {
        const events = await ai.interactions.create({
          model,
          input: buildProofreadInput(text),
          system_instruction: PROOFREAD_SYSTEM_PROMPT,
          stream: true,
        });

        for await (const event of events) {
          if (request.signal.aborted) break;
          const failure = interactionEventError(event);
          if (failure) throw new Error(failure);
          const chunk = textFromInteractionEvent(event);
          if (!chunk) continue;
          received += chunk;
          send({ text: chunk });
        }

        const cleaned = cleanProofreadOutput(received);
        if (!request.signal.aborted) {
          if (!cleaned) throw new Error("Gemini came back empty-handed. Try again.");
          send({ done: true, text: cleaned });
        }
      } catch (error) {
        if (!request.signal.aborted) send({ error: describeGeminiFailure(error, keySource) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Stop proxies (nginx, some CDNs) from buffering the stream.
      "X-Accel-Buffering": "no",
    },
  });
}
