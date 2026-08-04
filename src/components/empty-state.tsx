"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { DiaryIllustration } from "@/components/illustrations/diary-illustration";
import { EASE } from "@/lib/motion";

export function EmptyState({
  title,
  description,
  action,
  compact = false,
  illustration = true,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  illustration?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center justify-center px-6 py-14 text-center"
    >
      {illustration && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <DiaryIllustration className={compact ? "h-28 w-auto" : "h-36 w-auto"} />
        </motion.div>
      )}
      <h3 className="mt-7 font-serif text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
