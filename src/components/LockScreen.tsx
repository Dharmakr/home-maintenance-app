import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyPin, authenticateWithBiometrics, isBiometricAvailable, getBiometricType } from '../services/security';
import { useStore } from '../store/useStore';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function LockScreen() {
  const unlock = useStore((s) => s.unlock);
  const settings = useStore((s) => s.settings);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioType, setBioType] = useState('Biometrics');

  useEffect(() => {
    (async () => {
      if (settings.biometricEnabled) {
        const avail = await isBiometricAvailable();
        setBioAvailable(avail);
        if (avail) {
          const type = await getBiometricType();
          setBioType(type);
          tryBiometric();
        }
      }
    })();
  }, []);

  async function tryBiometric() {
    const success = await authenticateWithBiometrics();
    if (success) unlock();
  }

  function pressDigit(digit: string) {
    if (digit === 'del') {
      setPin((p) => p.slice(0, -1));
      setError('');
      return;
    }
    if (digit === '') return;
    const next = pin + digit;
    setPin(next);
    if (next.length >= 4) {
      checkPin(next);
    }
  }

  async function checkPin(input: string) {
    const ok = await verifyPin(input);
    if (ok) {
      unlock();
    } else {
      Vibration.vibrate(400);
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  }

  return (
    <View style={styles.container}>
      <Ionicons name="home" size={56} color={Colors.card} />
      <Text style={styles.title}>Home Maintenance</Text>
      <Text style={styles.subtitle}>Enter your PIN to continue</Text>

      {/* PIN dots */}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, pin.length > i && styles.dotFilled]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {DIGITS.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, d === '' && styles.keyEmpty]}
            onPress={() => pressDigit(d)}
            disabled={d === ''}
            activeOpacity={0.7}
          >
            {d === 'del' ? (
              <Ionicons name="backspace-outline" size={22} color={Colors.card} />
            ) : (
              <Text style={styles.keyText}>{d}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {bioAvailable && settings.biometricEnabled && (
        <TouchableOpacity style={styles.bioBtn} onPress={tryBiometric}>
          <Ionicons name="finger-print" size={28} color={Colors.card} />
          <Text style={styles.bioText}>Use {bioType}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.card,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.card + 'BB',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.card,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.card,
  },
  error: {
    color: '#FF8080',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.card + '33',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: FontSize.xxl,
    fontWeight: '500',
    color: Colors.card,
  },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  bioText: {
    fontSize: FontSize.md,
    color: Colors.card,
    fontWeight: '500',
  },
});
