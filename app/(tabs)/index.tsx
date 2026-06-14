import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, selectOverdueItems, selectDueSoonItems, selectNeverDoneItems, getItemStatus } from '../../src/store/useStore';
import { MaintenanceCard } from '../../src/components/MaintenanceCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { items, settings, isLoading, loadItems, loadHistory } = useStore();
  const overdue = selectOverdueItems(items, settings.dueSoonWindowDays);
  const dueSoon = selectDueSoonItems(items, settings.dueSoonWindowDays);
  const neverDone = selectNeverDoneItems(items);
  const okItems = items.filter(item => getItemStatus(item, settings.dueSoonWindowDays) === 'ok');

  const onRefresh = useCallback(async () => {
    await loadItems();
    await loadHistory();
  }, []);

  useEffect(() => {
    loadItems();
    loadHistory();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Home Maintenance</Text>
          <Text style={styles.subGreeting}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/item/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.statsRow}>
        <StatCard label="Overdue" value={overdue.length} color={Colors.danger} icon="alert-circle" />
        <StatCard label="Due Soon" value={dueSoon.length} color={Colors.warning} icon="time" />
        <StatCard label="Not Started" value={neverDone.length} color={Colors.textSecondary} icon="help-circle" />
        <StatCard label="Total" value={items.length} color={Colors.primary} icon="list" />
      </View>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <Section
          title="Overdue"
          icon="alert-circle"
          iconColor={Colors.danger}
          count={overdue.length}
        >
          {overdue.map((item) => (
            <MaintenanceCard key={item.id} item={item} onMarkDone={onRefresh} />
          ))}
        </Section>
      )}

      {/* Due Soon Section */}
      {dueSoon.length > 0 && (
        <Section
          title={`Due in ${settings.dueSoonWindowDays} Days`}
          icon="time"
          iconColor={Colors.warning}
          count={dueSoon.length}
        >
          {dueSoon.map((item) => (
            <MaintenanceCard key={item.id} item={item} onMarkDone={onRefresh} />
          ))}
        </Section>
      )}

      {/* Never Done Section */}
      {neverDone.length > 0 && (
        <Section
          title="Not Yet Logged"
          icon="help-circle"
          iconColor={Colors.textSecondary}
          count={neverDone.length}
          collapsible
        >
          {neverDone.map((item) => (
            <MaintenanceCard key={item.id} item={item} compact onMarkDone={onRefresh} />
          ))}
        </Section>
      )}

      {/* Up to Date Section */}
      {okItems.length > 0 && (
        <Section
          title="Up to Date"
          icon="checkmark-circle"
          iconColor={Colors.success}
          count={okItems.length}
          collapsible
        >
          {okItems.map((item) => (
            <MaintenanceCard key={item.id} item={item} compact onMarkDone={onRefresh} />
          ))}
        </Section>
      )}

      {/* All Clear */}
      {overdue.length === 0 && dueSoon.length === 0 && neverDone.length === 0 && okItems.length > 0 && items.length > 0 && (
        <View style={styles.allClear}>
          <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          <Text style={styles.allClearTitle}>All caught up!</Text>
          <Text style={styles.allClearSub}>No overdue or upcoming maintenance tasks.</Text>
        </View>
      )}

      {items.length === 0 && !isLoading && (
        <EmptyState
          icon="construct-outline"
          title="No maintenance items yet"
          subtitle="Tap + to add your first maintenance task, or items will appear after first setup."
        />
      )}

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.statCard, Shadow.sm]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  iconColor,
  count,
  collapsible = false,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  count: number;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(collapsible);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => collapsible && setCollapsed((c) => !c)}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={18} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: iconColor + '22' }]}>
            <Text style={[styles.countText, { color: iconColor }]}>{count}</Text>
          </View>
        </View>
        {collapsible && (
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={Colors.textMuted}
          />
        )}
      </TouchableOpacity>
      {!collapsed && <View style={styles.sectionItems}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textInverse + 'BB',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sectionItems: {
    gap: 0,
  },
  allClear: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  allClearTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.success,
  },
  allClearSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
