import { GEMINI_KEY_HEADER, type KeyTestResult } from "@/lib/ai/proofread";


/**
 * Ask the server to prove a key works. Pass the key typed into Settings, or
 * nothing at all to test the server's own `GEMINI_API_KEY`.
 */
export async function testGeminiKey(apiKey?: string, signal?: AbortSignal): Promise<KeyTestResult> {
  const key = apiKey?.trim();
  try {
    const response = await fetch("/api/gemini/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { [GEMINI_KEY_HEADER]: key } : {}),
      },
      signal,
    });

    const parsed: unknown = await response.json().catch(() => null);
    if (parsed && typeof parsed === "object" && "ok" in parsed) {
      const result = parsed as Record<string, unknown>;
      if (result.ok === true && typeof result.model === "string") {
        return {
          ok: true,
          model: result.model,
          totalTokens: typeof result.totalTokens === "number" ? result.totalTokens : null,
          source: result.source === "browser" ? "browser" : "server",
          ms: typeof result.ms === "number" ? result.ms : 0,
        };
      }
      return {
        ok: false,
        error:
          typeof result.error === "string" && result.error
            ? result.error
            : `Gemini rejected the request (HTTP ${response.status}).`,
        source: null,
      };
    }
    return { ok: false, error: `The server replied with something unexpected (HTTP ${response.status}).`, source: null };
  } catch (error) {
    if (signal?.aborted) return { ok: false, error: "Test cancelled.", source: null };
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Couldn't reach the server to test the key.",
      source: null,
    };
  }
}
