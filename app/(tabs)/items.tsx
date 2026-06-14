import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, getItemStatus } from '../../src/store/useStore';
import { MaintenanceCard } from '../../src/components/MaintenanceCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';
import { MaintenanceCategory, CATEGORY_META } from '../../src/types';

const ALL = 'All' as const;
type Filter = typeof ALL | MaintenanceCategory;

export default function ItemsScreen() {
  const router = useRouter();
  const { items, settings } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Filter>(ALL);
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due_soon' | 'ok'>('all');

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return [ALL, ...Array.from(cats)] as Filter[];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === ALL || item.category === selectedCategory;

      const status = getItemStatus(item, settings.dueSoonWindowDays);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'overdue' && status === 'overdue') ||
        (statusFilter === 'due_soon' && status === 'due_soon') ||
        (statusFilter === 'ok' && (status === 'ok' || status === 'never_done'));

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, selectedCategory, statusFilter, settings.dueSoonWindowDays]);

  // Group by category
  const grouped = useMemo(() => {
    if (selectedCategory !== ALL) {
      return [{ title: selectedCategory, data: filtered }];
    }
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const existing = map.get(item.category) ?? [];
      map.set(item.category, [...existing, item]);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [filtered, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search maintenance items..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            maxLength={100}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addFab}
          onPress={() => router.push('/item/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.chipRow}>
        {(['all', 'overdue', 'due_soon', 'ok'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, statusFilter === f && styles.chipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.chipText, statusFilter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : f === 'overdue' ? 'Overdue' : f === 'due_soon' ? 'Due Soon' : 'Up to Date'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        contentContainerStyle={styles.catContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            {cat !== ALL && (
              <Ionicons
                name={CATEGORY_META[cat as MaintenanceCategory].icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={selectedCategory === cat ? Colors.textInverse : Colors.textSecondary}
              />
            )}
            <Text
              style={[
                styles.catChipText,
                selectedCategory === cat && styles.catChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="search-outline"
            title="No items found"
            subtitle={search ? `No results for "${search}"` : 'Try a different filter.'}
          />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {grouped.map((group) => (
            <View key={group.title}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupCount}>{group.data.length}</Text>
              </View>
              {group.data.map((item) => (
                <MaintenanceCard key={item.id} item={item} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    padding: 0,
  },
  addFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.card,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  catList: {
    maxHeight: 46,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  catChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  groupTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
