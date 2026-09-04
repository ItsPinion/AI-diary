"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Loader2, Square, WandSparkles, X } from "lucide-react";
import type { ProofreadStatus } from "@/hooks/use-proofread";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

interface ProofreadPanelProps {
  status: ProofreadStatus;
  draft: string;
  error: string | null;
  /** Class list that matches the page's chosen type size. */
  textClass: string;
  onStop: () => void;
  onApply: () => void;
  /** Resolve with false when the clipboard was blocked. */
  onCopy: () => Promise<boolean>;
  onDismiss: () => void;
}

/**
 * Live view of Gemini's proofread while it streams in. Nothing is written
 * back to the page until the reader presses "Use this version".
 */
export function ProofreadPanel({
  status,
  draft,
  error,
  textClass,
  onStop,
  onApply,
  onCopy,
  onDismiss,
}: ProofreadPanelProps) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = React.useCallback(async () => {
    if (await onCopy()) setCopied(true);
  }, [onCopy]);

  const streaming = status === "streaming";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: EASE }}
      role="status"
      aria-live="polite"
      className="mt-6 rounded-2xl border border-accent/25 bg-background-secondary/70 p-4 shadow-soft sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          {streaming ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
          ) : (
            <WandSparkles className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          )}
          <span className="truncate">
            {streaming
              ? "Gemini is fixing your page…"
              : status === "done"
                ? "Corrected draft"
                : "Fixing didn't work"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {streaming ? (
            <Button size="sm" variant="ghost" onClick={onStop}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          ) : status === "done" ? (
            <>
              <Button size="sm" variant="soft" onClick={() => void handleCopy()}>
                <Copy className={cn("h-3.5 w-3.5", copied && "text-emerald-500")} />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={onApply}>
                Use this version
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss proofread">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {status === "error" ? (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      ) : (
        <div className="mt-3 max-h-64 overflow-y-auto pr-1">
          <p className={cn("whitespace-pre-wrap text-foreground/90", textClass)}>{draft}</p>
          {streaming && draft !== "" && (
            <span aria-hidden className="animate-pulse-soft text-accent">
              ▍
            </span>
          )}
        </div>
      )}

      {status === "done" && (
        <p className="mt-3 text-xs text-faint">
          Preview only — your page stays exactly as it is until you press “Use this version”.
        </p>
      )}
    </motion.div>
  );
}
