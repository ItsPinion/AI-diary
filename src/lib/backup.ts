import type { DiaryEntry } from "@/types";

/**
 * Backup bookkeeping. Everything here is pure so the "should we nag?" rule can
 * be tested without a browser — see scripts/verify-backup.mts.
 */

export const DAY_MS = 86_400_000;

/** A page is worth backing up once it carries words, a title, a mood or a star. */
export function isMeaningfulEntry(entry: DiaryEntry): boolean {
  return (
    entry.title.trim() !== "" ||
    entry.content.trim() !== "" ||
    entry.mood !== null ||
    entry.favorite === true
  );
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export interface BackupSettings {
  /** ISO time of the last backup download, or null when there hasn't been one. */
  lastBackupAt: string | null;
  /** Nudge cadence in days. 0 turns reminders off. */
  backupReminderDays: number;
}

export interface BackupStatus {
  /** True when the reminder should be shown. */
  overdue: boolean;
  /** Pages written or edited since the last backup (or since the first page). */
  pagesSinceBackup: number;
  /** ISO time of the last backup, or null. */
  lastBackupAt: string | null;
  /** How many pages there are to lose. */
  pages: number;
  /** Days until the next nudge is due (0 once it is). */
  daysUntilDue: number;
}

/**
 * Work out whether a backup reminder is due.
 *
 * If there has never been a backup, the clock starts at the oldest page that
 * matters (so a brand-new writer isn't nagged on day one, but an imported
 * diary with months of history is) and every page counts as unsaved. Once
 * there is a backup, the reminder only fires when something actually changed
 * after it — nagging about pages that are already in the last backup file is
 * just noise.
 */
export function backupStatus(
  entries: DiaryEntry[],
  settings: BackupSettings,
  now: number = Date.now(),
): BackupStatus {
  const meaningful = entries.filter(isMeaningfulEntry);
  const lastBackupAt = settings.lastBackupAt ?? null;
  const idle: BackupStatus = {
    overdue: false,
    pagesSinceBackup: 0,
    lastBackupAt,
    pages: meaningful.length,
    daysUntilDue: 0,
  };

  if (settings.backupReminderDays <= 0 || meaningful.length === 0) return idle;

  const cadenceMs = settings.backupReminderDays * DAY_MS;
  const lastBackup = parseTime(lastBackupAt);
  const reference =
    lastBackup ?? Math.min(...meaningful.map((entry) => parseTime(entry.createdAt) ?? now));
  const elapsed = now - reference;

  if (elapsed < cadenceMs) {
    return { ...idle, daysUntilDue: Math.ceil((cadenceMs - elapsed) / DAY_MS) };
  }

  // Never backed up: everything is at risk. Otherwise, only what changed.
  const pagesSinceBackup =
    lastBackup === null
      ? meaningful.length
      : meaningful.filter((entry) => (parseTime(entry.updatedAt) ?? 0) > lastBackup).length;

  return { ...idle, overdue: pagesSinceBackup > 0, pagesSinceBackup, daysUntilDue: 0 };
}
