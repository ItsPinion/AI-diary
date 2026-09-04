"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { DiaryProvider } from "@/hooks/use-diary";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children, aiEnabled }: { children: ReactNode; aiEnabled: boolean }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <DiaryProvider aiEnabled={aiEnabled}>
          <ToastProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ToastProvider>
        </DiaryProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
