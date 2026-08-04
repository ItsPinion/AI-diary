"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { Button } from "@/components/ui/button";
import { MOODS, moodById } from "@/constants/moods";
import { addMonths, formatMonthYear, startOfMonth, startOfWeek, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { DiaryEntry } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView() {
  const { entries, selectedDate, today, openEntry } = useDiary();
  const [cursor, setCursor] = React.useState(() => new Date());

  const byDate = React.useMemo(() => {
    const map = new Map<string, DiaryEntry>();
    for (const entry of entries) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const cells = React.useMemo(() => {
    const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const days: { date: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      days.push({ date: toDateKey(date), inMonth: date.getMonth() === cursor.getMonth() });
    }
    return days;
  }, [cursor]);

  const canGoNext = cursor.getMonth() !== new Date().getMonth() || cursor.getFullYear() !== new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6 md:pb-20 md:pt-10"
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-1.5 text-sm text-muted">Every day holds a page. Tap a day to open it.</p>
        </div>
      </header>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft">
        {/* month nav */}
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {formatMonthYear(cursor)}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            disabled={!canGoNext}
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* weekday header */}
        <div className="grid grid-cols-7 gap-1 px-3 pt-4 sm:px-5" aria-hidden>
          {WEEKDAYS.map((day) => (
            <div key={day} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-faint">
              {day}
            </div>
          ))}
        </div>

        {/* days */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-4 pt-1 sm:px-5 sm:pb-6">
          {cells.map(({ date, inMonth }) => {
            const entry = byDate.get(date);
            const mood = entry ? moodById(entry.mood) : null;
            const isSelected = date === selectedDate;
            const isCurrentDay = date === today;
            const hasEntry = !!entry;

            return (
              <button
                key={date}
                type="button"
                onClick={() => openEntry(date)}
                aria-label={`${date}${hasEntry ? ", has a page" : ""}`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl text-sm outline-none transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "hover:bg-accent/10",
                  !inMonth && "text-faint/40 hover:bg-transparent",
                  isSelected && "bg-accent text-accent-foreground shadow-glow-soft hover:bg-accent",
                  isCurrentDay && !isSelected && "ring-2 ring-accent/60",
                )}
              >
                {Number(date.slice(-2))}
                {hasEntry && (
                  <span
                    className={cn(
                      "absolute bottom-1.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-accent-foreground" : "bg-accent",
                    )}
                    style={!isSelected && mood ? { backgroundColor: mood.color } : undefined}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {MOODS.map((mood) => (
          <span key={mood.id} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span aria-hidden>{mood.emoji}</span>
            {mood.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
