"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PanelLeftOpen } from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileSearchSheet } from "@/components/search/mobile-search-sheet";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { ShortcutsDialog } from "@/components/dialogs/shortcuts-dialog";
import { bus } from "@/lib/bus";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

const EditorView = dynamic(() => import("@/components/editor/editor").then((m) => m.EditorView), {
  loading: () => <ViewSkeleton />,
});
const JournalView = dynamic(() => import("@/components/timeline/journal-view").then((m) => m.JournalView), {
  loading: () => <ViewSkeleton />,
});
const CalendarView = dynamic(() => import("@/components/calendar/calendar-view").then((m) => m.CalendarView), {
  loading: () => <ViewSkeleton />,
});
const StatsView = dynamic(() => import("@/components/stats/stats-view").then((m) => m.StatsView), {
  loading: () => <ViewSkeleton />,
});

function ViewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-10 sm:px-6" aria-hidden>
      <div className="h-8 w-40 animate-pulse-soft rounded-xl bg-background-secondary" />
      <div className="h-64 w-full animate-pulse-soft rounded-3xl bg-card shadow-soft" />
    </div>
  );
}

const VIEWS: Record<import("@/types").AppView, React.ComponentType> = {
  editor: EditorView,
  journal: JournalView,
  calendar: CalendarView,
  stats: StatsView,
};

export function AppShell() {
  const { view, setView, selectedDate, toggleFavorite } = useDiary();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  useKeyboardShortcuts({
    "mod+s": () => bus.emit("save"),
    "mod+f": () => {
      if (isDesktop) bus.emit("search");
      else setSearchOpen(true);
    },
    "mod+d": () => toggleFavorite(selectedDate),
    "mod+1": () => setView("editor"),
    "mod+2": () => setView("journal"),
    "mod+3": () => setView("calendar"),
    "mod+4": () => setView("stats"),
    "?": () => setHelpOpen(true),
  });

  const ActiveView = VIEWS[view];

  return (
    <div className="relative min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-lift"
      >
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {collapsed && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-card p-2.5 text-muted shadow-lift outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </motion.button>
      )}

      <div
        className={cn(
          "relative z-10 min-h-dvh transition-[padding] duration-300 ease-spring",
          !collapsed && "lg:pl-[292px]",
        )}
      >
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <main id="main" className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav
        open={navOpen}
        onOpenChange={setNavOpen}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <MobileSearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
