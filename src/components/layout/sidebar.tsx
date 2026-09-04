"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Feather,
  Flame,
  PanelLeftClose,
  Search,
  Star,
  Sun,
} from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useNow } from "@/hooks/use-now";
import { useStats } from "@/hooks/use-stats";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SearchBar } from "@/components/search/search-bar";
import { BackupNudge } from "@/components/backup/backup-nudge";
import { bus } from "@/lib/bus";
import { moodById } from "@/constants/moods";
import { quoteForDay, greetingForHour } from "@/lib/quotes";
import { entryPreview, filterEntries } from "@/lib/search";
import { formatDayLong, formatFull, relativeDayLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";
import type { AppView, DiaryEntry } from "@/types";

const NAV: { view: AppView; label: string; icon: typeof Sun }[] = [
  { view: "editor", label: "Today's page", icon: Sun },
  { view: "journal", label: "Journal", icon: BookOpen },
  { view: "calendar", label: "Calendar", icon: CalendarDays },
  { view: "stats", label: "Insights", icon: Star },
];

function SidebarEntryRow({ entry, active }: { entry: DiaryEntry; active?: boolean }) {
  const { openEntry } = useDiary();
  const mood = moodById(entry.mood);
  return (
    <button
      type="button"
      onClick={() => openEntry(entry.date)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group w-full rounded-xl px-3 py-2 text-left outline-none transition-colors duration-150",
        "hover:bg-accent/8 focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-accent/10",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-faint">
        {mood && <span aria-hidden>{mood.emoji}</span>}
        <span className="truncate">{relativeDayLabel(entry.date)}</span>
        {entry.favorite && (
          <Star className="ml-auto h-3 w-3 shrink-0 fill-accent text-accent" aria-label="Favourite" />
        )}
      </div>
      <p className="mt-0.5 truncate text-[13px] leading-snug text-foreground/85">
        {entryPreview(entry, 48)}
      </p>
    </button>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { sortedEntries, favorites, today, selectedDate, view, setView, openEntry } = useDiary();
  const now = useNow();
  const stats = useStats(sortedEntries);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 120);
  const searching = debounced.trim().length > 0;
  const results = React.useMemo(
    () => (searching ? filterEntries(sortedEntries, debounced).slice(0, 12) : []),
    [sortedEntries, debounced, searching],
  );

  const todayEntry = sortedEntries.find((e) => e.date === today);
  const recent = React.useMemo(
    () => sortedEntries.filter((e) => e.date !== today).slice(0, 8),
    [sortedEntries, today],
  );

  // ⌘/Ctrl+F focuses the sidebar search on desktop.
  React.useEffect(() => {
    if (!isDesktop) return;
    return bus.on("search", () => {
      const input = document.querySelector<HTMLInputElement>('[data-search="sidebar"]');
      input?.focus();
      input?.select();
    });
  }, [isDesktop]);

  const quote = React.useMemo(() => quoteForDay(new Date(now.getFullYear(), now.getMonth(), now.getDate())), [now]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 0 : 292 }}
      transition={{ type: "spring", stiffness: 300, damping: 34 }}
      aria-hidden={collapsed}
      className="fixed inset-y-0 left-0 z-40 hidden lg:block"
    >
      <div
        className={cn(
          "flex h-full w-[292px] flex-col overflow-hidden border-r border-border/70 bg-background-secondary/50 backdrop-blur-xl transition-opacity duration-300",
          collapsed && "opacity-0",
        )}
        inert={collapsed}
      >
        {/* brand */}
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-secondary shadow-glow-soft">
            <Feather className="h-5 w-5 text-accent-foreground" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serifDisplay text-xl leading-none text-foreground">Inkwell</p>
            <p className="mt-1 text-[11px] text-faint">a quiet place for your thoughts</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="rounded-lg p-1.5 text-faint outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-4 pt-1 [scrollbar-width:thin]">
          {/* greeting */}
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {greetingForHour(now.getHours())}
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">
              {formatDayLong(today)}
            </p>
            <p className="text-sm text-muted">{formatFull(today)}</p>
          </div>

          {/* today's page */}
          <button
            type="button"
            onClick={() => openEntry(today)}
            aria-current={view === "editor" && selectedDate === today ? "page" : undefined}
            className={cn(
              "group w-full rounded-2xl border p-4 text-left outline-none transition-all duration-200",
              view === "editor" && selectedDate === today
                ? "border-accent/40 bg-accent/10 shadow-glow-soft"
                : "border-border/70 bg-card shadow-soft hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
              Today&rsquo;s page
              {stats.currentStreak > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-faint normal-case tracking-normal">
                  <Flame className="h-3 w-3 text-[#F0923E]" /> {stats.currentStreak} day streak
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-foreground/85">
              {todayEntry ? entryPreview(todayEntry, 80) : "A blank page awaits…"}
            </p>
          </button>

          {/* search */}
          <div className="space-y-2">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search your pages…"
              showKbd
              dataSearch="sidebar"
            />
          </div>

          {/* nav */}
          <nav aria-label="Main" className="space-y-1">
            {NAV.map((item) => {
              const active = view === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => setView(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-accent/12 text-accent shadow-[inset_0_1px_0_hsl(var(--accent)/0.15)]"
                      : "text-muted hover:bg-accent/6 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-accent")} strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* favourites */}
          {favorites.length > 0 && !searching && (
            <div className="space-y-2">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Favourite pages
              </p>
              <div className="space-y-0.5">
                {favorites.slice(0, 6).map((entry) => (
                  <SidebarEntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {/* recent / search results */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              <Search className="h-3 w-3" />
              {searching ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Recent pages"}
            </p>
            <div className="space-y-0.5">
              {searching
                ? results.map((entry) => (
                    <SidebarEntryRow key={entry.id} entry={entry} active={entry.date === selectedDate} />
                  ))
                : recent.map((entry) => (
                    <SidebarEntryRow key={entry.id} entry={entry} active={entry.date === selectedDate} />
                  ))}
              {searching && results.length === 0 && (
                <p className="px-1 py-2 text-xs text-faint">Nothing found for “{debounced.trim()}”.</p>
              )}
            </div>
          </div>
        </div>

        {/* backup reminder + quote footer */}
        <div className="space-y-3 border-t border-border/70 px-5 pb-5 pt-4">
          <BackupNudge />
          <motion.figure
            key={`${quote.text}-${now.getDate()}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="rounded-2xl bg-accent/6 p-3.5 ring-1 ring-accent/15"
          >
            <blockquote className="text-[13px] italic leading-relaxed text-foreground/80">
              “{quote.text}”
            </blockquote>
            <figcaption className="mt-1.5 text-[11px] font-medium text-faint">— {quote.author}</figcaption>
          </motion.figure>
        </div>
      </div>
    </motion.aside>
  );
}
