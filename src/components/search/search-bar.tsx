"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search your pages…",
  showKbd = false,
  autoFocus = false,
  className,
  inputClassName,
  onEscape,
  dataSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showKbd?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onEscape?: () => void;
  dataSearch?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        data-search={dataSearch}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.currentTarget.blur();
            onEscape?.();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-10 w-full rounded-xl border border-border bg-card/80 pl-10 pr-9 text-sm text-foreground",
          "placeholder:text-faint outline-none backdrop-blur-sm transition-all duration-200",
          "focus:border-accent/50 focus:ring-2 focus:ring-accent/20",
          inputClassName,
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-faint transition-colors hover:bg-accent/10 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : showKbd ? (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background-secondary px-1.5 py-0.5 text-[10px] font-medium text-faint sm:block">
          ⌘F
        </kbd>
      ) : null}
    </div>
  );
}
