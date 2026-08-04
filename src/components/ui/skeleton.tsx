import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "rounded-lg bg-background-secondary bg-[linear-gradient(100deg,transparent_20%,hsl(var(--accent)/0.06)_50%,transparent_80%)] bg-[length:400px_100%] animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}
