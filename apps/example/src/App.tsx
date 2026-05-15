import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, Text } from "react-native";
import { Calendar, useDateRange } from "@marceloterreiro/flash-calendar";

export default function App() {
  const { calendarActiveDateRanges, onCalendarDayPress, dateRange } =
    useDateRange();

  const calendarDayData = {
    "2026-05-12": {
      price: 12080000,
      airline: "VN",
      isCheapest: true,
    },
    "2026-05-15": {
      price: 15000000,
      airline: "VJ",
      isMostExpensive: true,
    },
    "2026-05-20": {
      price: 9500000,
      airline: "QH",
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flash Calendar (Custom UI)</Text>
        <Text style={styles.subtitle}>
          Selected: {dateRange.startId ?? "None"} - {dateRange.endId ?? "None"}
        </Text>
      </View>
      <View style={styles.calendarContainer}>
        <Calendar
          calendarActiveDateRanges={calendarActiveDateRanges}
          onCalendarDayPress={onCalendarDayPress}
          calendarSpacing={20}
          calendarDayHeight={50}
          calendarDayData={calendarDayData}
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
  calendarContainer: {
    flex: 1,
  },
});
