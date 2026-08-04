"use client";

import { motion } from "framer-motion";
import { Flame, HelpCircle, Search, Settings } from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useStats } from "@/hooks/use-stats";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatLong, isToday } from "@/lib/dates";
import { EASE } from "@/lib/motion";

const TITLES = {
  editor: "Today's page",
  journal: "Journal",
  calendar: "Calendar",
  stats: "Insights",
} as const;

export function Header({
  onOpenSearch,
  onOpenSettings,
  onOpenHelp,
}: {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}) {
  const { view, selectedDate, entries } = useDiary();
  const stats = useStats(entries);

  const title =
    view === "editor" ? (isToday(selectedDate) ? TITLES.editor : formatLong(selectedDate)) : TITLES[view];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[57px] w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
        <h1 className="min-w-0 truncate font-serif text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        <div className="ml-auto flex items-center gap-1.5">
          {stats.currentStreak > 0 && (
            <motion.div
              key={stats.currentStreak}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="mr-1 hidden items-center gap-1.5 rounded-full bg-[#F0923E]/12 px-3 py-1.5 text-xs font-semibold text-[#E08A3A] ring-1 ring-[#F0923E]/25 sm:flex dark:text-[#F8B26A]"
              title={`${stats.currentStreak}-day writing streak`}
            >
              <Flame className="h-3.5 w-3.5" />
              {stats.currentStreak} day streak
            </motion.div>
          )}

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search pages"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          <ThemeSwitcher />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Open settings"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenHelp}
                aria-label="Keyboard shortcuts"
                className="hidden h-9 w-9 items-center justify-center rounded-xl text-muted outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:flex"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Shortcuts</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.header>
  );
}
