import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ItemStatus } from '../types';
import { Colors, FontSize, Spacing, Radius } from '../constants/theme';

const STATUS_CONFIG: Record<ItemStatus, { label: string; bg: string; text: string }> = {
  overdue: { label: 'Overdue', bg: Colors.dangerLight, text: Colors.danger },
  due_soon: { label: 'Due Soon', bg: Colors.warningLight, text: Colors.warning },
  ok: { label: 'Up to Date', bg: Colors.successLight, text: Colors.success },
  never_done: { label: 'Not Done Yet', bg: '#EBEBEB', text: Colors.textSecondary },
};

interface Props {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: config.text }, size === 'sm' && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  textSm: {
    fontSize: FontSize.xs,
  },
});
