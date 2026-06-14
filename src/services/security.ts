import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'hma_user_pin';

// Sanitize PIN: digits only, 4-8 characters
export function sanitizePin(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}

export function isPinValid(pin: string): boolean {
  const cleaned = sanitizePin(pin);
  return cleaned.length >= 4 && cleaned.length <= 8;
}

// Store PIN in secure enclave (encrypted key-value store)
export async function setPin(pin: string): Promise<void> {
  const cleaned = sanitizePin(pin);
  if (!isPinValid(cleaned)) throw new Error('PIN must be 4-8 digits');
  await SecureStore.setItemAsync(PIN_KEY, cleaned, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  return sanitizePin(input) === stored;
}

export async function clearPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}

export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return !!stored;
}

// Biometric authentication
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }
  return 'Biometrics';
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Home Maintenance',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

// Validate all text inputs against basic injection patterns
export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '')        // No HTML tags
    .replace(/['"`;]/g, '')      // No SQL/script injection chars
    .trim()
    .slice(0, 500);              // Max 500 chars
}

export function sanitizeCost(input: string): number | null {
  const parsed = parseFloat(input.replace(/[^0-9.]/g, ''));
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100; // Round to 2 decimal places
}
