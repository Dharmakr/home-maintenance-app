import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { MaintenanceCategory, CATEGORY_META } from '../../src/types';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';
import { sanitizeText } from '../../src/services/security';

const CATEGORIES = Object.keys(CATEGORY_META) as MaintenanceCategory[];

const INTERVAL_PRESETS = [
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: '2 Years', days: 730 },
  { label: '3 Years', days: 1095 },
  { label: 'Custom', days: 0 },
];

const ICON_OPTIONS: Array<keyof typeof Ionicons.glyphMap> = [
  'home', 'construct', 'water', 'flash', 'thermometer',
  'shield-checkmark', 'leaf', 'hardware-chip', 'car', 'fitness',
  'medical', 'wallet', 'settings', 'star', 'key',
];

export default function AddItemScreen() {
  const router = useRouter();
  const { addItem, settings } = useStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('Custom');
  const [description, setDescription] = useState('');
  const [intervalPreset, setIntervalPreset] = useState(90);
  const [customDays, setCustomDays] = useState('');
  const [notifyDays, setNotifyDays] = useState(String(settings.defaultNotificationDays));
  const [selectedIcon, setSelectedIcon] = useState<string>('construct');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_META['Custom'].color);
  const [isSaving, setIsSaving] = useState(false);

  const COLOR_OPTIONS = [
    '#E74C3C', '#E67E22', '#F1C40F', '#27AE60', '#2ECC71',
    '#1ABC9C', '#3498DB', '#2980B9', '#8E44AD', '#95A5A6',
    '#16A085', '#C0392B', '#D35400', '#1B4F72', '#154360',
  ];

  const intervalDays = intervalPreset === 0
    ? parseInt(customDays, 10) || 0
    : intervalPreset;

  function handleCategorySelect(cat: MaintenanceCategory) {
    setCategory(cat);
    setSelectedColor(CATEGORY_META[cat].color);
    setSelectedIcon(CATEGORY_META[cat].icon);
  }

  async function handleSave() {
    const cleanName = sanitizeText(name.trim());
    if (!cleanName) {
      Alert.alert('Name required', 'Please enter a name for this maintenance item.');
      return;
    }
    if (intervalDays < 1 || isNaN(intervalDays)) {
      Alert.alert('Invalid interval', 'Please select or enter a valid maintenance interval.');
      return;
    }
    const notifyNum = parseInt(notifyDays, 10);
    if (isNaN(notifyNum) || notifyNum < 0) {
      Alert.alert('Invalid days', 'Notification days must be 0 or more.');
      return;
    }

    setIsSaving(true);
    try {
      await addItem({
        name: cleanName,
        category,
        description: sanitizeText(description),
        intervalDays,
        lastCompletedDate: null,
        nextDueDate: null,
        notificationDaysBefore: notifyNum,
        isActive: true,
        isCustom: true,
        color: selectedColor,
        icon: selectedIcon,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Maintenance Item',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={styles.saveHeaderBtn}>{isSaving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={[styles.previewCard, { borderLeftColor: selectedColor }]}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + '22' }]}>
              <Ionicons
                name={selectedIcon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={selectedColor}
              />
            </View>
            <View>
              <Text style={styles.previewName}>{name || 'Item Name'}</Text>
              <Text style={styles.previewCat}>{category} · Every {formatInterval(intervalDays)}</Text>
            </View>
          </View>

          {/* Name */}
          <FormSection title="Item Name *">
            <TextInput
              style={styles.input}
              placeholder="e.g. Furnace Filter Replacement"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={100}
              autoFocus
            />
          </FormSection>

          {/* Category */}
          <FormSection title="Category">
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    category === cat && {
                      backgroundColor: CATEGORY_META[cat].color + '22',
                      borderColor: CATEGORY_META[cat].color,
                    },
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Ionicons
                    name={CATEGORY_META[cat].icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={category === cat ? CATEGORY_META[cat].color : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.catOptionText,
                      category === cat && { color: CATEGORY_META[cat].color, fontWeight: '700' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          {/* Description */}
          <FormSection title="Description (optional)">
            <TextInput
              style={styles.textArea}
              placeholder="What needs to be done? Any tips or notes..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </FormSection>

          {/* Interval */}
          <FormSection title="Maintenance Interval *">
            <View style={styles.presetGrid}>
              {INTERVAL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    intervalPreset === preset.days && styles.presetChipActive,
                  ]}
                  onPress={() => setIntervalPreset(preset.days)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      intervalPreset === preset.days && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {intervalPreset === 0 && (
              <View style={styles.customDaysRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Number of days"
                  placeholderTextColor={Colors.textMuted}
                  value={customDays}
                  onChangeText={setCustomDays}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>
            )}
          </FormSection>

          {/* Notification */}
          <FormSection title="Remind Me">
            <View style={styles.notifyRow}>
              <TextInput
                style={[styles.input, { width: 80 }]}
                value={notifyDays}
                onChangeText={setNotifyDays}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.daysLabel}>days before due date</Text>
            </View>
          </FormSection>

          {/* Icon */}
          <FormSection title="Icon">
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && {
                      backgroundColor: selectedColor + '22',
                      borderColor: selectedColor,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : Colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          {/* Color */}
          <FormSection title="Color">
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </FormSection>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark-circle" size={22} color={Colors.textInverse} />
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Add Maintenance Item'}</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.formLabel}>{title}</Text>
      {children}
    </View>
  );
}

function formatInterval(days: number): string {
  if (!days || days < 1) return '—';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
  return `${(days / 365).toFixed(1)} year${days === 365 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.sm },
  saveHeaderBtn: { color: Colors.textInverse, fontWeight: '700', fontSize: FontSize.md },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  previewCat: { fontSize: FontSize.sm, color: Colors.textSecondary },
  formSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  formLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  catOptionText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  presetChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  presetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  presetTextActive: { color: Colors.textInverse },
  customDaysRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  daysLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: Colors.text,
    transform: [{ scale: 1.2 }],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  saveButtonText: { color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: '700' },
});
