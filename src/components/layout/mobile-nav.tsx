"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Feather,
  Flame,
  HelpCircle,
  Moon,
  Search,
  Settings,
  Star,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useDiary } from "@/hooks/use-diary";
import { useStats } from "@/hooks/use-stats";
import { Sheet } from "@/components/ui/sheet";
import { THEMES } from "@/constants/themes";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types";

const NAV: { view: AppView; label: string; hint: string; icon: typeof Sun }[] = [
  { view: "editor", label: "Today's page", hint: "Write today", icon: Sun },
  { view: "journal", label: "Journal", hint: "All your pages", icon: BookOpen },
  { view: "calendar", label: "Calendar", hint: "Browse by day", icon: CalendarDays },
  { view: "stats", label: "Insights", hint: "Streaks & words", icon: Star },
];

export function MobileNav({
  open,
  onOpenChange,
  onOpenSearch,
  onOpenSettings,
  onOpenHelp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}) {
  const { view, setView, settings, updateSettings, entries, openEntry, today } = useDiary();
  const { theme, setTheme } = useTheme();
  const stats = useStats(entries);

  const go = (next: AppView) => {
    setView(next);
    onOpenChange(false);
  };

  return (
    <>
      {/* floating action button */}
      <motion.button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Open menu"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 360, damping: 22 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.88 }}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-secondary text-accent-foreground shadow-glow outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
      >
        <Feather className="h-6 w-6" strokeWidth={1.9} />
      </motion.button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <div className="px-5 pb-8 pt-3">
          <div className="mb-1 flex items-center gap-3 px-1 pt-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-secondary">
              <Feather className="h-4 w-4 text-accent-foreground" strokeWidth={1.9} />
            </div>
            <div className="flex-1">
              <p className="font-serifDisplay text-lg leading-none text-foreground">Inkwell</p>
              <p className="mt-0.5 text-[11px] text-faint">your private diary</p>
            </div>
            {stats.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F0923E]/12 px-2.5 py-1 text-xs font-semibold text-[#E08A3A]">
                <Flame className="h-3.5 w-3.5" /> {stats.currentStreak}
              </span>
            )}
          </div>

          {/* quick actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenSearch();
              }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-background-secondary/60 py-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent/8 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="h-4 w-4 text-accent" />
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenSettings();
              }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-background-secondary/60 py-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent/8 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings className="h-4 w-4 text-accent" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenHelp();
              }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-background-secondary/60 py-3 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent/8 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HelpCircle className="h-4 w-4 text-accent" />
              Shortcuts
            </button>
          </div>

          {/* nav */}
          <nav aria-label="Main" className="mt-4 space-y-1">
            {NAV.map((item) => {
              const active = view === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => go(item.view)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-accent/12" : "hover:bg-accent/6",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                      active ? "bg-accent text-accent-foreground shadow-glow-soft" : "bg-background-secondary text-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span>
                    <span className={cn("block text-sm font-semibold", active ? "text-accent" : "text-foreground")}>
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* theme */}
          <div className="mt-5 rounded-2xl border border-border/70 bg-background-secondary/50 p-3.5">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Palette</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  aria-label="Light mode"
                  className={cn(
                    "rounded-lg p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    theme === "light" ? "bg-accent/12 text-accent" : "text-faint",
                  )}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  aria-label="Dark mode"
                  className={cn(
                    "rounded-lg p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    theme === "dark" ? "bg-accent/12 text-accent" : "text-faint",
                  )}
                >
                  <Moon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSettings({ theme: t.id })}
                  aria-label={`${t.name} theme`}
                  aria-pressed={settings.theme === t.id}
                  className="relative shrink-0 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={
                    settings.theme === t.id
                      ? { boxShadow: `0 0 0 2px hsl(var(--foreground)), 0 0 0 4px ${t.swatch[0]}` }
                      : undefined
                  }
                >
                  <span
                    className="block h-8 w-8 rounded-full ring-1 ring-border/50"
                    style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openEntry(today)}
            className="mt-4 w-full rounded-2xl border border-dashed border-accent/40 py-3 text-sm font-medium text-accent outline-none transition-colors hover:bg-accent/6 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open today&rsquo;s page
          </button>
        </div>
      </Sheet>
    </>
  );
}
