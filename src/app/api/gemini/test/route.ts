import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import {
  GEMINI_KEY_HEADER,
  PROOFREAD_MODEL,
  describeGeminiFailure,
  type GeminiKeySource,
  type KeyTestFailure,
  type KeyTestSuccess,
} from "@/lib/ai/proofread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/gemini/test
 *
 * Proves a key actually works before the writer relies on it. Uses
 * `models.countTokens`, which is free and generates nothing: a bad key comes
 * back rejected, a good one comes back with a token count for the model the
 * proofreader will use.
 *
 * The key may come from the `x-gemini-api-key` header (typed into Settings) or
 * from the server's `GEMINI_API_KEY`. It is never logged or echoed back.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const browserKey = request.headers.get(GEMINI_KEY_HEADER)?.trim();
  const apiKey = browserKey || process.env.GEMINI_API_KEY?.trim();
  const source: GeminiKeySource | null = browserKey ? "browser" : apiKey ? "server" : null;

  if (!apiKey) {
    const body: KeyTestFailure = {
      ok: false,
      error: "Add a key here first, or set GEMINI_API_KEY on the server.",
      source: null,
    };
    return Response.json(body);
  }

  const model = process.env.GEMINI_MODEL?.trim() || PROOFREAD_MODEL;
  const started = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.countTokens({ model, contents: "ping" });
    const body: KeyTestSuccess = {
      ok: true,
      model,
      totalTokens: typeof result.totalTokens === "number" ? result.totalTokens : null,
      source: source ?? "server",
      ms: Date.now() - started,
    };
    return Response.json(body);
  } catch (error) {
    const body: KeyTestFailure = {
      ok: false,
      error: describeGeminiFailure(error, source ?? "server"),
      source,
    };
    return Response.json(body);
  }
}
