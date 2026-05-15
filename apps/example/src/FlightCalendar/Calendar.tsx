import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  forwardRef,
  type Ref,
} from "react";
import type { ColorSchemeName, PressableProps, TextProps, TextStyle, ViewStyle } from "react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import type { FlashListProps, FlashListRef } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";

import type { CalendarDayData, CalendarDayMetadata, CalendarMonth, UseCalendarParams } from "./types";
import { darkTheme, lightTheme, uppercaseFirstLetter, abbreviateFare } from "./types";
import type { BaseTheme } from "./types";
import {
  activeDateRangesEmitter,
  buildCalendar,
  getHeightForMonth,
  useCalendarList,
  useOptimizedDayMetadata,
} from "./calendar.logic";
import { getWeekOfMonth, startOfMonth, toDateId } from "./types";

// ─── Theme Context ────────────────────────────────────────────────────────────

interface CalendarThemeContextType {
  colorScheme?: ColorSchemeName;
}

const CalendarThemeContext = createContext<CalendarThemeContextType>({ colorScheme: undefined });

const CalendarThemeProvider = ({
  children,
  colorScheme,
}: {
  children: ReactNode;
  colorScheme?: ColorSchemeName;
}) => {
  const value = useMemo<CalendarThemeContextType>(() => ({ colorScheme }), [colorScheme]);
  return <CalendarThemeContext.Provider value={value}>{children}</CalendarThemeContext.Provider>;
};

const useCalendarTheme = () => useContext(CalendarThemeContext);

const useTheme = (): BaseTheme => {
  const appearance = useColorScheme();
  const { colorScheme } = useCalendarTheme();
  return (colorScheme ?? appearance) === "dark" ? darkTheme : lightTheme;
};

// ─── HStack ───────────────────────────────────────────────────────────────────

interface HStackProps {
  alignItems?: ViewStyle["alignItems"];
  justifyContent?: ViewStyle["justifyContent"];
  children: ReactNode;
  grow?: boolean;
  shrink?: boolean;
  spacing?: number;
  wrap?: ViewStyle["flexWrap"];
  backgroundColor?: string;
  style?: ViewStyle;
  width?: ViewStyle["width"];
}

const HStack = ({
  alignItems,
  children,
  justifyContent = "flex-start",
  grow = false,
  shrink = false,
  spacing = 0,
  wrap = "nowrap",
  backgroundColor,
  width,
  style = {},
}: HStackProps) => {
  const containerStyles = useMemo<ViewStyle[]>(
    () => [
      {
        alignItems: "center",
        flexDirection: "row",
        flexGrow: 0,
        flexShrink: 0,
        flexWrap: "nowrap",
        justifyContent: "flex-start",
      },
      { gap: spacing },
      grow ? { flexGrow: 1 } : {},
      shrink ? { flexShrink: 1 } : {},
      wrap ? { flexWrap: wrap } : {},
      alignItems ? { alignItems } : {},
      justifyContent ? { justifyContent } : {},
      backgroundColor ? { backgroundColor } : {},
      width ? { width } : {},
      style,
    ],
    [alignItems, backgroundColor, grow, justifyContent, shrink, spacing, style, width, wrap]
  );
  return <View style={containerStyles}>{children}</View>;
};

// ─── VStack ───────────────────────────────────────────────────────────────────

function isFragment(child: ReactNode): child is ReactElement<{ children?: ReactNode }> {
  return isValidElement(child) && child.type === Fragment;
}

interface VStackProps {
  children: ReactNode;
  spacing?: number;
  alignItems?: ViewStyle["alignItems"];
  justifyContent?: ViewStyle["justifyContent"];
  grow?: boolean;
}

const VStack = ({ children, spacing = 0, alignItems, justifyContent, grow }: VStackProps) => {
  const containerStyles = useMemo<ViewStyle>(
    () => ({ flexDirection: "column", gap: spacing, alignItems, justifyContent, flex: grow ? 1 : undefined }),
    [alignItems, grow, justifyContent, spacing]
  );
  return (
    <View style={containerStyles}>
      {Children.toArray(children)
        .map((c) => (isFragment(c) ? c.props.children : c))
        .flat()
        .filter((c) => c !== null && typeof c !== "undefined")
        .map((child, i) => <Fragment key={i}>{child}</Fragment>)}
    </View>
  );
};

// ─── CalendarItemEmpty ────────────────────────────────────────────────────────

const CalendarItemEmpty = memo(({ height, theme }: { height: number; theme?: { container?: ViewStyle } }) => {
  const styles = useMemo(() => [{ padding: 6, flex: 1, height }, theme?.container], [height, theme?.container]);
  return <View style={styles} />;
});

