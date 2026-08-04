import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
