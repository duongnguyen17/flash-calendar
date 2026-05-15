import { useCallback, useMemo, useState } from "react";

import type { CalendarOnDayPress } from "@/components";
import type { CalendarActiveDateRange } from "@/hooks/useCalendar";

/**
 * A convenience hook to simplify managing a single date selection in the calendar.
 */
export const useDateRange = (initialDateId?: string) => {
  const [selectedDateId, setSelectedDateId] = useState<string | undefined>(
    initialDateId
  );

  const onCalendarDayPress = useCallback<CalendarOnDayPress>(
    (dateId: string) => {
      setSelectedDateId(dateId);
    },
    []
  );

  const onClearDateRange = useCallback(() => {
    setSelectedDateId(undefined);
  }, []);

  return useMemo(() => {
    const dateRange: CalendarActiveDateRange = {
      startId: selectedDateId,
      endId: selectedDateId,
    };
    const calendarActiveDateRanges = selectedDateId ? [dateRange] : [];

    return {
      /**
       * The current selected date ID.
       **/
      selectedDateId,
      /**
       * Compatible date range object.
       */
      dateRange,
      /**
       * Derived from the current selection as a convenience when passing to
       * the `<Calendar />` component.
       */
      calendarActiveDateRanges,
      /**
       * Clears the current selection.
       */
      onClearDateRange,
      /**
       * Callback to pass to the `<Calendar />` component.
       */
      onCalendarDayPress,
    };
  }, [selectedDateId, onCalendarDayPress, onClearDateRange]);
};
