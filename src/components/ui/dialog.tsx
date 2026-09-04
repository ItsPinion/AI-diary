"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Dialog with elegant fade/scale transitions.
 * Usage: <Dialog open onOpenChange><DialogContent>…</DialogContent></Dialog>
 */
export function Dialog({ open, onOpenChange, children }: DialogPrimitive.DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>{open ? children : null}</AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay asChild forceMount>
        <motion.div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content asChild forceMount>
        <motion.div
          className={cn(
            // Centring lives in the motion values below, not in Tailwind's
            // -translate-* utilities: Framer Motion writes `transform` inline,
            // which would override them and leave the dialog's top-left corner
            // pinned to the middle of the screen.
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg",
            "rounded-3xl border border-border/70 bg-card p-6 shadow-lift outline-none",
            "max-h-[85vh] overflow-y-auto",
            className,
          )}
          initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-46%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.97, x: "-50%", y: "-48%" }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute right-4 top-4 rounded-full p-2 text-muted outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-5 flex flex-col gap-1.5", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-serif text-2xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-relaxed text-muted", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-wrap items-center justify-end gap-2", className)} {...props} />;
}

export function DialogClose({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close className={className} {...props} />;
}
