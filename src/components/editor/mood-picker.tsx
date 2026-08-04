"use client";

import { motion } from "framer-motion";
import { MOODS } from "@/constants/moods";
import { cn } from "@/lib/utils";
import type { MoodId } from "@/types";

export function MoodPicker({
  value,
  onChange,
  className,
}: {
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="How are you feeling?"
      className={cn("flex items-center gap-1.5 overflow-x-auto pb-1", className)}
    >
      {MOODS.map((mood) => {
        const active = value === mood.id;
        return (
          <motion.button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={mood.label}
            title={mood.label}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(active ? null : mood.id)}
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg outline-none transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring",
              active ? "" : "opacity-55 grayscale-[0.35] hover:opacity-100 hover:grayscale-0",
            )}
            style={
              active
                ? {
                    backgroundColor: `${mood.color}22`,
                    boxShadow: `0 0 0 2px ${mood.color}, 0 6px 22px -8px ${mood.color}aa`,
                  }
                : undefined
            }
          >
            <span aria-hidden>{mood.emoji}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
