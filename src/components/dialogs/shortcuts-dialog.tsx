"use client";

import { Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/constants/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Keyboard className="h-5 w-5" />
          </div>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Everything you can do without touching the mouse.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1.5">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 text-sm"
            >
              <span className="text-muted">{shortcut.label}</span>
              <kbd className="rounded-lg border border-border bg-background-secondary px-2 py-1 font-sans text-xs font-medium text-foreground">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
