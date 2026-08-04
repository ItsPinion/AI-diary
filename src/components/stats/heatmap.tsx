"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useDiary } from "@/hooks/use-diary";
import { addDays, formatLong, startOfWeek } from "@/lib/dates";
import { moodById } from "@/constants/moods";
import { cn } from "@/lib/utils";

const LEVELS = [
  { min: 700, alpha: 0.9 },
  { min: 300, alpha: 0.65 },
  { min: 100, alpha: 0.4 },
  { min: 1, alpha: 0.18 },
];

function alphaForWords(words: number): number {
  for (const level of LEVELS) {
    if (words >= level.min) return level.alpha;
  }
  return 0;
}

export function Heatmap({ weeks = 52 }: { weeks?: number }) {
  const { entries } = useDiary();

  const columns = React.useMemo(() => {
    const today = new Date();
    const start = startOfWeek(addDays(today, -weeks * 7 + 1), { weekStartsOn: 1 });
    const cols: { date: Date; days: { date: Date; words: number; mood: string | null }[] }[] = [];
    for (let w = 0; w < weeks; w++) {
      const weekDays: { date: Date; words: number; mood: string | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
        weekDays.push({ date, words: 0, mood: null });
      }
      cols.push({ date: weekDays[0].date, days: weekDays });
    }

    const byDate = new Map(entries.map((e) => [e.date, e]));
    for (const col of cols) {
      for (const day of col.days) {
        const entry = byDate.get(
          `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(
            day.date.getDate(),
          ).padStart(2, "0")}`,
        );
        if (entry) {
          day.words = entry.content.trim().split(/\s+/).filter(Boolean).length;
          const mood = entry.mood ? moodById(entry.mood) : null;
          day.mood = mood?.color ?? null;
        }
      }
    }
    return cols;
  }, [entries, weeks]);

  // Month labels along the top.
  const monthLabels = React.useMemo(() => {
    const labels: { index: number; label: string }[] = [];
    let last = "";
    columns.forEach((col, i) => {
      const label = col.date.toLocaleDateString("en-US", { month: "short" });
      if (label !== last && i > 0) {
        labels.push({ index: i, label });
        last = label;
      }
      if (i === 0) last = label;
    });
    return labels;
  }, [columns]);

  const totalDays = columns.length * 7;

  return (
    <div>
      <div className="relative mb-2 h-4">
        {monthLabels.map(({ index, label }) => (
          <span
            key={`${index}-${label}`}
            className="absolute text-[10px] font-medium uppercase tracking-wide text-faint"
            style={{ left: `${(index / columns.length) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
      <div
        role="img"
        aria-label={`Writing heatmap for the past year: ${totalDays} days`}
        className="flex gap-[3px] overflow-x-auto pb-1"
      >
        {columns.map((col, colIndex) => (
          <motion.div
            key={colIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: colIndex * 0.004 }}
            className="flex flex-col gap-[3px]"
          >
            {col.days.map((day) => {
              const alpha = alphaForWords(day.words);
              const key = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(
                day.date.getDate(),
              ).padStart(2, "0")}`;
              return (
                <span
                  key={key}
                  title={
                    day.words > 0
                      ? `${formatLong(key)} — ${day.words} word${day.words === 1 ? "" : "s"}`
                      : `${formatLong(key)} — no page`
                  }
                  className={cn(
                    "h-[11px] w-[11px] rounded-[3px] transition-colors duration-200",
                    alpha === 0 && "bg-background-secondary ring-1 ring-border/50",
                  )}
                  style={alpha > 0 ? { backgroundColor: `hsl(var(--accent) / ${alpha})` } : undefined}
                />
              );
            })}
          </motion.div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-faint">
        <span>less</span>
        {[0, 0.18, 0.4, 0.65, 0.9].map((alpha) => (
          <span
            key={alpha}
            aria-hidden
            className="h-[11px] w-[11px] rounded-[3px] ring-1 ring-border/40"
            style={alpha === 0 ? { backgroundColor: "hsl(var(--background-secondary))" } : { backgroundColor: `hsl(var(--accent) / ${alpha})` }}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
