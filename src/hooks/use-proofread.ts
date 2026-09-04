"use client";

import * as React from "react";
import { useDiary } from "@/hooks/use-diary";
import { GEMINI_KEY_HEADER, readProofreadSse } from "@/lib/ai/proofread";

export type ProofreadStatus = "idle" | "streaming" | "done" | "error" | "cancelled";

export interface ProofreadApi {
  /** Where the request is in its life. */
  status: ProofreadStatus;
  /** The correction so far — it grows chunk by chunk while streaming. */
  draft: string;
  /** A message safe to show the writer. */
  error: string | null;
  /** Start a streamed correction of `text`. */
  start: (text: string) => Promise<void>;
  /** Stop early; whatever arrived stays available to apply. */
  stop: () => void;
  /** Close the panel and forget the result. */
  reset: () => void;
}

/**
 * Streams a corrected version of the page from `POST /api/proofread`.
 * The route holds the Gemini key; this hook only reads the SSE frames.
 */
export function useProofread(): ProofreadApi {
  const { settings } = useDiary();
  const apiKeyRef = React.useRef(settings.geminiApiKey);
  apiKeyRef.current = settings.geminiApiKey;

  const [status, setStatus] = React.useState<ProofreadStatus>("idle");
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Never leave a stream open when the editor goes away.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setDraft("");
    setError(null);
  }, []);

  const start = React.useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("streaming");
    setDraft("");
    setError(null);

    let received = "";
    let settled = false;

    try {
      const response = await fetch("/api/proofread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKeyRef.current ? { [GEMINI_KEY_HEADER]: apiKeyRef.current } : {}),
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = `Gemini couldn't help (HTTP ${response.status}).`;
        try {
          const parsed = (await response.json()) as { error?: unknown };
          if (typeof parsed.error === "string" && parsed.error) message = parsed.error;
        } catch {
          // A non-JSON error body is fine — keep the generic message.
        }
        throw new Error(message);
      }

      await readProofreadSse(response.body, (event) => {
        if ("error" in event) {
          settled = true;
          setError(event.error);
          setStatus("error");
          return;
        }
        if ("done" in event) {
          settled = true;
          setDraft(event.text);
          setStatus("done");
          return;
        }
        received += event.text;
        setDraft(received);
      });

      if (settled) return;
      // The stream closed without a final frame (proxy hiccup, timeout…).
      // Show what did arrive rather than throwing it away.
      if (received.trim()) {
        setDraft(received.trim());
        setStatus("done");
      } else {
        setError("The connection closed before Gemini finished. Try again.");
        setStatus("error");
      }
    } catch (thrown) {
      if (controller.signal.aborted) {
        // Stopped on purpose — keep the partial text, it may still be useful.
        setStatus((current) => (current === "streaming" ? "cancelled" : current));
        return;
      }
      setError(thrown instanceof Error ? thrown.message : "Something went wrong while talking to Gemini.");
      setStatus("error");
    }
  }, []);

  return { status, draft, error, start, stop, reset };
}
