import { SecurityConfig } from '../types';

export const BASE_SECURITY_KEY = 'creditrack_security_config';

export function getSecurityStorageKey(userId?: string | null): string {
  if (userId) {
    return `${BASE_SECURITY_KEY}_${userId}`;
  }
  return `${BASE_SECURITY_KEY}_guest`;
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_creditrack_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredSecurityConfig(userId?: string | null): SecurityConfig {
  try {
    const key = getSecurityStorageKey(userId);
    let raw = localStorage.getItem(key);

    // Fallback to legacy key if guest and legacy key exists
    if (!raw && !userId) {
      raw = localStorage.getItem(BASE_SECURITY_KEY);
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        isLocked: parsed.isPinSet ? true : false,
        lastActiveTimestamp: Date.now(),
      };
    }
  } catch (e) {
    console.error('Failed to parse security config from localStorage', e);
  }

  return {
    isPinSet: false,
    pinHash: null,
    pinLength: 4,
    lockTimeoutMinutes: 5,
    lastActiveTimestamp: Date.now(),
    isLocked: false,
  };
}

export function hasUserConfiguredPin(userId?: string | null): boolean {
  try {
    const config = getStoredSecurityConfig(userId);
    return Boolean(config.isPinSet && config.pinHash);
  } catch {
    return false;
  }
}

export function saveSecurityConfig(config: SecurityConfig, userId?: string | null): void {
  try {
    const key = getSecurityStorageKey(userId);
    localStorage.setItem(key, JSON.stringify({
      isPinSet: config.isPinSet,
      pinHash: config.pinHash,
      pinLength: config.pinLength,
      lockTimeoutMinutes: config.lockTimeoutMinutes,
      lastActiveTimestamp: Date.now(),
    }));

    // Record this user in known users list
    if (userId) {
      try {
        const knownRaw = localStorage.getItem('creditrack_known_users');
        const known: string[] = knownRaw ? JSON.parse(knownRaw) : [];
        if (!known.includes(userId)) {
          known.push(userId);
          localStorage.setItem('creditrack_known_users', JSON.stringify(known));
        }
      } catch (err) {
        console.error('Failed to update known users list', err);
      }
    }
  } catch (e) {
    console.error('Failed to save security config', e);
  }
}

export async function verifyPin(enteredPin: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;
  const hash = await hashPin(enteredPin);
  return hash === storedHash;
}

export function clearSecurityConfig(userId?: string | null): void {
  const key = getSecurityStorageKey(userId);
  localStorage.removeItem(key);
}