// ─── CalendarItemWeekName ─────────────────────────────────────────────────────

const CalendarItemWeekName = ({
  children,
  height,
  theme,
  textProps,
}: {
  children: ReactNode;
  height: number;
  theme?: { container?: ViewStyle; content?: TextStyle };
  textProps?: Omit<TextProps, "children">;
}) => {
  const { colors } = useTheme();
  const { containerStyles, contentStyles } = useMemo(() => ({
    containerStyles: [{ alignItems: "center" as const, flex: 1, justifyContent: "center" as const, padding: 6, height }, theme?.container],
    contentStyles: [{}, { color: colors.content.primary }, textProps?.style, theme?.content],
  }), [colors.content.primary, height, theme?.container, theme?.content, textProps?.style]);
  return (
    <View style={containerStyles}>
      <Text {...textProps} style={contentStyles}>{children}</Text>
    </View>
  );
};

// ─── CalendarRowMonth ─────────────────────────────────────────────────────────

const CalendarRowMonth = ({
  children,
  height,
  theme,
}: {
  children: ReactNode;
  height: number;
  theme?: { container?: ViewStyle; content?: TextStyle };
}) => {
  const { colors } = useTheme();
  const { containerStyles, contentStyles } = useMemo(() => ({
    containerStyles: [{ width: "100%" as const, alignItems: "center" as const, justifyContent: "center" as const, height }, theme?.container],
    contentStyles: [{ textAlign: "center" as const, width: "100%" as const }, { color: colors.content.primary }, theme?.content],
  }), [colors.content.primary, height, theme?.container, theme?.content]);
  return <View style={containerStyles}><Text style={contentStyles}>{children}</Text></View>;
};

// ─── CalendarRowWeek ──────────────────────────────────────────────────────────

const CalendarRowWeek = memo(({
  children,
  spacing = 0,
  theme,
}: {
  children: ReactNode;
  spacing?: number;
  theme?: { container?: ViewStyle };
}) => {
  const containerStyles = useMemo(() => ({ width: "100%" as const, ...theme?.container }), [theme?.container]);
  return (
    <HStack alignItems="center" grow justifyContent="space-between" spacing={spacing} style={containerStyles}>
      {children}
    </HStack>
  );
});

// ─── Day Cell (CalendarItemDay) ───────────────────────────────────────────────

export type PressableLike = React.ComponentType<
  Pick<PressableProps, "children" | "style" | "disabled"> & { onPress: () => void }
>;

// react-native-web hover support
declare module "react-native" {
  interface PressableStateCallbackType {
    hovered?: boolean;
    focused?: boolean;
  }
}

