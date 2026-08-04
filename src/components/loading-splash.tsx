"use client";

import { motion } from "framer-motion";
import { Feather } from "lucide-react";
import { EASE } from "@/lib/motion";

/** Branded opening animation shown while the diary hydrates. */
export function LoadingSplash() {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background"
      role="status"
      aria-label="Opening your diary"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-accent to-secondary shadow-glow"
      >
        <Feather className="h-9 w-9 text-accent-foreground" strokeWidth={1.8} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        className="font-serifDisplay text-2xl text-foreground"
      >
        Inkwell
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="h-1 w-24 rounded-full bg-accent/30"
      />
    </motion.div>
  );
}
