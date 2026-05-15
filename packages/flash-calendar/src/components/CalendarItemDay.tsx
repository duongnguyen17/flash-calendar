import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import type { TextProps, TextStyle, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BaseTheme } from "@/helpers/tokens";
import type { CalendarDayMetadata } from "@/hooks/useCalendar";
import { useOptimizedDayMetadata } from "@/hooks/useOptimizedDayMetadata";
import { useTheme } from "@/hooks/useTheme";

import type { PressableLike } from "./Calendar";

// react-native-web/overrides.ts
declare module "react-native" {
  interface PressableStateCallbackType {
    hovered?: boolean;
    focused?: boolean;
  }
}

const styles = StyleSheet.create({
  baseContainer: {
    padding: 4,
    borderRadius: 8,
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#eceaeaff",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dayColumn: {
    flexDirection: "column",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  lunarText: {
    fontSize: 10,
    color: "#9e9d9dff",
    marginTop: -2,
  },
  airlineBadge: {
    backgroundColor: "#fdfdfdff",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  airlineText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  priceRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  emptyText: {
    fontSize: 8,
    fontWeight: "300",
  },
  emptyTextPrice: {
    fontSize: 10,
    fontWeight: "300",
  },
});

export type DayState = "idle" | "active" | "today" | "disabled";

interface DayTheme {
  container: Omit<ViewStyle, "borderRadius">;
  content: TextStyle;
}
type CalendarItemDayTheme = Record<
  DayState,
  (params: {
    isStartOfRange: boolean;
    isEndOfRange: boolean;
    isPressed: boolean;
    isHovered?: boolean;
    isFocused?: boolean;
  }) => DayTheme
>;

const buildBaseStyles = (theme: BaseTheme): CalendarItemDayTheme => {
  const baseContent = {
    ...styles.baseContent,
    color: theme.colors.content.primary,
  };

  return {
    active: ({ isPressed, isHovered, isStartOfRange, isEndOfRange }) => {
      const baseStyles: DayTheme & { container: ViewStyle } =
        isPressed || isHovered
          ? {
              container: {
                ...styles.baseContainer,
                backgroundColor: theme.colors.background.tertiary,
              },
              content: {
                ...baseContent,
                color: theme.colors.content.primary,
              },
            }
          : {
              container: {
                ...styles.baseContainer,
                backgroundColor: theme.colors.background.inverse.primary,
              },
              content: {
                ...baseContent,
                color: theme.colors.content.inverse.primary,
              },
            };

      baseStyles.container.borderRadius = 0;
      if (isStartOfRange) {
        baseStyles.container.borderTopLeftRadius = 16;
        baseStyles.container.borderBottomLeftRadius = 16;
      }
      if (isEndOfRange) {
        baseStyles.container.borderTopRightRadius = 16;
        baseStyles.container.borderBottomRightRadius = 16;
      }
      if (!isStartOfRange && !isEndOfRange) {
        baseStyles.container.borderRadius = 0;
      }
      return baseStyles;
    },
    disabled: () => ({
      container: styles.baseContainer,
      content: {
        ...baseContent,
        color: theme.colors.content.disabled,
      },
    }),
    idle: ({ isPressed, isHovered }) => {
      return isPressed || isHovered
        ? {
            container: {
              ...styles.baseContainer,
              backgroundColor: theme.colors.background.tertiary,
            },
            content: {
              ...baseContent,
              color: theme.colors.content.primary,
            },
          }
        : {
            container: styles.baseContainer,
            content: baseContent,
          };
    },
    today: ({ isPressed, isHovered }) => {
      return isPressed || isHovered
        ? {
            container: {
              ...styles.baseContainer,
              backgroundColor: theme.colors.background.tertiaryPressed,
            },
            content: baseContent,
          }
        : {
            container: {
              ...styles.baseContainer,
              borderColor: theme.colors.borders.default,
              borderStyle: "solid",
              borderWidth: 1,
            },
            content: baseContent,
          };
    },
  };
};

export interface CalendarItemDayProps {
  onPress: (id: string) => void;

  metadata: CalendarDayMetadata;
  theme?: Partial<
    Record<
      DayState | "base",
      (
        params: CalendarDayMetadata & {
          isPressed: boolean;
          isHovered?: boolean;
          isFocused?: boolean;
        }
      ) => Partial<DayTheme>
    >
  >;
  /** The cell's height */
  height: number;
  /** Optional TextProps to spread to the <Text> component. */
  textProps?: Omit<TextProps, "children" | "onPress">;
  /** Optional component to replace the default <Pressable> component. */
  CalendarPressableComponent?: PressableLike;
}

/**
 * The base calendar item day component. This component is responsible for
 * rendering each day cell, along with its event handlers.
 *
 * This is not meant to be used directly. Instead, use the
 * `CalendarItemDayWithContainer`, since it also includes the spacing between
 * each day.
 */
import { abbreviateFare } from "@/helpers/numbers";

export const CalendarItemDay = ({
  onPress,
  theme,
  height,
  metadata,
  CalendarPressableComponent = Pressable as PressableLike,
}: CalendarItemDayProps) => {
  const baseTheme = useTheme();

  const handlePress = useCallback(() => {
    onPress(metadata.id);
  }, [metadata.id, onPress]);

  const { price, airline, isCheapest, isMostExpensive } = metadata.data ?? {};

  const backgroundColor = useMemo(() => {
    if (isCheapest) return "#E8F5E9"; // Very light green
    if (isMostExpensive) return "#FFEBEE"; // Very light red
    return "#fafafaff"; // Darker grey requested by user
  }, [isCheapest, isMostExpensive]);

  const formattedPrice = abbreviateFare(price);
  const displayAirline = airline ?? "--";
  const isPriceEmpty = formattedPrice === "--";
  const isAirlineEmpty = displayAirline === "--";

  return (
    <CalendarPressableComponent
      disabled={metadata.state === "disabled"}
      onPress={handlePress}
      style={({ pressed: isPressed }) => [
        styles.baseContainer,
        {
          height,
          backgroundColor: isPressed
            ? baseTheme.colors.background.tertiary
            : backgroundColor,
          opacity: metadata.state === "disabled" ? 0.3 : 1,
        },
        theme?.base?.({ ...metadata, isPressed }).container,
        theme?.[metadata.state]?.({ ...metadata, isPressed }).container,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.dayColumn}>
          <Text style={styles.dayText}>{metadata.displayLabel}</Text>
          <Text style={styles.lunarText}>{metadata.displayLabel}</Text>
        </View>
        <View style={styles.airlineBadge}>
          <Text
            style={[styles.airlineText, isAirlineEmpty && styles.emptyText]}
          >
            {displayAirline}
          </Text>
        </View>
      </View>
      <View style={styles.priceRow}>
        <Text style={[styles.priceText, isPriceEmpty && styles.emptyTextPrice]}>
          {formattedPrice}
        </Text>
      </View>
    </CalendarPressableComponent>
  );
};

interface CalendarItemDayContainerTheme {
  /** An empty view that acts as a spacer between each day. The spacing is
   * controlled by the `daySpacing` prop. */
  spacer?: ViewStyle;
  /** An absolute positioned filler to join the active days together in a single
   * complete range. */
  activeDayFiller?: ViewStyle | ((params: CalendarDayMetadata) => ViewStyle);
}

export interface CalendarItemDayContainerProps {
  children: ReactNode;
  isStartOfWeek: boolean;
  /**
   * If true, the active day filler/extension will be shown. The filler is used
   * as a visual effect to join the active days together in a complete range.
   */
  shouldShowActiveDayFiller?: boolean;
  theme?: CalendarItemDayContainerTheme;
  /**
   * The spacing between each day
   */
  daySpacing: number;
  /** The day's height */
  dayHeight: number;
  /** The metadata for the day, extracted from the calendar's state. */
  metadata?: CalendarDayMetadata;
}

export const CalendarItemDayContainer = ({
  children,
  isStartOfWeek,
  shouldShowActiveDayFiller,
  theme,
  daySpacing,
  dayHeight,
  metadata,
}: CalendarItemDayContainerProps) => {
  const baseTheme = useTheme();
  const spacerStyles = useMemo<ViewStyle>(() => {
    return {
      position: "relative",
      marginLeft: isStartOfWeek ? 0 : daySpacing,
      flex: 1,
      height: dayHeight,
      ...theme?.spacer,
    };
  }, [dayHeight, daySpacing, isStartOfWeek, theme?.spacer]);

  const activeDayFiller = useMemo<ViewStyle | null>(() => {
    if (!shouldShowActiveDayFiller) {
      return null;
    }

    return {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: -(daySpacing + 1), // +1 to cover the 1px gap
      width: daySpacing + 2, // +2 to cover the 1px gap (distributes evenly on both sides)
      backgroundColor: baseTheme.colors.background.inverse.primary,
      ...(typeof theme?.activeDayFiller === "function" && !!metadata
        ? theme.activeDayFiller(metadata)
        : theme?.activeDayFiller),
    };
  }, [
    baseTheme.colors.background.inverse.primary,
    daySpacing,
    metadata,
    shouldShowActiveDayFiller,
    theme,
  ]);

  return (
    <View style={spacerStyles}>
      {children}
      {activeDayFiller ? <View style={activeDayFiller} /> : null}
    </View>
  );
};

export interface CalendarItemDayWithContainerProps
  extends Omit<CalendarItemDayProps, "height">,
    Pick<CalendarItemDayContainerProps, "daySpacing" | "dayHeight"> {
  containerTheme?: CalendarItemDayContainerTheme;
  /**
   * A unique identifier for this calendar instance. This is useful if you
   * need to render more than one calendar at once. This allows Flash Calendar
   * to scope its state to the given instance.
   *
   * No need to get fancy with `uuid` or anything like that - a simple static
   * string is enough.
   *
   * If not provided, Flash Calendar will use a default value which will hoist
   * the state in a global scope.
   */
  calendarInstanceId?: string;
}

export const CalendarItemDayWithContainer = ({
  metadata: baseMetadata,
  onPress,
  theme,
  dayHeight,
  daySpacing,
  containerTheme,
  calendarInstanceId,
  CalendarPressableComponent,
}: CalendarItemDayWithContainerProps) => {
  const metadata = useOptimizedDayMetadata(baseMetadata, calendarInstanceId);

  return (
    <CalendarItemDayContainer
      dayHeight={dayHeight}
      daySpacing={daySpacing}
      isStartOfWeek={metadata.isStartOfWeek}
      metadata={metadata}
      shouldShowActiveDayFiller={
        metadata.isRangeValid && !metadata.isEndOfWeek
          ? !metadata.isEndOfRange
          : false
      }
      theme={containerTheme}
    >
      <CalendarItemDay
        CalendarPressableComponent={CalendarPressableComponent}
        height={dayHeight}
        metadata={metadata}
        onPress={onPress}
        theme={theme}
      />
    </CalendarItemDayContainer>
  );
};
