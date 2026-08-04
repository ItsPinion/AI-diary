"use client";

import * as React from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { THEMES, themeById } from "@/constants/themes";
import { useDiary } from "@/hooks/use-diary";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

/** Palette + light/dark picker. Renders as a row when `variant="list"`. */
export function ThemeSwitcher({ variant = "popover" }: { variant?: "popover" | "list" }) {
  const { settings, updateSettings } = useDiary();
  const { theme, setTheme } = useTheme();

  const swatches = (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => {
        const active = settings.theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => updateSettings({ theme: t.id })}
            aria-label={`${t.name} theme`}
            aria-pressed={active}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-xl p-2 outline-none transition-all duration-200",
              "hover:bg-accent/8 focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-accent/10",
            )}
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-soft ring-1 ring-border transition-transform duration-200 group-hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
            >
              {active && <Check className="h-4 w-4 text-white drop-shadow" />}
            </span>
            <span className={cn("text-[11px] font-medium", active ? "text-foreground" : "text-muted")}>
              {t.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  const modeToggle = (
    <div className="flex rounded-xl bg-background-secondary p-1 ring-1 ring-border">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = theme === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setTheme(m.id)}
            aria-label={`${m.label} mode`}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
              active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {swatches}
        {modeToggle}
      </div>
    );
  }

  const current = themeById(settings.theme);

  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Change theme"
              className="flex h-9 items-center gap-2 rounded-xl px-2.5 outline-none ring-1 ring-border transition-all duration-200 hover:ring-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-border/50"
                style={{ background: `linear-gradient(135deg, ${current.swatch[0]}, ${current.swatch[1]})` }}
              />
              <span className="hidden text-xs font-medium text-muted lg:block">{current.name}</span>
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>Theme &amp; appearance</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64">
        <p className="mb-2.5 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Palette
        </p>
        {swatches}
        <div className="my-3 h-px bg-border/70" />
        <p className="mb-2.5 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Light &amp; dark
        </p>
        {modeToggle}
      </PopoverContent>
    </Popover>
  );
}
