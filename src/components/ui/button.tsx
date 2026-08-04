"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
    "rounded-xl text-sm font-medium outline-none transition-all duration-200",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "motion-safe:hover:-translate-y-px",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-accent text-accent-foreground shadow-soft",
          "motion-safe:hover:shadow-glow-soft",
        ].join(" "),
        soft: "bg-accent/12 text-accent motion-safe:hover:bg-accent/18",
        secondary: "bg-background-secondary text-foreground ring-1 ring-border motion-safe:hover:bg-accent/8",
        ghost: "text-muted hover:bg-accent/8 hover:text-foreground",
        outline: "ring-1 ring-border bg-card text-foreground motion-safe:hover:ring-accent/40 motion-safe:hover:bg-accent/5",
        danger: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 motion-safe:hover:bg-red-500/15 dark:text-red-400",
        link: "text-accent underline-offset-4 motion-safe:hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable the ink-ripple press effect. */
  noRipple?: boolean;
}

export function Button({ className, variant, size, asChild = false, noRipple = false, onPointerDown, children, ...props }: ButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const rippleId = React.useRef(0);

  const Comp = asChild ? Slot : "button";

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (noRipple || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples((prev) => [...prev, { x: event.clientX - rect.left, y: event.clientY - rect.top, id }]);
    onPointerDown?.(event);
  };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden
          className="pointer-events-none absolute z-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-25 animate-ripple"
          style={{ left: ripple.x, top: ripple.y }}
          onAnimationEnd={() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id))}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Comp>
  );
}

export { buttonVariants };
