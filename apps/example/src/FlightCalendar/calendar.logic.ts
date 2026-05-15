import mitt from "mitt";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CalendarActiveDateRange,
  CalendarDayMetadata,
  CalendarMonth,
  DayState,
  UseCalendarParams,
} from "./types";
import {
  addDays,
  addMonths,
  differenceInMonths,
  endOfMonth,
  fromDateId,
  getWeeksInMonth,
  isWeekend,
  range,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  toDateId,
} from "./types";

// ─── State computation ────────────────────────────────────────────────────────

type GetStateFieldsParams = Pick<
  UseCalendarParams,
  | "calendarActiveDateRanges"
  | "calendarMinDateId"
  | "calendarMaxDateId"
  | "calendarDisabledDateIds"
> & { todayId?: string; id: string };

export const getStateFields = ({
  todayId,
  id,
  calendarActiveDateRanges,
  calendarMinDateId,
  calendarMaxDateId,
  calendarDisabledDateIds,
}: GetStateFieldsParams) => {
  const isSelected =
    calendarActiveDateRanges?.some(
      ({ startId, endId }) => id === startId || id === endId
    ) ?? false;

  const isDisabled =
    (calendarDisabledDateIds?.includes(id) ||
      (calendarMinDateId && id < calendarMinDateId) ||
      (calendarMaxDateId && id > calendarMaxDateId)) === true;

  const isToday = todayId === id;

  const state: DayState = isSelected
    ? "active"
    : isDisabled
    ? "disabled"
    : isToday
    ? "today"
    : "idle";

  return { isSelected, state, isDisabled, isToday };
};

// ─── buildCalendar ────────────────────────────────────────────────────────────

const getBaseCalendarMonthFormat = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);

const getBaseCalendarWeekDayFormat = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date);

const getBaseCalendarDayFormat = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);

const getNumberOfEmptyCellsAtStart = (month: Date, firstDayOfWeek: "sunday" | "monday") => {
  const d = month.getDay();
  if (firstDayOfWeek === "sunday") return d;
  return d === 0 ? 6 : d - 1;
};

export const buildCalendar = (params: UseCalendarParams) => {
  const {
    calendarMonthId: monthId,
    calendarFirstDayOfWeek = "sunday",
    calendarFormatLocale = "en-US",
    getCalendarMonthFormat = getBaseCalendarMonthFormat,
    getCalendarWeekDayFormat = getBaseCalendarWeekDayFormat,
    getCalendarDayFormat = getBaseCalendarDayFormat,
  } = params;

  const month = fromDateId(monthId);
  const monthStart = startOfMonth(month);
  const monthStartId = toDateId(monthStart);
  const monthEnd = endOfMonth(month);
  const monthEndId = toDateId(monthEnd);
  const emptyDaysAtStart = getNumberOfEmptyCellsAtStart(monthStart, calendarFirstDayOfWeek);
  const startOfWeekIndex = calendarFirstDayOfWeek === "sunday" ? 0 : 1;
  const endOfWeekIndex = calendarFirstDayOfWeek === "sunday" ? 6 : 0;
  const todayId = toDateId(new Date());

  let dayToIterate = subDays(monthStart, emptyDaysAtStart);

  const weeksList: CalendarDayMetadata[][] = [
    [
      ...range(1, emptyDaysAtStart).map((): CalendarDayMetadata => {
        const id = toDateId(dayToIterate);
        const day: CalendarDayMetadata = {
          date: dayToIterate,
          displayLabel: getCalendarDayFormat(dayToIterate, calendarFormatLocale),
          id,
          isDifferentMonth: true,
          isEndOfMonth: false,
          isEndOfWeek: dayToIterate.getDay() === endOfWeekIndex,
          isStartOfMonth: false,
          isStartOfWeek: dayToIterate.getDay() === startOfWeekIndex,
          isWeekend: isWeekend(dayToIterate),
          ...getStateFields({ ...params, todayId, id }),
        };
        dayToIterate = addDays(dayToIterate, 1);
        return day;
      }),
    ],
  ];

  while (dayToIterate.getMonth() === monthStart.getMonth()) {
    const currentWeek = weeksList[weeksList.length - 1];
    if (currentWeek.length === 7) weeksList.push([]);
    const id = toDateId(dayToIterate);
    weeksList[weeksList.length - 1].push({
      date: dayToIterate,
      displayLabel: getCalendarDayFormat(dayToIterate, calendarFormatLocale),
      id,
      isDifferentMonth: false,
      isEndOfMonth: id === monthEndId,
      isEndOfWeek: dayToIterate.getDay() === endOfWeekIndex,
      isStartOfMonth: id === monthStartId,
      isStartOfWeek: dayToIterate.getDay() === startOfWeekIndex,
      isWeekend: isWeekend(dayToIterate),
      ...getStateFields({ ...params, todayId, id }),
    });
    dayToIterate = addDays(dayToIterate, 1);
  }

  const lastWeek = weeksList[weeksList.length - 1];
  const emptyDaysAtEnd = 7 - lastWeek.length;
  lastWeek.push(
    ...range(1, emptyDaysAtEnd).map(() => {
      const id = toDateId(dayToIterate);
      const day: CalendarDayMetadata = {
        date: dayToIterate,
        displayLabel: getCalendarDayFormat(dayToIterate, calendarFormatLocale),
        id,
        isDifferentMonth: true,
        isEndOfMonth: false,
        isEndOfWeek: dayToIterate.getDay() === endOfWeekIndex,
        isStartOfMonth: false,
        isStartOfWeek: dayToIterate.getDay() === startOfWeekIndex,
        isWeekend: isWeekend(dayToIterate),
        ...getStateFields({ ...params, todayId, id }),
      };
      dayToIterate = addDays(dayToIterate, 1);
      return day;
    })
  );

  const weekDaysList = range(1, 7).map((i) =>
    getCalendarWeekDayFormat(
      addDays(startOfWeek(month, calendarFirstDayOfWeek), i - 1),
      calendarFormatLocale
    )
  );

  return {
    weeksList,
    calendarRowMonth: getCalendarMonthFormat(month, calendarFormatLocale),
    weekDaysList,
  };
};

