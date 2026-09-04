"use client";

import * as React from "react";
import { friendlyGeminiError, streamProofread } from "@/lib/gemini";

export type ProofreadStatus = "idle" | "streaming" | "done" | "error";

export interface UseProofread {
  status: ProofreadStatus;
  /** Corrected text accumulated so far (complete when status === "done"). */
  draft: string;
  error: string | null;
  /** Begin (or restart) proofreading `prompt` with the given key. */
  start: (apiKey: string, prompt: string) => void;
  /** Cancel the in-flight stream; keep a partial draft if any arrived. */
  stop: () => void;
  /** Close the panel and release the stream. */
  reset: () => void;
}

export function useProofread(): UseProofread {
  const [status, setStatus] = React.useState<ProofreadStatus>("idle");
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const draftRef = React.useRef(draft);
  React.useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const start = React.useCallback((apiKey: string, prompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setDraft("");
    setError(null);
    setStatus("streaming");

    void (async () => {
      let acc = "";
      try {
        for await (const delta of streamProofread(apiKey, prompt, controller.signal)) {
          acc += delta;
          setDraft(acc);
        }
        if (acc.trim() === "") {
          throw new Error("Gemini returned an empty response.");
        }
        setStatus("done");
      } catch (err) {
        if (controller.signal.aborted) return; // cancelled on purpose
        setStatus("error");
        setError(friendlyGeminiError(err));
      }
    })();
  }, []);

  const stop = React.useCallback(() => {
    const controller = abortRef.current;
    if (!controller) return;
    controller.abort();
    // Keep a partial draft for review; drop the panel if nothing arrived.
    setStatus(draftRef.current.trim() === "" ? "idle" : "done");
  }, []);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setDraft("");
    setError(null);
  }, []);

  // Release the stream if the editor unmounts mid-flight.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  return { status, draft, error, start, stop, reset };
}
