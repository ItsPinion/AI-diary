"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Bottom sheet used for mobile navigation & quick actions.
 * Slides up over a dimmed backdrop, dismissible with a swipe-away feel.
 */
export function Sheet({
  open,
  onOpenChange,
  children,
  className,
}: DialogPrimitive.DialogProps & { className?: string }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden",
                  "rounded-t-[1.75rem] border border-b-0 border-border/70 bg-card shadow-lift outline-none",
                  className,
                )}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <div className="flex shrink-0 justify-center pt-3" aria-hidden>
                  <div className="h-1.5 w-10 rounded-full bg-border" />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
