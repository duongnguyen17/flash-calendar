// ─── Date Helpers ────────────────────────────────────────────────────────────

export function toDateId(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mm = month < 10 ? `0${month}` : month;
  const dd = day < 10 ? `0${day}` : day;
  return `${year}-${mm}-${dd}`;
}

export function fromDateId(dateId: string): Date {
  const [year, month, day] = dateId.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return new Date(next.getTime() - 1);
}

export function startOfWeek(baseDate: Date, firstDayOfWeek: "monday" | "sunday"): Date {
  const date = new Date(baseDate.getTime());
  const dayOfWeek = date.getDay();
  const isSunday = dayOfWeek === 0;
  if (isSunday && firstDayOfWeek === "monday") {
    date.setDate(date.getDate() - 6);
    return date;
  }
  const diff = dayOfWeek - (firstDayOfWeek === "monday" ? 1 : 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function differenceInMonths(laterDate: Date, earlierDate: Date): number {
  return (
    (laterDate.getFullYear() - earlierDate.getFullYear()) * 12 +
    (laterDate.getMonth() - earlierDate.getMonth())
  );
}

export function getWeeksInMonth(date: Date, firstDayOfWeek: "monday" | "sunday"): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  let dayOfWeek = firstDay.getDay();
  if (firstDayOfWeek === "monday") {
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }
  const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.ceil((dayOfWeek + totalDays) / 7);
}

export function getWeekOfMonth(date: Date, firstDayOfWeek: "monday" | "sunday"): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  let dayOfWeek = firstDay.getDay();
  if (firstDayOfWeek === "monday") {
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }
  return Math.floor((dayOfWeek + date.getDate() - 1) / 7) + 1;
}

// ─── Number Helpers ───────────────────────────────────────────────────────────

export function range(start: number, stop: number, step = 1): number[] {
  return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
}

export function abbreviateFare(fare: number | undefined | null): string {
  if (!fare) return "--";
  const billion = fare / 1_000_000_000;
  if (billion >= 1) return Number(billion.toFixed(1)) + "t";
  const millions = fare / 1_000_000;
  if (millions >= 1) return Number(millions.toFixed(1)) + "tr";
  return Math.round(fare / 1_000) + "k";
}

export const uppercaseFirstLetter = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

// ─── Calendar Types ───────────────────────────────────────────────────────────

/** Custom data attached to each day cell. */
export interface CalendarDayData {
  price?: number | null;
  airline?: string | null;
  isCheapest?: boolean;
  isMostExpensive?: boolean;
}

export type DayState = "idle" | "active" | "today" | "disabled";

export interface CalendarActiveDateRange {
  startId?: string;
  endId?: string;
}

interface CalendarDayStateFields {
  isDisabled: boolean;
  isToday: boolean;
  isSelected: boolean;
  state: DayState;
}

export type CalendarDayMetadata = {
  date: Date;
  displayLabel: string;
  isDifferentMonth: boolean;
  isEndOfMonth: boolean;
  isEndOfWeek: boolean;
  isStartOfMonth: boolean;
  isStartOfWeek: boolean;
  isWeekend: boolean;
  id: string;
  data?: CalendarDayData;
} & CalendarDayStateFields;

export interface UseCalendarParams {
  calendarMonthId: string;
  calendarMinDateId?: string;
  calendarMaxDateId?: string;
  calendarFormatLocale?: string;
  getCalendarMonthFormat?: (date: Date, locale: string) => string;
  getCalendarWeekDayFormat?: (date: Date, locale: string) => string;
  getCalendarDayFormat?: (date: Date, locale: string) => string;
  calendarFirstDayOfWeek?: "sunday" | "monday";
  calendarActiveDateRanges?: CalendarActiveDateRange[];
  calendarDisabledDateIds?: string[];
  calendarDayData?: Record<string, CalendarDayData>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export const lightTheme = {
  spacing: { 0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24 } as const,
  colors: {
    content: { disabled: "#B0B0B0", primary: "#000000", secondary: "#212121", inverse: { primary: "#FFFFFF" } },
    background: { primary: "#FFFFFF", tertiary: "#EDEFEE", tertiaryPressed: "#D1D2D3", inverse: { primary: "#000000" } },
    borders: { default: "#E0E0E0" },
    transparent: "transparent",
  },
} as const;

export const darkTheme = {
  spacing: { 0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24 } as const,
  colors: {
    content: { disabled: "#bdbdbd", primary: "#FFFFFF", secondary: "#e8e8e8", inverse: { primary: "#000000" } },
    background: { primary: "#000000", tertiary: "#111111", tertiaryPressed: "#212121", inverse: { primary: "#FFFFFF" } },
    borders: { default: "#5c5c5c" },
    transparent: "transparent",
  },
} as const;

export type BaseTheme = typeof lightTheme | typeof darkTheme;

// ─── Calendar Month ───────────────────────────────────────────────────────────

export interface CalendarMonth {
  id: string;
  date: Date;
  numberOfWeeks: number;
}
