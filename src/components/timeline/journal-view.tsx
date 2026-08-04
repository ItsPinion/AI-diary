"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useDiary } from "@/hooks/use-diary";
import { SearchBar } from "@/components/search/search-bar";
import { EntryCard } from "@/components/cards/entry-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/animations/motion-primitives";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { filterEntries } from "@/lib/search";
import { formatMonthYearKey } from "@/lib/dates";
import { EASE } from "@/lib/motion";

export function JournalView() {
  const { sortedEntries, openEntry, today } = useDiary();
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 120);

  const results = React.useMemo(() => filterEntries(sortedEntries, debounced), [sortedEntries, debounced]);

  const groups = React.useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const entry of results) {
      const month = entry.date.slice(0, 7);
      const list = map.get(month);
      if (list) list.push(entry);
      else map.set(month, [entry]);
    }
    return [...map.entries()];
  }, [results]);

  const hasAnyEntries = sortedEntries.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:px-6 md:pb-20 md:pt-10"
    >
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Journal</h1>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {hasAnyEntries
              ? `${sortedEntries.length} page${sortedEntries.length === 1 ? "" : "s"}, newest first.`
              : "Your pages will gather here."}
          </p>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search title, words, dates…"
            className="sm:w-72"
          />
        </div>
      </header>

      {!hasAnyEntries ? (
        <EmptyState
          title="Every story starts with a single page."
          description="Open your diary and let today be the first day you remember."
          action={
            <Button onClick={() => openEntry(today)}>
              Start today&rsquo;s page
            </Button>
          }
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="The page you're looking for doesn't exist."
          description={`Nothing matched “${query.trim()}”. Try a different word or date.`}
          illustration={false}
          action={
            <Button variant="soft" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="space-y-9">
          {groups.map(([month, entries]) => (
            <section key={month} aria-label={formatMonthYearKey(entries[0].date)}>
              <div className="sticky top-[57px] z-10 -mx-2 mb-3 flex items-center gap-3 bg-background/80 px-2 py-2 backdrop-blur-md">
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  {formatMonthYearKey(entries[0].date)}
                </h2>
                <span className="text-xs text-faint">{entries.length}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden />
              </div>
              <Stagger className="space-y-2.5">
                {entries.map((entry) => (
                  <StaggerItem key={entry.id}>
                    <EntryCard entry={entry} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
