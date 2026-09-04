"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HardDriveDownload, X } from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { downloadBackup } from "@/lib/export";
import { DAY_MS } from "@/lib/backup";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

function agoLabel(iso: string, now: number): string {
  const days = Math.max(1, Math.round((now - Date.parse(iso)) / DAY_MS));
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/**
 * A quiet reminder that the diary only lives in this browser. Shows up on the
 * chosen cadence, only when something changed since the last backup, and can be
 * waved away for the session.
 */
export function BackupNudge({ className }: { className?: string }) {
  const { entries, backup, updateSettings } = useDiary();
  const { toast } = useToast();
  const [dismissed, setDismissed] = React.useState(false);

  const visible = backup.overdue && !dismissed;
  const now = Date.now();
  const pages = backup.pagesSinceBackup;

  const message = backup.lastBackupAt
    ? `${pages} page${pages === 1 ? "" : "s"} changed since your last backup ${agoLabel(backup.lastBackupAt, now)}.`
    : `${backup.pages} page${backup.pages === 1 ? "" : "s"} live only in this browser.`;

  const handleBackup = () => {
    const name = downloadBackup(entries);
    updateSettings({ lastBackupAt: new Date().toISOString() });
    setDismissed(true);
    toast({ title: "Backup downloaded", description: name, variant: "success" });
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          key="backup-nudge"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: EASE }}
          aria-label="Backup reminder"
          className={cn("rounded-2xl bg-accent/8 p-3.5 ring-1 ring-accent/20", className)}
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <HardDriveDownload className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight text-foreground">Time for a backup</p>
              <p className="mt-1 text-[11px] leading-snug text-muted">{message}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <Button size="sm" onClick={handleBackup}>
                  <HardDriveDownload className="h-3.5 w-3.5" />
                  Download backup
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss backup reminder"
              className="-mr-1 -mt-1 rounded-lg p-1 text-faint outline-none transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
