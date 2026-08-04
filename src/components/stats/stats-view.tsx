"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Flame,
  MessageSquareText,
  PenLine,
  TrendingUp,
} from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useStats } from "@/hooks/use-stats";
import { StatCard } from "@/components/cards/stat-card";
import { Heatmap } from "@/components/stats/heatmap";
import { EmptyState } from "@/components/empty-state";
import { moodById } from "@/constants/moods";
import { monthlyStats } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

export function StatsView() {
  const { sortedEntries, openEntry, today } = useDiary();
  const stats = useStats(sortedEntries);
  const months = React.useMemo(() => monthlyStats(sortedEntries, 6), [sortedEntries]);
  const favorite = moodById(stats.favoriteMood);

  const maxWords = Math.max(1, ...months.map((m) => m.words));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6 md:pb-20 md:pt-10"
    >
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Insights</h1>
        <p className="mt-1.5 text-sm text-muted">
          A quiet look at the life you&rsquo;ve been writing.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={BookOpen} value={stats.totalEntries} label="Pages" delay={0} />
        <StatCard icon={Flame} value={stats.currentStreak} label="Current streak" tint="#F0923E" delay={0.05} />
        <StatCard icon={TrendingUp} value={stats.longestStreak} label="Longest streak" tint="#6FA88C" delay={0.1} />
        <StatCard icon={PenLine} value={stats.words.toLocaleString()} label="Words" tint="#4A90B5" delay={0.15} />
        <StatCard icon={MessageSquareText} value={stats.characters.toLocaleString()} label="Characters" tint="#8E7CC3" delay={0.2} />
        <StatCard
          icon={PenLine}
          value={favorite ? `${favorite.emoji} ${favorite.label}` : "—"}
          label="Favourite mood"
          tint={favorite?.color ?? "hsl(var(--accent))"}
          emoji={favorite ? undefined : "🕊️"}
          delay={0.25}
        />
      </div>

      <section className="mt-8 rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-7" aria-label="Words written per month">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">Words per month</h2>
          <span className="text-xs text-faint">last 6 months</span>
        </div>
        {stats.totalEntries === 0 ? (
          <p className="pb-2 text-sm text-muted">No words yet — every page counts.</p>
        ) : (
          <div className="flex h-40 items-end gap-3 sm:gap-4">
            {months.map((month, i) => (
              <div key={month.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="text-[10px] font-medium text-muted"
                >
                  {month.words > 0 ? month.words.toLocaleString() : ""}
                </motion.span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (month.words / maxWords) * 100)}px` }}
                  transition={{ duration: 0.6, delay: 0.08 * i, ease: EASE }}
                  className={cn(
                    "w-full max-w-[42px] rounded-t-lg",
                    month.words > 0
                      ? "bg-gradient-to-t from-accent/55 to-accent shadow-glow-soft"
                      : "bg-background-secondary ring-1 ring-border/50",
                  )}
                  title={`${month.label}: ${month.words} words`}
                />
                <span className="text-[11px] font-medium text-faint">{month.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-7" aria-label="Writing heatmap">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">A year of pages</h2>
          <span className="text-xs text-faint">words per day</span>
        </div>
        {stats.totalEntries === 0 ? (
          <EmptyState
            compact
            illustration={false}
            title="Your year is still blank."
            description="Write today and the map begins to fill."
            action={
              <button
                type="button"
                onClick={() => openEntry(today)}
                className="text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Write today&rsquo;s page →
              </button>
            }
          />
        ) : (
          <Heatmap />
        )}
      </section>
    </motion.div>
  );
}
