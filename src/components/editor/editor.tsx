"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Clock,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useProofread } from "@/hooks/use-proofread";
import { useToast } from "@/components/ui/toast";
import { MoodPicker } from "@/components/editor/mood-picker";
import { ProofreadPanel } from "@/components/editor/proofread-panel";
import { WRITING_PROMPTS } from "@/components/editor/prompts";
import { Button } from "@/components/ui/button";
import { moodById } from "@/constants/moods";
import { FavoriteButton } from "@/components/cards/entry-card";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { bus } from "@/lib/bus";
import { formatDayLong, formatLong } from "@/lib/dates";
import { countWords, readingTimeMinutes } from "@/lib/stats";
import { fontSizeClasses } from "@/constants/settings";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export function EditorView() {
  const { entries, selectedDate, today, settings, updateEntry, deleteEntry, setMood, toggleFavorite, aiEnabled } = useDiary();
  const { toast } = useToast();
  const proofread = useProofread();

  const entry = React.useMemo(
    () => entries.find((e) => e.date === selectedDate),
    [entries, selectedDate],
  );

  const [title, setTitle] = React.useState(entry?.title ?? "");
  const [content, setContent] = React.useState(entry?.content ?? "");
  const dirtyRef = React.useRef(false);
  const [dirty, setDirty] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [promptIndex, setPromptIndex] = React.useState(0);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);

  const isCurrentDay = selectedDate === today;

  // Refs mirror the latest buffer so effects can flush without stale closures.
  const titleBufferRef = React.useRef(title);
  const contentBufferRef = React.useRef(content);
  const prevDateRef = React.useRef(selectedDate);
  React.useEffect(() => {
    titleBufferRef.current = title;
  }, [title]);
  React.useEffect(() => {
    contentBufferRef.current = content;
  }, [content]);

  const flush = React.useCallback(() => {
    if (!dirtyRef.current) return;
    updateEntry(selectedDate, { title, content });
    dirtyRef.current = false;
    setDirty(false);
    setSavedAt(Date.now());
  }, [updateEntry, selectedDate, title, content]);

  const flushRef = React.useRef(flush);
  flushRef.current = flush;

  // Keep the local buffer in sync with the store (selection changes, imports…).
  // Before switching pages, anything still unsaved is committed to its own page.
  React.useEffect(() => {
    if (prevDateRef.current !== selectedDate && dirtyRef.current) {
      updateEntry(prevDateRef.current, { title: titleBufferRef.current, content: contentBufferRef.current });
    }
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    dirtyRef.current = false;
    setDirty(false);
    prevDateRef.current = selectedDate;
  }, [selectedDate, entry?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave on the chosen cadence (after the latest keystroke).
  React.useEffect(() => {
    const id = window.setInterval(() => flushRef.current(), settings.autosaveMs);
    return () => window.clearInterval(id);
  }, [settings.autosaveMs, selectedDate]);

  // Save when the page hides or closes; final flush happens on unmount only,
  // so switching pages never writes one page's words into another.
  React.useEffect(() => {
    const flushNow = () => flushRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flushNow();
      window.removeEventListener("beforeunload", flushNow);
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ⌘/Ctrl + S → save now.
  React.useEffect(() => {
    return bus.on("save", () => {
      flushRef.current();
    });
  }, []);

  // Auto-resize the textarea as the writing grows.
  const resize = React.useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  }, []);

  React.useEffect(() => {
    resize();
  }, [content, resize]);

  // Rotate the blank-page prompt.
  React.useEffect(() => {
    if (content.trim()) return;
    const id = window.setInterval(() => {
      setPromptIndex((i) => (i + 1) % WRITING_PROMPTS.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [content]);

  const words = countWords(content);
  const minutes = readingTimeMinutes(content);
  const mood = entry?.mood ?? null;
  const moodColor = mood ? moodById(mood)?.color : undefined;
  const favorite = entry?.favorite ?? false;
  const blank = !title.trim() && !content.trim();

  const handleDelete = () => {
    deleteEntry(selectedDate);
    setTitle("");
    setContent("");
    dirtyRef.current = false;
    setDirty(false);
    setConfirmDelete(false);
    toast({ title: "Page deleted", description: "It's gone from this device.", variant: "info" });
  };

  // ---- AI proofreading -------------------------------------------------
  // The suggestion streams into a panel; nothing touches the page until the
  // writer accepts it, and the original stays on screen the whole time.
  const proofreadBusy = proofread.status === "streaming";
  /** A key on the server, or one the writer saved in Settings. */
  const aiAvailable = aiEnabled || settings.geminiApiKey.trim().length > 0;

  const startProofread = () => {
    if (!content.trim() || proofreadBusy) return;
    void proofread.start(content);
  };

  const applyProofread = () => {
    const corrected = proofread.draft.trimEnd();
    if (!corrected) return;
    setContent(corrected);
    dirtyRef.current = true;
    setDirty(true);
    proofread.reset();
    toast({ title: "Page polished", description: "The corrected version is on the page.", variant: "success" });
    contentRef.current?.focus();
  };

  return (
    <motion.div
      key={selectedDate}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6 md:pb-24 md:pt-10"
    >
      <article
        className={cn(
          "paper-card relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-soft",
          "px-6 py-8 sm:px-9 md:px-14 md:py-12",
        )}
      >
        {/* gradient hairline along the top edge — tinted by the day's mood */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={
            moodColor
              ? { background: `linear-gradient(90deg, ${moodColor}, ${moodColor}77, ${moodColor}2e)` }
              : undefined
          }
        />
        {!moodColor && (
          <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent via-secondary to-accent/30" />
        )}

        {/* header: weekday + full date */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <AnimatePresence mode="wait">
              <motion.p
                key={selectedDate}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="font-serif text-base italic text-muted"
              >
                {formatDayLong(selectedDate)}
              </motion.p>
            </AnimatePresence>
            <div className="mt-0.5 flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {formatLong(selectedDate)}
              </h2>
              {isCurrentDay && (
                <Badge className="bg-accent/12 text-accent ring-1 ring-accent/25">Today</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Only offered when a key exists somewhere — the server's or one
                saved in Settings. A button that can only fail is worse than
                no button. */}
            {aiAvailable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="soft"
                    size="sm"
                    className="mr-1"
                    onClick={startProofread}
                    disabled={!content.trim() || proofreadBusy}
                    aria-label="Fix spelling and grammar with AI"
                  >
                    {proofreadBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <WandSparkles className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{proofreadBusy ? "Fixing…" : "Fix with AI"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send this page to Gemini to fix any mistakes</TooltipContent>
              </Tooltip>
            )}
            <FavoriteButton
              favorite={favorite}
              onToggle={() => toggleFavorite(selectedDate)}
              label={favorite ? "Remove star" : "Star this page"}
            />
            <DropdownMenu>
              <Tooltip>
                <DropdownMenuTrigger asChild>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Page actions"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent>Page actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    updateEntry(selectedDate, { favorite: !favorite });
                    toast({ title: favorite ? "Star removed" : "Page starred", variant: "success" });
                  }}
                >
                  <Star className="h-4 w-4 text-accent" />
                  {favorite ? "Remove star" : "Star page"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete page
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* mood */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <MoodPicker value={mood} onChange={(m) => setMood(selectedDate, m)} />
          <span className="text-xs text-faint" aria-live="polite">
            {mood ? "Feeling noted." : "How do you feel today?"}
          </span>
        </div>

        {/* title */}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            dirtyRef.current = true;
            setDirty(true);
          }}
          placeholder="Untitled page"
          aria-label="Page title"
          spellCheck
          className="mt-8 w-full border-none bg-transparent p-0 font-serif text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-faint/70 sm:text-4xl"
        />

        <Separator className="my-6" />

        {/* body */}
        <div className="relative">
          <AnimatePresence>
            {blank && (
              <motion.p
                key={WRITING_PROMPTS[promptIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 text-faint"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="italic">{WRITING_PROMPTS[promptIndex]}</span>
              </motion.p>
            )}
          </AnimatePresence>
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              dirtyRef.current = true;
              setDirty(true);
            }}
            aria-label="Diary entry"
            placeholder=""
            spellCheck
            className={cn(
              "block w-full resize-none overflow-hidden border-none bg-transparent p-0 text-foreground outline-none",
              "selection:bg-accent/25 caret-accent placeholder:text-faint/60",
              "focus:drop-shadow-[0_0_24px_hsl(var(--accent)/0.12)]",
              fontSizeClasses(settings.fontSize),
            )}
            style={{ minHeight: 320, caretColor: moodColor }}
            autoFocus
          />
        </div>

        {/* AI proofreading suggestion */}
        <AnimatePresence>
          {proofread.status !== "idle" && (
            <ProofreadPanel
              status={proofread.status}
              draft={proofread.draft}
              error={proofread.error}
              unchanged={
                !proofreadBusy && proofread.draft.trim() !== "" && proofread.draft.trim() === content.trim()
              }
              onApply={applyProofread}
              onStop={proofread.stop}
              onRetry={startProofread}
              onDismiss={proofread.reset}
            />
          )}
        </AnimatePresence>

        {/* footer */}
        <footer className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">{words}</span> words
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium text-foreground/70">{content.length}</span> characters
          </span>
          {words > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {minutes} min read
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5">
            <AnimatePresence mode="wait">
              {dirty ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="animate-pulse-soft"
                >
                  Saving…
                </motion.span>
              ) : (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 text-muted"
                >
                  <Check className="h-3 w-3 text-emerald-500" />
                  {savedAt ? "Saved just now" : "All saved"}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </footer>
      </article>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={isCurrentDay ? "Erase today's page?" : "Delete this page?"}
        description={
          isCurrentDay
            ? "Today's page will be removed. A fresh blank page will be waiting next time."
            : `${formatLong(selectedDate)} will be removed from this device forever.`
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
