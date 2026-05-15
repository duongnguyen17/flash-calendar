# FlightCalendar Architecture & Documentation

## Overview
`FlightCalendar` is a highly performant, self-contained React Native calendar component specifically designed for flight booking applications. It supports infinite scrolling, dynamic price rendering, and is optimized to handle high-frequency data updates (e.g., price changes) and interactions without visual lag.

## File Structure
The component is organized into four core files to ensure separation of concerns and ease of integration:

1.  **`index.ts`**: The public entry point. It exports the primary components (`Calendar`), hooks (`useDateRange`), and types needed by the rest of the application.
2.  **`types.ts`**: The "Source of Truth" for data structures and utility functions.
    *   Contains all TypeScript interfaces.
    *   Includes date/number helpers (inline) to avoid external dependency issues.
    *   Defines the `abbreviateFare` logic (e.g., 1.2tr, 850k).
3.  **`calendar.logic.ts`**: Pure business logic and performance hooks.
    *   Calculates the calendar grid (skeleton).
    *   Manages the infinite scroll list state.
    *   Implements an **Event-Emitter** based update system for selection to achieve O(1) rendering performance.
4.  **`Calendar.tsx`**: UI Layer.
    *   Contains Atomic components (`CalendarItemDay`, `CalendarRowMonth`, etc.).
    *   Integrates with `@shopify/flash-list` for virtualization.
    *   Implements strict memoization strategies.

---

## Key Performance Architectures

### 1. Skeleton & Data Separation
Unlike standard calendars where data is embedded into the date object, `FlightCalendar` treats the **Calendar Grid (Skeleton)** and **Price Data** as two independent streams:
*   **Skeleton:** Memoized based only on structural parameters (Month ID, First Day of Week). It does NOT re-calculate when prices change.
*   **Price Data:** Passed as a separate dictionary (`calendarDayData`). Each day cell looks up its own data via ID.
*   **Benefit:** When a single price updates, **only that specific day cell re-renders**. The rest of the month and other months remain untouched in the virtual DOM.

### 2. Event-Driven Selection (Optimized Selection)
Standard React state updates for selection usually trigger a re-render of the entire month. We use `mitt` (event emitter) to bypass this:
*   When a day is pressed, an event is emitted with the new selection range.
*   Each `CalendarItemDay` subscribes to this event and updates its internal state *only if* it is affected by the change (i.e., it was selected or is now selected).
*   **Benefit:** O(1) or O(2) rendering cost for selection interactions.

### 3. Virtualization with FlashList
The main `Calendar` component is actually a `CalendarList` powered by `@shopify/flash-list`.
*   It supports prepending and appending months dynamically.
*   Height calculations are pre-computed (via `getHeightForMonth`) to ensure smooth scrolling without "jumps".

---

## Business Logic & UI Rules

*   **Price Formatting:** Prices are shortened using `abbreviateFare`.
    *   `> 1,000,000,000` -> `1.2t`
    *   `> 1,000,000` -> `1.2tr`
    *   `> 1,000` -> `120k`
*   **Color Coding:**
    *   **No Price:** Background `#fafafa`, component disabled (cannot press).
    *   **Cheapest:** Background light green (`#E8F5E9`).
    *   **Most Expensive:** Background light red (`#FFEBEE`).
    *   **Normal:** Background light gray (`#f2f2f2`).
*   **Selection:** Currently optimized for **Single Date Selection** via the `useDateRange` hook.

---

## Integration Guide

### External Dependencies
*   `@shopify/flash-list`: For virtualized list performance.
*   `mitt`: For the event-driven update system.

### Basic Usage
```tsx
import { Calendar, useDateRange } from "./FlightCalendar";

const MyComponent = () => {
  const { calendarActiveDateRanges, onCalendarDayPress } = useDateRange();
  
  return (
    <Calendar
      calendarActiveDateRanges={calendarActiveDateRanges}
      onCalendarDayPress={onCalendarDayPress}
      calendarDayData={{
        "2026-05-20": { price: 1500000, isCheapest: true }
      }}
    />
  );
};
```

## Maintenance Notes for AI Agents
*   **Adding new day data:** If you need to add things like "Seat availability" or "Flight Icons", add the field to `CalendarDayData` in `types.ts` and update the render logic in `CalendarItemDay` inside `Calendar.tsx`.
*   **Changing Render Performance:** Do NOT remove the `useMemo` with specific dependencies in `BaseCalendar` (within `Calendar.tsx`), as it is critical for preventing skeleton re-builds.
