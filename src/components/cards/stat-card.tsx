"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  value,
  label,
  tint,
  emoji,
  delay = 0,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tint?: string;
  emoji?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-shadow duration-300 hover:shadow-lift"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ backgroundColor: tint ?? "hsl(var(--accent))" }}
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: tint ? `${tint}1f` : "hsl(var(--accent) / 0.12)",
            color: tint ?? "hsl(var(--accent))",
          }}
        >
          {emoji ? <span className="text-lg">{emoji}</span> : <Icon className="h-4 w-4" />}
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</span>
      </div>
      <p className={cn("mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground")}>{value}</p>
    </motion.div>
  );
}