// ─── useCalendar ──────────────────────────────────────────────────────────────

export const useCalendar = (params: UseCalendarParams) =>
  useMemo(() => buildCalendar(params), [params]);

// ─── useOptimizedDayMetadata ──────────────────────────────────────────────────

interface OnSetActiveDateRangesPayload {
  instanceId?: string;
  ranges: CalendarActiveDateRange[];
}

export const activeDateRangesEmitter = mitt<{
  onSetActiveDateRanges: OnSetActiveDateRangesPayload;
}>();

const DEFAULT_INSTANCE_ID = "flight-calendar-default";

export const useOptimizedDayMetadata = (
  baseMetadata: CalendarDayMetadata,
  calendarInstanceId?: string
) => {
  const [metadata, setMetadata] = useState(baseMetadata);
  const safeId = calendarInstanceId ?? DEFAULT_INSTANCE_ID;

  useEffect(() => {
    setMetadata(baseMetadata);
  }, [baseMetadata]);

  useEffect(() => {
    const handler = (payload: OnSetActiveDateRangesPayload) => {
      const { ranges, instanceId = DEFAULT_INSTANCE_ID } = payload;
      if (instanceId !== safeId) return;

      const { isSelected, state } = getStateFields({
        id: metadata.id,
        calendarActiveDateRanges: ranges,
      });

      if (state === "active") {
        setMetadata((prev) => ({ ...prev, isSelected, state }));
      } else {
        setMetadata(baseMetadata);
      }
    };

    activeDateRangesEmitter.on("onSetActiveDateRanges", handler);
    return () => activeDateRangesEmitter.off("onSetActiveDateRanges", handler);
  }, [baseMetadata, safeId, metadata.id]);

  return metadata;
};

// ─── useCalendarList ──────────────────────────────────────────────────────────

interface UseCalendarListParams {
  calendarInitialMonthId?: string;
  calendarPastScrollRangeInMonths: number;
  calendarFutureScrollRangeInMonths: number;
  calendarFirstDayOfWeek: "monday" | "sunday";
  calendarMinDateId?: string;
  calendarMaxDateId?: string;
}

const buildMonthList = (
  startingMonth: Date,
  endingMonth: Date,
  firstDayOfWeek: "monday" | "sunday" = "sunday"
): CalendarMonth[] => {
  const startId = toDateId(startingMonth);
  const endId = toDateId(endingMonth);
  if (endId < startId) return [];

  const months: CalendarMonth[] = [
    { id: startId, date: startingMonth, numberOfWeeks: getWeeksInMonth(startingMonth, firstDayOfWeek) },
  ];
  if (startId === endId) return months;

  const count = differenceInMonths(endingMonth, startingMonth);
  for (let i = 1; i <= count; i++) {
    const m = addMonths(startingMonth, i);
    months.push({ id: toDateId(m), date: m, numberOfWeeks: getWeeksInMonth(m, firstDayOfWeek) });
  }
  return months;
};

const getEndingMonth = (monthRange: number, maxDateId: string | undefined, base: Date) => {
  const endFromRange = addMonths(base, monthRange);
  const endId = toDateId(endFromRange);
  const safeMax = maxDateId ?? endId;
  return startOfMonth(endId > safeMax ? fromDateId(safeMax) : endFromRange);
};

