import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAppStore } from '../../store';
import { format, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const { locationEntries, jurisdictions, selectedYear } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(
    `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  // Build marked dates from location entries
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    locationEntries.forEach((entry) => {
      const jurisdiction = jurisdictions.find(
        (j) =>
          j.id === entry.jurisdictionId ||
          j.name.toLowerCase() === entry.jurisdictionName?.toLowerCase() ||
          j.state?.toLowerCase() === entry.state?.toLowerCase()
      );
      const color = jurisdiction?.color || Colors.primary;
      marks[entry.date] = {
        selected: true,
        selectedColor: color,
        marked: entry.isVerified,
        dotColor: Colors.white,
      };
    });
    return marks;
  }, [locationEntries, jurisdictions]);

  // Entries for current month
  const monthEntries = useMemo(() => {
    return locationEntries
      .filter((e) => e.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [locationEntries, selectedMonth]);

  // Month stats
  const monthStats = useMemo(() => {
    const jurisdictionDays: Record<string, number> = {};
    monthEntries.forEach((e) => {
      const key = e.jurisdictionName || e.state || e.country || 'Unknown';
      jurisdictionDays[key] = (jurisdictionDays[key] || 0) + 1;
    });
    return Object.entries(jurisdictionDays).sort((a, b) => b[1] - a[1]);
  }, [monthEntries]);

  return (
    <LinearGradient colors={['#0C0C0E', '#0D1520', '#0C0C0E']} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddLocation', {})}
          >
            <LinearGradient colors={Colors.gradientPrimary} style={styles.addBtnGradient}>
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addBtnText}>Log Day</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Calendar */}
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: Colors.textTertiary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textTertiary,
              monthTextColor: Colors.textPrimary,
              arrowColor: Colors.primary,
              dotColor: Colors.white,
              selectedDotColor: Colors.white,
              indicatorColor: Colors.primary,
            }}
            markedDates={markedDates}
            onDayPress={(day: any) => {
              const entry = locationEntries.find((e) => e.date === day.dateString);
              if (entry) {
                navigation.navigate('DayDetail', { date: day.dateString });
              } else {
                navigation.navigate('AddLocation', { date: day.dateString });
              }
            }}
            onMonthChange={(month: any) => {
              setSelectedMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
            }}
            enableSwipeMonths
          />

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Jurisdictions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.legendItems}>
                {jurisdictions.slice(0, 6).map((j) => (
                  <View key={j.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: j.color }]} />
                    <Text style={styles.legendLabel}>{j.name}</Text>
                  </View>
                ))}
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.textTertiary }]} />
                  <Text style={styles.legendLabel}>Unknown</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Month summary */}
          <View style={styles.monthSummary}>
            <View style={styles.monthSummaryHeader}>
              <Text style={styles.monthSummaryTitle}>
                {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}
              </Text>
              <Text style={styles.monthSummaryCount}>
                {monthEntries.length} day{monthEntries.length !== 1 ? 's' : ''} logged
              </Text>
            </View>

            {monthStats.length > 0 && (
              <View style={styles.monthStats}>
                {monthStats.map(([name, days]) => (
                  <View key={name} style={styles.monthStatRow}>
                    <Text style={styles.monthStatName}>{name}</Text>
                    <View style={styles.monthStatBar}>
                      <View
                        style={[
                          styles.monthStatFill,
                          {
                            width: `${(days / monthEntries.length) * 100}%`,
                            backgroundColor:
                              jurisdictions.find(
                                (j) =>
                                  j.name.toLowerCase() === name.toLowerCase() ||
                                  j.state?.toLowerCase() === name.toLowerCase()
                              )?.color || Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.monthStatDays}>{days}d</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recent entries */}
          <View style={styles.recentEntries}>
            <Text style={styles.recentTitle}>Recent Entries</Text>
            {monthEntries.length === 0 ? (
              <View style={styles.emptyMonth}>
                <Ionicons name="calendar-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyMonthText}>No days logged this month</Text>
                <TouchableOpacity
                  style={styles.emptyMonthBtn}
                  onPress={() => navigation.navigate('AddLocation', {})}
                >
                  <Text style={styles.emptyMonthBtnText}>Log a day</Text>
                </TouchableOpacity>
              </View>
            ) : (
              monthEntries.slice(0, 10).map((entry) => {
                const jurisdiction = jurisdictions.find(
                  (j) =>
                    j.id === entry.jurisdictionId ||
                    j.name.toLowerCase() === entry.jurisdictionName?.toLowerCase() ||
                    j.state?.toLowerCase() === entry.state?.toLowerCase()
                );
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryRow}
                    onPress={() => navigation.navigate('DayDetail', { date: entry.date })}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.entryDateBox,
                        { backgroundColor: (jurisdiction?.color || Colors.primary) + '20' },
                      ]}
                    >
                      <Text style={[styles.entryDay, { color: jurisdiction?.color || Colors.primary }]}>
                        {format(parseISO(entry.date), 'd')}
                      </Text>
                      <Text style={[styles.entryDayOfWeek, { color: jurisdiction?.color || Colors.primary }]}>
                        {format(parseISO(entry.date), 'EEE')}
                      </Text>
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryLocation}>
                        {entry.city || entry.jurisdictionName || entry.state || 'Unknown'}
                      </Text>
                      <Text style={styles.entryState}>
                        {entry.state || entry.country || ''}
                        {entry.isVerified && (
                          <Text style={styles.verifiedTag}> ✓ Verified</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.entryType}>
                      <Ionicons
                        name={
                          entry.activityType === 'work' ? 'briefcase-outline' :
                          entry.activityType === 'transit' ? 'airplane-outline' :
                          'sunny-outline'
                        }
                        size={16}
                        color={Colors.textTertiary}
                      />
                      <Text style={styles.entryTypeTxt}>
                        {entry.source === 'import' ? 'Imported' :
                         entry.source === 'auto' ? 'Auto' : 'Manual'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  addBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.white },

  calendar: { marginHorizontal: Spacing.sm },

  legend: { paddingHorizontal: Spacing.base, marginTop: Spacing.sm, gap: Spacing.sm },
  legendTitle: { fontSize: Typography.xs, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  legendItems: { flexDirection: 'row', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: Typography.xs, color: Colors.textSecondary },

  monthSummary: {
    margin: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  monthSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthSummaryTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textPrimary },
  monthSummaryCount: { fontSize: Typography.xs, color: Colors.textTertiary },
  monthStats: { gap: Spacing.sm },
  monthStatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  monthStatName: { fontSize: Typography.xs, color: Colors.textSecondary, width: 100 },
  monthStatBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  monthStatFill: { height: '100%', borderRadius: 3 },
  monthStatDays: { fontSize: Typography.xs, color: Colors.textTertiary, width: 24, textAlign: 'right' },

  recentEntries: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  recentTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryDateBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDay: { fontSize: Typography.md, fontWeight: Typography.bold },
  entryDayOfWeek: { fontSize: 9, fontWeight: Typography.medium, textTransform: 'uppercase' },
  entryInfo: { flex: 1 },
  entryLocation: { fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  entryState: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  verifiedTag: { color: Colors.secondary },
  entryType: { alignItems: 'center', gap: 2 },
  entryTypeTxt: { fontSize: 9, color: Colors.textTertiary },

  emptyMonth: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyMonthText: { fontSize: Typography.sm, color: Colors.textTertiary },
  emptyMonthBtn: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  emptyMonthBtnText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: Typography.semibold },
});
