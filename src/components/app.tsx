"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDiary } from "@/hooks/use-diary";
import { LoadingSplash } from "@/components/loading-splash";
import { AppShell } from "@/components/app-shell";

/** Soft gradient atmosphere + grain behind everything. */
export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-40 -top-44 h-[36rem] w-[36rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="absolute -bottom-52 -right-32 h-[32rem] w-[32rem] rounded-full bg-secondary/15 blur-[130px]" />
      <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-accent/5 blur-[110px]" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}

export function App() {
  const { hydrated } = useDiary();

  return (
    <div className="relative min-h-dvh">
      <BackgroundDecor />
      <AnimatePresence>{!hydrated && <LoadingSplash key="splash" />}</AnimatePresence>
      <AnimatePresence>
        {hydrated && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <AppShell />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