const dayStyles = StyleSheet.create({
  base: { padding: 4, borderRadius: 8, flex: 1, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dayCol: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  lunarText: { fontSize: 10, color: "#9e9d9d" },
  priceRow: { alignItems: "center", justifyContent: "center", paddingBottom: 2 },
  priceText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  emptyPrice: { fontSize: 10, fontWeight: "300" },
});

interface CalendarItemDayProps {
  onPress: (id: string) => void;
  metadata: CalendarDayMetadata;
  data?: CalendarDayData;
  height: number;
  CalendarPressableComponent?: PressableLike;
}

const CalendarItemDay = memo(({
  onPress,
  height,
  metadata,
  data,
  CalendarPressableComponent = Pressable as PressableLike,
}: CalendarItemDayProps) => {
  // Console log to verify memoization
  console.log(`[Render Day] ${metadata.id} - Price: ${data?.price ?? "None"}`);

  const baseTheme = useTheme();
  const handlePress = useCallback(() => onPress(metadata.id), [metadata.id, onPress]);

  const { price, isCheapest, isMostExpensive } = data ?? {};
  const formattedPrice = abbreviateFare(price);
  const isPriceEmpty = formattedPrice === "--";

  const backgroundColor = useMemo(() => {
    if (isPriceEmpty) return "#fafafa";
    if (isCheapest) return "#E8F5E9";
    if (isMostExpensive) return "#FFEBEE";
    return "#f2f2f2";
  }, [isCheapest, isMostExpensive, isPriceEmpty]);

  return (
    <CalendarPressableComponent
      disabled={metadata.state === "disabled" || isPriceEmpty}
      onPress={handlePress}
      style={({ pressed }) => [
        dayStyles.base,
        {
          height,
          backgroundColor: pressed ? baseTheme.colors.background.tertiary : backgroundColor,
          opacity: metadata.state === "disabled" ? 0.3 : 1,
        },
      ]}
    >
      <View style={dayStyles.topRow}>
        <View style={dayStyles.dayCol}>
          <Text style={dayStyles.dayText}>{metadata.displayLabel}</Text>
          <Text style={dayStyles.lunarText}>{metadata.displayLabel}</Text>
        </View>
      </View>
      <View style={dayStyles.priceRow}>
        <Text style={[dayStyles.priceText, isPriceEmpty && dayStyles.emptyPrice]}>
          {formattedPrice}
        </Text>
      </View>
    </CalendarPressableComponent>
  );
});

// ─── Day Container ────────────────────────────────────────────────────────────

interface CalendarItemDayContainerProps {
  children: ReactNode;
  isStartOfWeek: boolean;
  daySpacing: number;
  dayHeight: number;
  metadata?: CalendarDayMetadata;
}

const CalendarItemDayContainer = memo(({
  children,
  isStartOfWeek,
  daySpacing,
  dayHeight,
}: CalendarItemDayContainerProps) => {
  const spacerStyles = useMemo<ViewStyle>(() => ({
    position: "relative",
    marginLeft: isStartOfWeek ? 0 : daySpacing,
    flex: 1,
    height: dayHeight,
  }), [dayHeight, daySpacing, isStartOfWeek]);
  return <View style={spacerStyles}>{children}</View>;
});

// ─── Day with Container ───────────────────────────────────────────────────────

interface CalendarItemDayWithContainerProps extends Omit<CalendarItemDayProps, "height"> {
  daySpacing: number;
  dayHeight: number;
  calendarInstanceId?: string;
}

const CalendarItemDayWithContainer = memo(({
  metadata: baseMetadata,
  data,
  onPress,
  dayHeight,
  daySpacing,
  calendarInstanceId,
  CalendarPressableComponent,
}: CalendarItemDayWithContainerProps) => {
  const metadata = useOptimizedDayMetadata(baseMetadata, calendarInstanceId);
  return (
    <CalendarItemDayContainer dayHeight={dayHeight} daySpacing={daySpacing} isStartOfWeek={metadata.isStartOfWeek} metadata={metadata}>
      <CalendarItemDay
        CalendarPressableComponent={CalendarPressableComponent}
        height={dayHeight}
        metadata={metadata}
        data={data}
        onPress={onPress}
      />
    </CalendarItemDayContainer>
  );
});

// ─── Calendar (single month) ──────────────────────────────────────────────────

export interface CalendarProps extends UseCalendarParams {
  calendarInstanceId?: string;
  calendarRowVerticalSpacing?: number;
  calendarRowHorizontalSpacing?: number;
  calendarDayHeight?: number;
  calendarWeekHeaderHeight?: number;
  calendarMonthHeaderHeight?: number;
  calendarColorScheme?: ColorSchemeName;
  onCalendarDayPress: (dateId: string) => void;
  CalendarPressableComponent?: PressableLike;
}

const BaseCalendar = memo(function BaseCalendar(props: CalendarProps) {
  const {
    calendarInstanceId,
    calendarRowVerticalSpacing = 4,
    calendarRowHorizontalSpacing = 4,
    calendarDayHeight = 32,
    calendarMonthHeaderHeight = 20,
    calendarWeekHeaderHeight = calendarDayHeight,
    onCalendarDayPress,
    CalendarPressableComponent,
    calendarDayData,
    ...buildCalendarParams
  } = props;

  // Memoize weeksList only based on structurally relevant params
  const { calendarRowMonth, weeksList, weekDaysList } = useMemo(
    () => buildCalendar(buildCalendarParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      buildCalendarParams.calendarMonthId,
      buildCalendarParams.calendarFirstDayOfWeek,
      buildCalendarParams.calendarMinDateId,
      buildCalendarParams.calendarMaxDateId,
      buildCalendarParams.calendarDisabledDateIds,
      buildCalendarParams.calendarActiveDateRanges,
    ]
  );

  return (
    <VStack alignItems="center" spacing={calendarRowVerticalSpacing}>
      <CalendarRowMonth height={calendarMonthHeaderHeight}>
        {uppercaseFirstLetter(calendarRowMonth)}
      </CalendarRowMonth>
      <CalendarRowWeek spacing={8}>
        {weekDaysList.map((day, i) => (
          <CalendarItemWeekName key={i} height={calendarWeekHeaderHeight}>{day}</CalendarItemWeekName>
        ))}
      </CalendarRowWeek>
      {weeksList.map((week, i) => (
        <CalendarRowWeek key={i}>
          {week.map((dayProps) =>
            dayProps.isDifferentMonth ? (
              <CalendarItemDayContainer
                dayHeight={calendarDayHeight}
                daySpacing={calendarRowHorizontalSpacing}
                isStartOfWeek={dayProps.isStartOfWeek}
                key={dayProps.id}
                metadata={dayProps}
              >
                <CalendarItemEmpty height={calendarDayHeight} />
              </CalendarItemDayContainer>
            ) : (
              <CalendarItemDayWithContainer
                CalendarPressableComponent={CalendarPressableComponent}
                calendarInstanceId={calendarInstanceId}
                dayHeight={calendarDayHeight}
                daySpacing={calendarRowHorizontalSpacing}
                key={dayProps.id}
                metadata={dayProps}
                data={calendarDayData?.[dayProps.id]}
                onPress={onCalendarDayPress}
              />
            )
          )}
        </CalendarRowWeek>
      ))}
    </VStack>
  );
});

const SingleMonthCalendar = memo(function SingleMonthCalendar(props: CalendarProps) {
  const { calendarInstanceId, calendarActiveDateRanges, calendarMonthId, calendarColorScheme, ...rest } = props;
  useEffect(() => {
    activeDateRangesEmitter.emit("onSetActiveDateRanges", {
      instanceId: calendarInstanceId,
      ranges: calendarActiveDateRanges ?? [],
    });
  }, [calendarActiveDateRanges, calendarInstanceId, calendarMonthId]);
  return (
    <CalendarThemeProvider colorScheme={calendarColorScheme}>
      <BaseCalendar {...rest} calendarInstanceId={calendarInstanceId} calendarMonthId={calendarMonthId} />
    </CalendarThemeProvider>
  );
});

// ─── CalendarList (scrollable, infinite) ─────────────────────────────────────

export type CalendarMonthEnhanced = CalendarMonth & {
  calendarProps: Omit<CalendarProps, "calendarMonthId">;
};

export interface CalendarListRef {
  scrollToMonth: (date: Date, animated: boolean, params?: { additionalOffset?: number }) => void;
  scrollToDate: (date: Date, animated: boolean, params?: { additionalOffset?: number }) => void;
  scrollToOffset: (offset: number, animated: boolean) => void;
}

export interface CalendarListProps
  extends Omit<CalendarProps, "calendarMonthId">,
    Omit<FlashListProps<CalendarMonthEnhanced>, "renderItem" | "data"> {
  calendarPastScrollRangeInMonths?: number;
  calendarFutureScrollRangeInMonths?: number;
  calendarAdditionalHeight?: number;
  calendarSpacing?: number;
  calendarInitialMonthId?: string;
  CalendarScrollComponent?: typeof FlashList;
  renderItem?: FlashListProps<CalendarMonthEnhanced>["renderItem"];
}

const keyExtractor = (month: CalendarMonth) => month.id;

export const CalendarList = memo(
  forwardRef(function CalendarList(props: CalendarListProps, ref: Ref<CalendarListRef>) {
    const {
      calendarInitialMonthId,
      calendarPastScrollRangeInMonths = 12,
      calendarFutureScrollRangeInMonths = 12,
      calendarFirstDayOfWeek = "sunday",
      CalendarScrollComponent = FlashList,
      calendarFormatLocale,
      calendarSpacing = 20,
      calendarRowHorizontalSpacing,
      calendarRowVerticalSpacing = 4,
      calendarMonthHeaderHeight = 20,
      calendarDayHeight = 32,
      calendarWeekHeaderHeight = calendarDayHeight,
      calendarAdditionalHeight = 0,
      calendarColorScheme,
      onEndReached,
      ...otherProps
    } = props;

    const {
      calendarActiveDateRanges,
      calendarDisabledDateIds,
      calendarInstanceId,
      calendarMaxDateId,
      calendarMinDateId,
      getCalendarDayFormat,
      getCalendarMonthFormat,
      getCalendarWeekDayFormat,
      onCalendarDayPress,
      CalendarPressableComponent,
      calendarDayData,
      ...flatListProps
    } = otherProps;

    const calendarProps = useMemo(
      (): CalendarMonthEnhanced["calendarProps"] => ({
        calendarActiveDateRanges,
        calendarColorScheme,
        calendarDayHeight,
        calendarDisabledDateIds,
        calendarFirstDayOfWeek,
        calendarFormatLocale,
        calendarInstanceId,
        calendarMaxDateId,
        calendarMinDateId,
        calendarMonthHeaderHeight,
        calendarRowHorizontalSpacing,
        calendarRowVerticalSpacing,
        calendarWeekHeaderHeight,
        getCalendarDayFormat,
        getCalendarMonthFormat,
        getCalendarWeekDayFormat,
        onCalendarDayPress,
        CalendarPressableComponent,
        calendarDayData,
      }),
      [
        calendarColorScheme,
        calendarActiveDateRanges,
        calendarDayHeight,
        calendarDisabledDateIds,
        calendarFirstDayOfWeek,
        calendarFormatLocale,
        calendarMaxDateId,
        calendarMinDateId,
        calendarMonthHeaderHeight,
        calendarRowHorizontalSpacing,
        calendarRowVerticalSpacing,
        calendarWeekHeaderHeight,
        getCalendarDayFormat,
        getCalendarMonthFormat,
        getCalendarWeekDayFormat,
        calendarInstanceId,
        onCalendarDayPress,
        CalendarPressableComponent,
        calendarDayData,
      ]
    );

    const { initialMonthIndex, monthList, appendMonths, addMissingMonths } = useCalendarList({
      calendarFirstDayOfWeek,
      calendarFutureScrollRangeInMonths,
      calendarPastScrollRangeInMonths,
      calendarInitialMonthId,
      calendarMaxDateId,
      calendarMinDateId,
    });

    const monthListWithCalendarProps = useMemo(() =>
      monthList.map((month) => ({ ...month, calendarProps })),
      [calendarProps, monthList]
    );

    const handleOnEndReached = useCallback(() => {
      appendMonths(calendarFutureScrollRangeInMonths);
      onEndReached?.();
    }, [appendMonths, calendarFutureScrollRangeInMonths, onEndReached]);

    const getScrollOffsetForMonth = useCallback(
      (date: Date) => {
        const monthId = toDateId(startOfMonth(date));
        let baseList = monthList;
        let index = baseList.findIndex((m) => m.id === monthId);
        if (index === -1) {
          baseList = addMissingMonths(monthId);
          index = baseList.findIndex((m) => m.id === monthId);
        }
        return baseList.slice(0, index).reduce((acc, month) => {
          return acc + getHeightForMonth({
            calendarMonth: month,
            calendarSpacing,
            calendarDayHeight,
            calendarMonthHeaderHeight,
            calendarRowVerticalSpacing,
            calendarWeekHeaderHeight,
            calendarAdditionalHeight,
          });
        }, 0);
      },
      [addMissingMonths, calendarAdditionalHeight, calendarDayHeight, calendarMonthHeaderHeight, calendarRowVerticalSpacing, calendarSpacing, calendarWeekHeaderHeight, monthList]
    );

    const flashListRef = useRef<FlashListRef<CalendarMonthEnhanced>>(null);

    useLayoutEffect(() => {
      if (initialMonthIndex <= 0) return;
      flashListRef.current?.scrollToIndex({ index: initialMonthIndex, animated: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      scrollToMonth(date, animated, { additionalOffset = 0 } = {}) {
        setTimeout(() => {
          flashListRef.current?.scrollToOffset({
            offset: getScrollOffsetForMonth(date) + additionalOffset,
            animated,
          });
        }, 0);
      },
      scrollToDate(date, animated, { additionalOffset = 0 } = {}) {
        const monthOffset = getScrollOffsetForMonth(date);
        const weekIndex = getWeekOfMonth(date, calendarFirstDayOfWeek);
        let weekOffset = calendarWeekHeaderHeight + (calendarDayHeight + calendarRowVerticalSpacing) * weekIndex;
        weekOffset -= calendarRowVerticalSpacing;
        flashListRef.current?.scrollToOffset({ offset: monthOffset + weekOffset + additionalOffset, animated });
      },
      scrollToOffset(offset, animated) {
        flashListRef.current?.scrollToOffset({ offset, animated });
      },
    }));

    const containerStyle = useMemo(() => ({ paddingBottom: calendarSpacing }), [calendarSpacing]);

    return (
      <CalendarScrollComponent
        data={monthListWithCalendarProps}
        initialScrollIndex={initialMonthIndex}
        keyExtractor={keyExtractor}
        onEndReached={handleOnEndReached}
        ref={flashListRef}
        renderItem={({ item }) => (
          <View style={containerStyle}>
            <SingleMonthCalendar calendarMonthId={item.id} {...item.calendarProps} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        {...flatListProps}
      />
    );
  })
);

// ─── Main export: Calendar = CalendarList ─────────────────────────────────────

export { CalendarList as Calendar };
