import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useStore, getItemStatus } from '../../src/store/useStore';
import { StatusBadge } from '../../src/components/StatusBadge';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';
import { sanitizeText, sanitizeCost } from '../../src/services/security';

export default function ItemDetailScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const router = useRouter();
  const { items, history, settings, markDone, updateItem, deleteItem } = useStore();

  const item = items.find((i) => i.id === id);
  const itemHistory = history
    .filter((h) => h.itemId === id)
    .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
    .slice(0, 20);

  const [doneModal, setDoneModal] = useState(action === 'done');
  const [doneNotes, setDoneNotes] = useState('');
  const [doneCost, setDoneCost] = useState('');

  const [editModal, setEditModal] = useState(false);
  const [editInterval, setEditInterval] = useState('');
  const [editNotifyDays, setEditNotifyDays] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (item) {
      setEditInterval(String(item.intervalDays));
      setEditNotifyDays(String(item.notificationDaysBefore));
      setEditDescription(item.description);
      setEditName(item.name);
    }
  }, [item]);

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = getItemStatus(item, settings.dueSoonWindowDays);

  async function handleMarkDone() {
    const cost = sanitizeCost(doneCost);
    await markDone(item!.id, sanitizeText(doneNotes), cost ?? undefined);
    setDoneModal(false);
    setDoneNotes('');
    setDoneCost('');
  }

  async function handleSaveEdit() {
    const intervalDays = parseInt(editInterval, 10);
    const notifyDays = parseInt(editNotifyDays, 10);
    if (isNaN(intervalDays) || intervalDays < 1) {
      Alert.alert('Invalid interval', 'Please enter a valid number of days (minimum 1).');
      return;
    }
    if (isNaN(notifyDays) || notifyDays < 0) {
      Alert.alert('Invalid days', 'Notification days must be 0 or more.');
      return;
    }
    await updateItem(item!.id, {
      name: sanitizeText(editName),
      description: sanitizeText(editDescription),
      intervalDays,
      notificationDaysBefore: notifyDays,
    });
    setEditModal(false);
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item!.name}"? This will also remove all history records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(item!.id);
            router.back();
          },
        },
      ]
    );
  }

  const statusColor =
    status === 'overdue' ? Colors.danger
    : status === 'due_soon' ? Colors.warning
    : status === 'ok' ? Colors.success
    : Colors.textSecondary;

  return (
    <>
      <Stack.Screen
        options={{
          title: item.name,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          headerRight: () => (
            <TouchableOpacity onPress={() => setEditModal(true)} style={{ marginRight: 4 }}>
              <Ionicons name="create-outline" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Card */}
        <View style={[styles.hero, { borderColor: statusColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: item.color + '22' }]}>
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={40}
              color={item.color}
            />
          </View>
          <StatusBadge status={status} />
          <Text style={styles.heroName}>{item.name}</Text>
          <Text style={styles.heroCategory}>{item.category}</Text>
          {item.description ? (
            <Text style={styles.heroDesc}>{item.description}</Text>
          ) : null}
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <DetailCard
            icon="repeat"
            label="Frequency"
            value={formatInterval(item.intervalDays)}
            color={Colors.primary}
          />
          <DetailCard
            icon="calendar"
            label="Last Done"
            value={item.lastCompletedDate
              ? format(parseISO(item.lastCompletedDate), 'MMM d, yyyy')
              : 'Never'}
            color={Colors.textSecondary}
          />
          <DetailCard
            icon="time"
            label="Next Due"
            value={item.nextDueDate
              ? format(parseISO(item.nextDueDate), 'MMM d, yyyy')
              : 'Not set'}
            color={statusColor}
          />
          <DetailCard
            icon="notifications"
            label="Remind"
            value={`${item.notificationDaysBefore} days before`}
            color={Colors.info}
          />
        </View>

        {/* Mark Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setDoneModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={24} color={Colors.textInverse} />
          <Text style={styles.doneButtonText}>Mark as Completed Today</Text>
        </TouchableOpacity>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion History</Text>
          {itemHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No history yet.</Text>
            </View>
          ) : (
            itemHistory.map((h) => (
              <View key={h.id} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyDate}>
                    {format(parseISO(h.completedDate), 'MMMM d, yyyy')}
                  </Text>
                  {h.notes ? <Text style={styles.historyNotes}>{h.notes}</Text> : null}
                  {h.cost != null ? (
                    <Text style={styles.historyCost}>Cost: ${h.cost.toFixed(2)}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deleteText}>Delete This Item</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Mark Done Modal */}
      <Modal visible={doneModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Mark as Completed</Text>
            <Text style={styles.modalSub}>{item.name}</Text>

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What did you do? Any issues?"
              placeholderTextColor={Colors.textMuted}
              value={doneNotes}
              onChangeText={setDoneNotes}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={styles.inputLabel}>Cost (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12.99"
              placeholderTextColor={Colors.textMuted}
              value={doneCost}
              onChangeText={setDoneCost}
              keyboardType="decimal-pad"
              maxLength={10}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDoneModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleMarkDone}>
                <Text style={styles.confirmBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Item</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              maxLength={100}
              placeholder="Item name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              placeholder="Description"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Replacement Interval (days)</Text>
            <TextInput
              style={styles.input}
              value={editInterval}
              onChangeText={setEditInterval}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="e.g. 90"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.hint}>
              Common: 30 = monthly, 90 = quarterly, 180 = bi-annual, 365 = yearly
            </Text>

            <Text style={styles.inputLabel}>Notify X days before due</Text>
            <TextInput
              style={styles.input}
              value={editNotifyDays}
              onChangeText={setEditNotifyDays}
              keyboardType="number-pad"
              maxLength={3}
              placeholder="e.g. 7"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleSaveEdit}>
                <Text style={styles.confirmBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function DetailCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.detailCard, Shadow.sm]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
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
  const years = (days / 365).toFixed(1);
  return `${years} year${years === '1.0' ? '' : 's'}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  hero: {
    backgroundColor: Colors.card,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    ...Shadow.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  heroName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  heroCategory: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  heroDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  detailValue: { fontSize: FontSize.md, fontWeight: '700' },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  doneButtonText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textInverse },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyHistory: { padding: Spacing.lg, alignItems: 'center' },
  emptyHistoryText: { color: Colors.textMuted, fontSize: FontSize.sm },
  historyRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  historyContent: { flex: 1 },
  historyDate: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  historyNotes: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  historyCost: { fontSize: FontSize.sm, color: Colors.success, marginTop: 2 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginTop: Spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.md },
  confirmBtn: { backgroundColor: Colors.primary },
  confirmBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.md },
});
