import { CalendarList } from "@/components/CalendarList";

/**
 * This file houses the public API for the flash-calendar package.
 */

export type { CalendarOnDayPress, CalendarTheme } from "@/components/Calendar";

export type {
  CalendarListProps as CalendarProps,
  CalendarListRef as CalendarRef,
  CalendarMonthEnhanced,
} from "@/components/CalendarList";

export const Calendar = CalendarList;
