"use client";

import { motion } from "framer-motion";
import { Clock, Star } from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { moodById } from "@/constants/moods";
import { formatDayNumber, formatDayShort, formatFull } from "@/lib/dates";
import { countWords, readingTimeMinutes } from "@/lib/stats";
import { entryPreview } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { DiaryEntry } from "@/types";

/** Star toggle with a springy pop. */
export function FavoriteButton({
  favorite,
  onToggle,
  className,
  size = "md",
  label,
}: {
  favorite: boolean;
  onToggle: () => void;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.82 }}
      aria-label={label ?? (favorite ? "Remove from favourites" : "Add to favourites")}
      aria-pressed={favorite}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring",
        size === "md" ? "h-9 w-9" : "h-7 w-7",
        favorite ? "text-accent" : "text-faint hover:bg-accent/10 hover:text-accent",
        className,
      )}
    >
      <motion.span
        key={favorite ? "on" : "off"}
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="flex"
      >
        <Star className={cn(size === "md" ? "h-4 w-4" : "h-3.5 w-3.5", favorite && "fill-current")} />
      </motion.span>
    </motion.button>
  );
}

export function EntryCard({
  entry,
  compact = false,
}: {
  entry: DiaryEntry;
  compact?: boolean;
}) {
  const { openEntry, toggleFavorite } = useDiary();
  const mood = moodById(entry.mood);
  const words = countWords(entry.content);

  return (
    <motion.button
      type="button"
      onClick={() => openEntry(entry.date)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      aria-label={`Open entry from ${formatFull(entry.date)}`}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-soft",
        "outline-none transition-[border-color,box-shadow] duration-300",
        "hover:border-accent/35 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "p-3.5" : "p-5",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex w-11 shrink-0 flex-col items-center pt-0.5" aria-hidden>
          <span className="font-serif text-2xl font-semibold leading-none text-foreground">
            {formatDayNumber(entry.date)}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-faint">
            {formatDayShort(entry.date)}
          </span>
          {mood && (
            <span
              className="mt-2 rounded-full border px-1.5 py-0.5 text-[11px] leading-none"
              style={{ color: mood.color, backgroundColor: `${mood.color}1a`, borderColor: `${mood.color}55` }}
            >
              {mood.emoji}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("font-serif leading-snug text-foreground", compact ? "text-[15px]" : "text-lg")}>
            {entry.title.trim() || "Untitled page"}
          </p>
          <p className={cn("mt-1 leading-relaxed text-muted line-clamp-2", compact ? "text-xs" : "text-sm")}>
            {entry.content.trim() ? entryPreview(entry, compact ? 90 : 120) : "No words written yet."}
          </p>
          <p className={cn("mt-2 flex items-center gap-3 text-[11px] text-faint", compact && "hidden")}>
            <span>{formatFull(entry.date)}</span>
            {words > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {words} words · {readingTimeMinutes(entry.content)} min read
              </span>
            )}
          </p>
        </div>

        <FavoriteButton
          favorite={entry.favorite}
          onToggle={() => toggleFavorite(entry.date)}
          size="sm"
          className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100"
        />
      </div>
    </motion.button>
  );
}
