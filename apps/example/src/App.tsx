import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { Calendar, useDateRange, toDateId } from "./FlightCalendar";

const INITIAL_DATA = {
  "2026-05-12": { price: 12080000, airline: "VN", isCheapest: true },
  "2026-05-15": { price: 15000000, airline: "VJ", isMostExpensive: true },
  "2026-05-20": { price: 9500000, airline: "QH" },
  "2026-05-22": { price: 7800000, airline: "VJ" },
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [dayData, setDayData] = useState<Record<string, any>>(INITIAL_DATA);

  const { calendarActiveDateRanges, onCalendarDayPress, selectedDateId } =
    useDateRange();

  const updateRandomPrice = useCallback(() => {
    const today = new Date();
    // Randomly pick a day in the next 30 days
    const randomDay = new Date(today);
    randomDay.setDate(today.getDate() + Math.floor(Math.random() * 60));
    const dateId = toDateId(randomDay);

    const newPrice = Math.floor(Math.random() * 20000000) + 1000000;
    
    console.log(`[Test] Updating price for ${dateId} to ${newPrice}`);

    setDayData((prev) => ({
      ...prev,
      [dateId]: {
        ...prev[dateId],
        price: newPrice,
      },
    }));
  }, []);

  const clearAllPrices = useCallback(() => {
    setDayData({});
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {!isLandscape && (
        <View style={styles.header}>
          <Text style={styles.title}>Flight Calendar</Text>
          <Text style={styles.subtitle}>
            Selected: {selectedDateId ?? "None"}
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={updateRandomPrice}>
              <Text style={styles.buttonText}>Random Price Change</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearAllPrices}>
              <Text style={styles.buttonText}>Clear Prices</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.calendarContainer}>
        <Calendar
          calendarActiveDateRanges={calendarActiveDateRanges}
          onCalendarDayPress={onCalendarDayPress}
          calendarSpacing={isLandscape ? 10 : 20}
          calendarDayHeight={isLandscape ? 40 : 55}
          calendarDayData={dayData}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  calendarContainer: {
    flex: 1,
  },
});
