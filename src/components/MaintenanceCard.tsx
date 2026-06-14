import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { MaintenanceItem } from '../types';
import { getItemStatus } from '../store/useStore';
import { StatusBadge } from './StatusBadge';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../constants/theme';
import { useStore } from '../store/useStore';

interface Props {
  item: MaintenanceItem;
  onMarkDone?: () => void;
  compact?: boolean;
}

export function MaintenanceCard({ item, onMarkDone, compact = false }: Props) {
  const router = useRouter();
  const markDone = useStore((s) => s.markDone);
  const settings = useStore((s) => s.settings);
  const status = getItemStatus(item, settings.dueSoonWindowDays);

  const leftBorderColor =
    status === 'overdue'
      ? Colors.danger
      : status === 'due_soon'
      ? Colors.warning
      : status === 'ok'
      ? Colors.success
      : Colors.neverDone;

  function getDueDateText(): string {
    if (!item.lastCompletedDate) return 'Never completed — tap to set up';
    if (!item.nextDueDate) return 'No due date set';

    const due = parseISO(item.nextDueDate);
    const now = new Date();
    const diffDays = differenceInDays(due, now);

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    }
    if (diffDays === 0) return 'Due today!';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days (${due.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })})`;
  }

  function getLastDoneText(): string {
    if (!item.lastCompletedDate) return '';
    return `Last done ${formatDistanceToNow(parseISO(item.lastCompletedDate), {
      addSuffix: true,
    })}`;
  }

  function handleMarkDone() {
    Alert.alert(
      'Mark as Done',
      `Mark "${item.name}" as completed today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Done',
          onPress: async () => {
            await markDone(item.id);
            onMarkDone?.();
          },
        },
        {
          text: 'Done (with notes)',
          onPress: () => router.push(`/item/${item.id}?action=done`),
        },
      ]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: leftBorderColor }]}
      activeOpacity={0.75}
      onPress={() => router.push(`/item/${item.id}`)}
    >
      <View style={styles.row}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={item.color}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <StatusBadge status={status} size="sm" />
          </View>
          <Text style={[styles.dueText, { color: leftBorderColor }]}>{getDueDateText()}</Text>
          {!compact && item.lastCompletedDate ? (
            <Text style={styles.lastDone}>{getLastDoneText()}</Text>
          ) : null}
          {!compact && (
            <Text style={styles.interval}>
              Every {formatInterval(item.intervalDays)}
            </Text>
          )}
        </View>

        {/* Mark Done button */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleMarkDone}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="checkmark-circle-outline" size={28} color={Colors.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function formatInterval(days: number): string {
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  dueText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  lastDone: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  interval: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  doneBtn: {
    padding: Spacing.xs,
  },
});
