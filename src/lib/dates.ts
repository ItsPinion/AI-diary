import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Local date key "yyyy-MM-dd". All diary dates live in local time. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a date key as a local midnight date. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_REGEX.test(key)) return false;
  const date = fromDateKey(key);
  return toDateKey(date) === key && !Number.isNaN(date.getTime());
}

export function formatLong(key: string): string {
  return format(fromDateKey(key), "d MMMM yyyy");
}

export function formatFull(key: string): string {
  return format(fromDateKey(key), "EEEE, d MMMM yyyy");
}

export function formatDayLong(key: string): string {
  return format(fromDateKey(key), "EEEE");
}

export function formatDayShort(key: string): string {
  return format(fromDateKey(key), "EEE");
}

export function formatDayNumber(key: string): string {
  return format(fromDateKey(key), "d");
}

export function formatMonthYearKey(key: string): string {
  return format(fromDateKey(key), "MMMM yyyy");
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function formatTime(iso: string): string {
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return "";
  }
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function isSameDayKey(a: string, b: string): boolean {
  return a === b;
}

export function addDaysToKey(key: string, amount: number): string {
  return toDateKey(addDays(fromDateKey(key), amount));
}

export function addMonthsToDate(date: Date, amount: number): Date {
  return addMonths(date, amount);
}

export function startOfMonthKey(date: Date): string {
  return toDateKey(startOfMonth(date));
}

/** Days since a date key (positive if before today). */
export function daysAgo(key: string): number {
  return differenceInCalendarDays(todayKey(), key);
}

export function relativeDayLabel(key: string): string {
  const diff = differenceInCalendarDays(todayKey(), fromDateKey(key));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  return formatLong(key);
}

/** Build a grid of week columns for a 52-week heatmap. */
export function heatmapWeeks(weeks: number): Date[] {
  const today = new Date();
  const firstColumn = startOfWeek(addDays(today, -weeks * 7 + 1), { weekStartsOn: 1 });
  const columns: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    columns.push(addDays(firstColumn, i * 7));
  }
  return columns;
}

export function isSameMonthKey(a: Date, b: Date): boolean {
  return isSameMonth(a, b);
}

export { addDays, addMonths, differenceInCalendarDays, format, startOfMonth, startOfWeek };