const getStartingMonth = (monthRange: number, minDateId: string | undefined, base: Date) => {
  const startFromRange = subMonths(base, monthRange);
  const startId = toDateId(startFromRange);
  const safeMin = minDateId ?? startId;
  return safeMin > startId ? startOfMonth(fromDateId(safeMin)) : startFromRange;
};

export const useCalendarList = ({
  calendarInitialMonthId,
  calendarPastScrollRangeInMonths,
  calendarFutureScrollRangeInMonths,
  calendarFirstDayOfWeek,
  calendarMaxDateId,
  calendarMinDateId,
}: UseCalendarListParams) => {
  const { initialMonth, initialMonthId } = useMemo(() => {
    const base = calendarInitialMonthId
      ? fromDateId(calendarInitialMonthId)
      : fromDateId(toDateId(new Date()));
    const sm = startOfMonth(base);
    return { initialMonth: sm, initialMonthId: toDateId(sm) };
  }, [calendarInitialMonthId]);

  const [monthList, setMonthList] = useState<CalendarMonth[]>(() => {
    const current = startOfMonth(initialMonth);
    return buildMonthList(
      getStartingMonth(calendarPastScrollRangeInMonths, calendarMinDateId, current),
      getEndingMonth(calendarFutureScrollRangeInMonths, calendarMaxDateId, current),
      calendarFirstDayOfWeek
    );
  });

  const appendMonths = useCallback(
    (n: number) => {
      const start = addMonths(monthList[monthList.length - 1].date, 1);
      const end = getEndingMonth(Math.max(n - 1, 0), calendarMaxDateId, start);
      if (monthList.find((m) => m.id === toDateId(end))) return monthList;
      const newMonths = buildMonthList(start, end, calendarFirstDayOfWeek);
      const next = [...monthList, ...newMonths];
      setMonthList(next);
      return next;
    },
    [calendarFirstDayOfWeek, calendarMaxDateId, monthList]
  );

  const prependMonths = useCallback(
    (n: number) => {
      const end = subMonths(monthList[0].date, 1);
      const start = getStartingMonth(Math.max(n - 1, 0), calendarMinDateId, end);
      const newMonths = buildMonthList(start, end, calendarFirstDayOfWeek);
      const next = [...newMonths, ...monthList];
      setMonthList(next);
      return next;
    },
    [calendarFirstDayOfWeek, calendarMinDateId, monthList]
  );

  const addMissingMonths = useCallback(
    (targetMonthId: string) => {
      const first = monthList[0];
      const last = monthList[monthList.length - 1];
      if (targetMonthId > last.id)
        return appendMonths(differenceInMonths(fromDateId(targetMonthId), last.date));
      return prependMonths(differenceInMonths(first.date, fromDateId(targetMonthId)));
    },
    [appendMonths, monthList, prependMonths]
  );

  const initialMonthIndex = useMemo(
    () => monthList.findIndex((i) => i.id === initialMonthId),
    [initialMonthId, monthList]
  );

  return { monthList, initialMonthIndex, appendMonths, prependMonths, addMissingMonths };
};

export const getHeightForMonth = ({
  calendarRowVerticalSpacing: vSpacing,
  calendarDayHeight: day,
  calendarWeekHeaderHeight: weekName,
  calendarMonthHeaderHeight: header,
  calendarAdditionalHeight: extra,
  calendarMonth,
  calendarSpacing,
}: {
  calendarAdditionalHeight: number;
  calendarDayHeight: number;
  calendarMonthHeaderHeight: number;
  calendarRowVerticalSpacing: number;
  calendarWeekHeaderHeight: number;
  calendarMonth: CalendarMonth;
  calendarSpacing: number;
}) => {
  const headerH = header + vSpacing + weekName + vSpacing;
  const daysH = day * calendarMonth.numberOfWeeks + (calendarMonth.numberOfWeeks - 1) * vSpacing;
  return headerH + daysH + extra + calendarSpacing;
};

// ─── useDateRange (single date selection) ────────────────────────────────────

export const useDateRange = (initialDateId?: string) => {
  const [selectedDateId, setSelectedDateId] = useState<string | undefined>(initialDateId);

  const onCalendarDayPress = useCallback((dateId: string) => {
    setSelectedDateId(dateId);
  }, []);

  const onClearDate = useCallback(() => setSelectedDateId(undefined), []);

  return useMemo(() => {
    const dateRange: CalendarActiveDateRange = {
      startId: selectedDateId,
      endId: selectedDateId,
    };
    return {
      selectedDateId,
      dateRange,
      calendarActiveDateRanges: selectedDateId ? [dateRange] : [],
      onCalendarDayPress,
      onClearDate,
    };
  }, [selectedDateId, onCalendarDayPress, onClearDate]);
};
