import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subMonths, isAfter } from 'date-fns';
import { useStore } from '../../src/store/useStore';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';
import { useRouter } from 'expo-router';

type TimeFilter = 'all' | '30days' | '3months' | '6months' | 'year';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, items, deleteHistoryRecord } = useStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const filtered = useMemo(() => {
    const now = new Date();
    return history.filter((h) => {
      if (timeFilter === 'all') return true;
      const date = parseISO(h.completedDate);
      if (timeFilter === '30days') return isAfter(date, subMonths(now, 1));
      if (timeFilter === '3months') return isAfter(date, subMonths(now, 3));
      if (timeFilter === '6months') return isAfter(date, subMonths(now, 6));
      if (timeFilter === 'year') return isAfter(date, subMonths(now, 12));
      return true;
    });
  }, [history, timeFilter]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const h of filtered) {
      const key = format(parseISO(h.completedDate), 'MMMM yyyy');
      map.set(key, [...(map.get(key) ?? []), h]);
    }
    return Array.from(map.entries()).map(([month, records]) => ({ month, records }));
  }, [filtered]);

  const totalCost = useMemo(
    () => filtered.reduce((sum, h) => sum + (h.cost ?? 0), 0),
    [filtered]
  );

  function confirmDelete(id: string, itemName: string) {
    Alert.alert(
      'Delete Record',
      `Remove this completion record for "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHistoryRecord(id),
        },
      ]
    );
  }

  const TIME_FILTERS: Array<{ key: TimeFilter; label: string }> = [
    { key: 'all', label: 'All Time' },
    { key: '30days', label: '30 Days' },
    { key: '3months', label: '3 Months' },
    { key: '6months', label: '6 Months' },
    { key: 'year', label: '1 Year' },
  ];

  return (
    <View style={styles.container}>
      {/* Time Filter */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {TIME_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, timeFilter === f.key && styles.filterChipActive]}
              onPress={() => setTimeFilter(f.key)}
            >
              <Text style={[styles.filterText, timeFilter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary Bar */}
      {filtered.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
            <Text style={styles.summaryLabel}>Tasks Done</Text>
          </View>
          {totalCost > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalCost.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Total Cost</Text>
            </View>
          )}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{new Set(filtered.map((h) => h.itemId)).size}</Text>
            <Text style={styles.summaryLabel}>Unique Items</Text>
          </View>
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="time-outline"
            title="No history yet"
            subtitle="Mark maintenance tasks as done to see your completion history here."
          />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {grouped.map((group) => (
            <View key={group.month} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{group.month}</Text>
                <Text style={styles.monthCount}>{group.records.length} completed</Text>
              </View>
              {group.records.map((record) => {
                const item = itemMap.get(record.itemId);
                return (
                  <View key={record.id} style={styles.recordCard}>
                    <View
                      style={[
                        styles.recordAccent,
                        { backgroundColor: item?.color ?? Colors.textMuted },
                      ]}
                    />
                    <View style={styles.recordBody}>
                      <TouchableOpacity
                        onPress={() => item && router.push(`/item/${item.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.recordName}>
                          {item?.name ?? 'Deleted Item'}
                        </Text>
                        <Text style={styles.recordDate}>
                          {format(parseISO(record.completedDate), 'EEEE, MMM d · h:mm a')}
                        </Text>
                        {record.notes ? (
                          <Text style={styles.recordNotes}>{record.notes}</Text>
                        ) : null}
                        {record.cost != null && (
                          <View style={styles.costBadge}>
                            <Ionicons name="cash-outline" size={12} color={Colors.success} />
                            <Text style={styles.costText}>${record.cost.toFixed(2)}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDelete(record.id, item?.name ?? 'this item')}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.textInverse },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyContainer: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingBottom: Spacing.xxl },
  monthGroup: { marginTop: Spacing.md },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  monthTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  monthCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recordAccent: { width: 4 },
  recordBody: { flex: 1, padding: Spacing.md, gap: 2 },
  recordName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  recordDate: { fontSize: FontSize.sm, color: Colors.textMuted },
  recordNotes: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  costText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  deleteBtn: {
    padding: Spacing.md,
    justifyContent: 'center',
  },
});
