"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Loader2, RotateCcw, Square, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { ProofreadStatus } from "@/hooks/use-proofread";

interface ProofreadPanelProps {
  status: ProofreadStatus;
  /** The correction, growing chunk by chunk while streaming. */
  draft: string;
  error: string | null;
  /** True when the model handed back the page unchanged. */
  unchanged: boolean;
  onApply: () => void;
  onStop: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

const HEADINGS: Record<ProofreadStatus, string> = {
  idle: "Proofread suggestion",
  streaming: "Gemini is proofreading…",
  done: "Proofread suggestion",
  cancelled: "Stopped early",
  error: "Couldn't proofread",
};

/**
 * Streams a suggested correction under the page. Nothing is applied until the
 * writer accepts it, so an over-eager model can never damage a page.
 */
export function ProofreadPanel({
  status,
  draft,
  error,
  unchanged,
  onApply,
  onStop,
  onRetry,
  onDismiss,
}: ProofreadPanelProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);

  // Long pages push the panel below the fold — nudge it into view once.
  React.useEffect(() => {
    panelRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  // Follow the text as it arrives.
  React.useEffect(() => {
    if (status !== "streaming") return;
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [draft, status]);

  const streaming = status === "streaming";
  const failed = status === "error";
  const canApply = !streaming && !failed && draft.trim().length > 0 && !unchanged;

  return (
    <motion.section
      ref={panelRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: EASE }}
      aria-label="AI proofreading suggestion"
      className={cn(
        "mt-6 overflow-hidden rounded-2xl border shadow-soft",
        failed ? "border-red-500/25 bg-red-500/5" : "border-accent/25 bg-accent/6",
      )}
    >
      <header className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", failed ? "bg-red-500/10 text-red-500" : "bg-accent/12 text-accent")}>
          {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
        </span>
        <h3 className="text-xs font-semibold text-foreground">{HEADINGS[status]}</h3>
        <span role="status" aria-live="polite" className="text-[11px] text-faint">
          {streaming ? "streaming" : failed ? "failed" : status === "cancelled" ? "partial" : draft.trim() ? "ready" : ""}
        </span>
        {streaming && (
          <Button variant="ghost" size="icon-sm" onClick={onStop} aria-label="Stop proofreading" className="ml-auto">
            <Square className="h-3.5 w-3.5" />
          </Button>
        )}
        {!streaming && (
          <Button variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Dismiss suggestion" className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </header>

      <div
        ref={bodyRef}
        className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 text-[0.98rem] leading-7 text-foreground"
      >
        {failed ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Something went wrong."}</p>
        ) : draft ? (
          <>
            {draft}
            {streaming && <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse-soft bg-accent" />}
          </>
        ) : (
          <p className="animate-pulse-soft text-sm italic text-faint">Reading your page…</p>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-2.5">
        {unchanged && !streaming && !failed ? (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> Looks good — nothing needed fixing.
          </p>
        ) : (
          <>
            <Button size="sm" onClick={onApply} disabled={!canApply}>
              <Check className="h-3.5 w-3.5" />
              Use this version
            </Button>
            {streaming && <span className="animate-pulse-soft text-[11px] text-faint">still writing…</span>}
            {status === "cancelled" && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" /> Run again
              </Button>
            )}
            {failed && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" /> Try again
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Keep mine
            </Button>
          </>
        )}
      </footer>
    </motion.section>
  );
}
