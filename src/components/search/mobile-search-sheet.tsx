"use client";

import * as React from "react";
import { useDiary } from "@/hooks/use-diary";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Sheet } from "@/components/ui/sheet";
import { SearchBar } from "@/components/search/search-bar";
import { EntryCard } from "@/components/cards/entry-card";
import { EmptyState } from "@/components/empty-state";
import { filterEntries } from "@/lib/search";

export function MobileSearchSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sortedEntries } = useDiary();
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 120);
  const results = React.useMemo(() => filterEntries(sortedEntries, debounced), [sortedEntries, debounced]);

  // Focus the field when the sheet opens; clear when it closes.
  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="px-5 pb-8 pt-4">
        <p className="px-1 pb-3 font-serif text-xl font-semibold text-foreground">Search</p>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search title, words, dates…"
          autoFocus
          dataSearch="mobile"
        />

        <div className="mt-4 space-y-2.5">
          {debounced.trim() === "" ? (
            <EmptyState
              compact
              illustration={false}
              title="Search every word you've written."
              description="Titles, journal entries and even dates — like “july” or “Tuesday”."
            />
          ) : results.length === 0 ? (
            <EmptyState
              compact
              illustration={false}
              title="The page you're looking for doesn't exist."
              description={`Nothing matched “${debounced.trim()}”.`}
            />
          ) : (
            results.slice(0, 30).map((entry) => <EntryCard key={entry.id} entry={entry} compact />)
          )}
        </div>
      </div>
    </Sheet>
  );
}
