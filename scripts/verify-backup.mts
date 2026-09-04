/**
 * Zero-dependency checks for the backup reminder rules.
 *
 *   node scripts/verify-backup.mts
 *
 * Imports the real module — the same `backupStatus` the sidebar, the mobile
 * menu and Settings all read.
 */

import { DAY_MS, backupStatus, isMeaningfulEntry } from "../src/lib/backup.ts";
import type { DiaryEntry } from "../src/types/index.ts";

let passed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) passed += 1;
  else failures.push(`${name}\n      expected ${b}\n      actual   ${a}`);
}

const NOW = Date.parse("2026-09-04T12:00:00.000Z");
const daysAgo = (days: number, hours = 0) => new Date(NOW - days * DAY_MS - hours * 3_600_000).toISOString();

function entry(overrides: Partial<DiaryEntry> & { date: string }): DiaryEntry {
  return {
    id: `id-${overrides.date}`,
    title: "A page",
    content: "Some words.",
    mood: null,
    favorite: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

const written = entry({ date: "2026-09-03" });

// ---- Which pages are worth backing up --------------------------------------

check("words count", isMeaningfulEntry(entry({ date: "a", content: "hi", title: "" })), true);
check("a title alone counts", isMeaningfulEntry(entry({ date: "a", content: "", title: "Hi" })), true);
check("a mood alone counts", isMeaningfulEntry(entry({ date: "a", content: "", title: "", mood: "calm" })), true);
check("a star alone counts", isMeaningfulEntry(entry({ date: "a", content: "", title: "", favorite: true })), true);
check("an untouched placeholder doesn't", isMeaningfulEntry(entry({ date: "a", content: "", title: "" })), false);
check("whitespace doesn't count", isMeaningfulEntry(entry({ date: "a", content: "   ", title: "  " })), false);

// ---- Nothing to lose, nothing to say ---------------------------------------

const empty = backupStatus([], { lastBackupAt: null, backupReminderDays: 7 }, NOW);
check("empty diary is never overdue", empty.overdue, false);
check("empty diary has no pages", empty.pages, 0);

const placeholders = backupStatus(
  [entry({ date: "2026-09-04", title: "", content: "" })],
  { lastBackupAt: null, backupReminderDays: 1 },
  NOW - 40 * DAY_MS,
);
check("blank pages never trigger a nudge", placeholders.overdue, false);

const off = backupStatus([written], { lastBackupAt: null, backupReminderDays: 0 }, NOW + 400 * DAY_MS);
check("reminders can be switched off", off.overdue, false);

// ---- A brand-new writer isn't nagged on day one ----------------------------

const fresh = backupStatus(
  [entry({ date: "2026-09-04", createdAt: daysAgo(0), updatedAt: daysAgo(0) })],
  { lastBackupAt: null, backupReminderDays: 7 },
  NOW,
);
check("day one is not overdue", fresh.overdue, false);
check("day one counts down from the cadence", fresh.daysUntilDue, 7);

// ---- No backup yet + real history → remind ---------------------------------

const imported = backupStatus(
  [entry({ date: "2026-08-01", createdAt: daysAgo(34), updatedAt: daysAgo(34) })],
  { lastBackupAt: null, backupReminderDays: 7 },
  NOW,
);
check("never backed up + old pages → overdue", imported.overdue, true);
check("counts every page as unsaved", imported.pagesSinceBackup, 1);
check("reports the page total", imported.pages, 1);

// ---- Cadence ---------------------------------------------------------------

const recent = backupStatus([written], { lastBackupAt: daysAgo(2), backupReminderDays: 7 }, NOW);
check("inside the cadence → not overdue", recent.overdue, false);
check("counts the days left", recent.daysUntilDue, 5);

const halfway = backupStatus([written], { lastBackupAt: daysAgo(6, 12), backupReminderDays: 7 }, NOW);
check("rounds a partial day up", halfway.daysUntilDue, 1);

// ---- Only nag when something actually changed ------------------------------

const untouched = backupStatus(
  [entry({ date: "2026-08-23", createdAt: daysAgo(30), updatedAt: daysAgo(12) })],
  { lastBackupAt: daysAgo(10), backupReminderDays: 7 },
  NOW,
);
check("nothing written since the backup → no nudge", untouched.overdue, false);
check("and no unsaved pages", untouched.pagesSinceBackup, 0);

const changed = backupStatus(
  [entry({ date: "2026-09-01", createdAt: daysAgo(30), updatedAt: daysAgo(3) })],
  { lastBackupAt: daysAgo(10), backupReminderDays: 7 },
  NOW,
);
check("written since the backup → nudge", changed.overdue, true);
check("counts only the changed pages", changed.pagesSinceBackup, 1);

const mixed = backupStatus(
  [
    entry({ date: "2026-09-01", createdAt: daysAgo(30), updatedAt: daysAgo(3) }),
    entry({ date: "2026-09-02", createdAt: daysAgo(20), updatedAt: daysAgo(12) }),
    entry({ date: "2026-09-03", createdAt: daysAgo(9), updatedAt: daysAgo(1) }),
    entry({ date: "2026-09-04", title: "", content: "" }),
  ],
  { lastBackupAt: daysAgo(8), backupReminderDays: 7 },
  NOW,
);
check("ignores pages saved in the last backup", mixed.pagesSinceBackup, 2);
check("ignores placeholders in the count", mixed.pages, 3);

// ---- A corrupt timestamp must not crash the reminder -----------------------

const corrupt = backupStatus([written], { lastBackupAt: "not-a-date", backupReminderDays: 7 }, NOW + 40 * DAY_MS);
check("a corrupt lastBackupAt is treated as never", corrupt.overdue, true);
check("and reported back as-is", corrupt.lastBackupAt, "not-a-date");

const clean = backupStatus([written], { lastBackupAt: daysAgo(2), backupReminderDays: 7 }, NOW);
check("echoes a valid timestamp", clean.lastBackupAt, daysAgo(2));

// ---- Report ----------------------------------------------------------------

if (failures.length) {
  console.error(`✗ ${failures.length} of ${passed + failures.length} checks failed:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ ${passed} checks passed (backup reminder rules)`);
