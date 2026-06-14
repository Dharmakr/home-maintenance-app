import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/useStore';
import {
  setPin,
  clearPin,
  hasPin,
  verifyPin,
  isBiometricAvailable,
  getBiometricType,
  isPinValid,
  sanitizePin,
} from '../../src/services/security';
import { requestNotificationPermission } from '../../src/services/notifications';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../../src/constants/theme';

export default function SettingsScreen() {
  const { settings, updateSettings, items, lock } = useStore();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState('Biometrics');

  // PIN modal state
  const [pinModal, setPinModal] = useState<'setup' | 'change' | 'disable' | null>(null);
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('new');
  const [pinInput, setPinInput] = useState('');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinExists, setPinExists] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await isBiometricAvailable();
      setBioAvailable(avail);
      if (avail) setBioType(await getBiometricType());
      setPinExists(await hasPin());
    })();
  }, []);

  async function handleNotificationToggle(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive maintenance reminders.'
        );
        return;
      }
    }
    await updateSettings({ notificationsEnabled: val });
  }

  async function handleBiometricToggle(val: boolean) {
    if (val && !pinExists) {
      Alert.alert('PIN Required', 'Set up a PIN first before enabling biometric authentication.');
      return;
    }
    await updateSettings({ biometricEnabled: val });
  }

  function openPinModal() {
    setPinInput('');
    setNewPinTemp('');
    setPinError('');
    if (pinExists) {
      setPinModal('change');
      setPinStep('current');
    } else {
      setPinModal('setup');
      setPinStep('new');
    }
  }

  async function handlePinInput(digit: string) {
    if (digit === 'del') {
      setPinInput((p) => p.slice(0, -1));
      setPinError('');
      return;
    }
    const next = sanitizePin(pinInput + digit);
    setPinInput(next);

    if (next.length < 4) return;

    if (pinModal === 'setup' || pinModal === 'change') {
      if (pinStep === 'current') {
        // Verify old PIN
        const ok = await verifyPin(next);
        if (!ok) {
          setPinError('Incorrect PIN');
          setPinInput('');
          return;
        }
        setPinStep('new');
        setPinInput('');
        return;
      }
      if (pinStep === 'new') {
        if (!isPinValid(next)) {
          setPinError('PIN must be 4-8 digits');
          setPinInput('');
          return;
        }
        setNewPinTemp(next);
        setPinStep('confirm');
        setPinInput('');
        return;
      }
      if (pinStep === 'confirm') {
        if (next !== newPinTemp) {
          setPinError('PINs do not match. Try again.');
          setPinInput('');
          setPinStep('new');
          setNewPinTemp('');
          return;
        }
        await setPin(next);
        await updateSettings({ pinEnabled: true });
        setPinExists(true);
        setPinModal(null);
        setPinInput('');
        Alert.alert('PIN Set', 'Your PIN has been saved securely.');
        return;
      }
    }

    if (pinModal === 'disable') {
      const ok = await verifyPin(next);
      if (!ok) {
        setPinError('Incorrect PIN');
        setPinInput('');
        return;
      }
      await clearPin();
      await updateSettings({ pinEnabled: false, biometricEnabled: false });
      setPinExists(false);
      setPinModal(null);
      Alert.alert('PIN Removed', 'App lock has been disabled.');
    }
  }

  const PIN_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const pinStepLabel =
    pinStep === 'current'
      ? 'Enter your current PIN'
      : pinStep === 'new'
      ? 'Enter a new PIN (4-8 digits)'
      : 'Confirm your new PIN';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <SettingsSection title="Notifications" icon="notifications" iconColor={Colors.info}>
        <SettingsRow
          label="Enable Notifications"
          subtitle="Receive reminders before tasks are due"
        >
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.card}
          />
        </SettingsRow>
        <View style={styles.separator} />
        <SettingsRow label="Default Reminder" subtitle="Days before due date to notify">
          <View style={styles.numberInput}>
            <TouchableOpacity
              onPress={() =>
                updateSettings({
                  defaultNotificationDays: Math.max(1, settings.defaultNotificationDays - 1),
                })
              }
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{settings.defaultNotificationDays}</Text>
            <TouchableOpacity
              onPress={() =>
                updateSettings({ defaultNotificationDays: settings.defaultNotificationDays + 1 })
              }
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SettingsRow>
        <View style={styles.separator} />
        <SettingsRow label="Due Soon Window" subtitle="Days ahead to show 'Due Soon' items">
          <View style={styles.numberInput}>
            <TouchableOpacity
              onPress={() =>
                updateSettings({ dueSoonWindowDays: Math.max(1, settings.dueSoonWindowDays - 1) })
              }
            >
              <Ionicons name="remove" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.numberValue}>{settings.dueSoonWindowDays}</Text>
            <TouchableOpacity
              onPress={() =>
                updateSettings({ dueSoonWindowDays: settings.dueSoonWindowDays + 1 })
              }
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SettingsRow>
      </SettingsSection>

      {/* Security */}
      <SettingsSection title="Security" icon="lock-closed" iconColor={Colors.primary}>
        <SettingsRow
          label={pinExists ? 'Change PIN' : 'Set Up PIN Lock'}
          subtitle={pinExists ? 'Tap to change your current PIN' : '4-8 digit lock screen'}
        >
          <TouchableOpacity style={styles.actionChip} onPress={openPinModal}>
            <Text style={styles.actionChipText}>{pinExists ? 'Change' : 'Set Up'}</Text>
          </TouchableOpacity>
        </SettingsRow>

        {pinExists && (
          <>
            <View style={styles.separator} />
            <SettingsRow
              label="App Lock"
              subtitle="Require PIN to open the app"
            >
              <Switch
                value={settings.pinEnabled}
                onValueChange={(val) => updateSettings({ pinEnabled: val })}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.card}
              />
            </SettingsRow>

            <View style={styles.separator} />
            <SettingsRow
              label="Remove PIN"
              subtitle="Disable app lock entirely"
            >
              <TouchableOpacity
                style={[styles.actionChip, styles.dangerChip]}
                onPress={() => {
                  setPinModal('disable');
                  setPinStep('current');
                  setPinInput('');
                  setPinError('');
                }}
              >
                <Text style={styles.dangerChipText}>Remove</Text>
              </TouchableOpacity>
            </SettingsRow>

            {bioAvailable && (
              <>
                <View style={styles.separator} />
                <SettingsRow
                  label={`Use ${bioType}`}
                  subtitle="Unlock with biometrics instead of PIN"
                >
                  <Switch
                    value={settings.biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.card}
                  />
                </SettingsRow>
              </>
            )}

            {settings.pinEnabled && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.lockNowBtn} onPress={lock}>
                  <Ionicons name="lock-closed" size={18} color={Colors.primary} />
                  <Text style={styles.lockNowText}>Lock App Now</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </SettingsSection>

      {/* Stats */}
      <SettingsSection title="Overview" icon="bar-chart" iconColor={Colors.success}>
        <View style={styles.statsGrid}>
          <StatItem label="Total Items" value={items.length} />
          <StatItem label="Active" value={items.filter((i) => i.isActive).length} />
          <StatItem label="Custom" value={items.filter((i) => i.isCustom).length} />
          <StatItem label="Categories" value={new Set(items.map((i) => i.category)).size} />
        </View>
      </SettingsSection>

      {/* About */}
      <SettingsSection title="About" icon="information-circle" iconColor={Colors.textSecondary}>
        <View style={styles.aboutContent}>
          <Text style={styles.aboutAppName}>Home Maintenance</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Keep your home in top shape with scheduled maintenance tracking, reminders, and history logging. All data is stored locally on your device.
          </Text>
        </View>
      </SettingsSection>

      <View style={{ height: Spacing.xxl }} />

      {/* PIN Modal */}
      <Modal visible={pinModal !== null} transparent animationType="slide">
        <View style={styles.pinOverlay}>
          <View style={styles.pinModal}>
            <TouchableOpacity
              style={styles.pinClose}
              onPress={() => { setPinModal(null); setPinInput(''); setPinError(''); }}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>

            <Ionicons name="lock-closed" size={36} color={Colors.primary} />
            <Text style={styles.pinTitle}>
              {pinModal === 'disable' ? 'Remove PIN' : pinExists ? 'Change PIN' : 'Set Up PIN'}
            </Text>
            <Text style={styles.pinStepLabel}>{pinStepLabel}</Text>

            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.pinDot, pinInput.length > i && styles.pinDotFilled]} />
              ))}
            </View>

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.pinKeypad}>
              {PIN_DIGITS.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pinKey, d === '' && styles.pinKeyEmpty]}
                  onPress={() => d !== '' && handlePinInput(d)}
                  disabled={d === ''}
                  activeOpacity={0.7}
                >
                  {d === 'del' ? (
                    <Ionicons name="backspace-outline" size={20} color={Colors.text} />
                  ) : (
                    <Text style={styles.pinKeyText}>{d}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingsSection({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowText}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, gap: Spacing.md },
  section: { gap: Spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  settingsRowText: { flex: 1 },
  settingsLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  settingsSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 1 },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.xs,
  },
  numberValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  actionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight + '22',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  actionChipText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  dangerChip: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  dangerChipText: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600' },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  lockNowText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  statItem: { width: '45%', alignItems: 'center', gap: 2 },
  statValue: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  aboutContent: { padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  aboutAppName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  aboutVersion: { fontSize: FontSize.sm, color: Colors.textMuted },
  aboutDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // PIN Modal
  pinOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  pinModal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  pinClose: { alignSelf: 'flex-end' },
  pinTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  pinStepLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  pinDots: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: Colors.primary },
  pinError: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '500' },
  pinKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  pinKey: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinKeyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  pinKeyText: { fontSize: FontSize.xxl, fontWeight: '500', color: Colors.text },
});
