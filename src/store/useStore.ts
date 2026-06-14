import { create } from 'zustand';
import { MaintenanceItem, HistoryRecord, AppSettings, MaintenanceStore } from '../types';
import * as db from '../database/db';
import { rescheduleAllNotifications } from '../services/notifications';
import { saveSetting } from '../database/db';
import { sanitizeText, sanitizeCost } from '../services/security';

export const useStore = create<MaintenanceStore>((set, get) => ({
  items: [],
  history: [],
  settings: {
    pinEnabled: false,
    biometricEnabled: false,
    defaultNotificationDays: 7,
    notificationsEnabled: true,
    dueSoonWindowDays: 14,
  },
  isLoading: true,
  isLocked: false,

  // --- Items ---

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const items = await db.fetchAllItems();
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to load items:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const sanitized: typeof item = {
      ...item,
      name: sanitizeText(item.name),
      description: sanitizeText(item.description),
    };
    const newItem = await db.insertItem(sanitized);
    set((state) => ({ items: [...state.items, newItem] }));

    const { settings } = get();
    if (settings.notificationsEnabled) {
      await rescheduleAllNotifications(
        get().items,
        settings.defaultNotificationDays,
        true
      );
    }
  },

  updateItem: async (id, updates) => {
    const sanitized = { ...updates };
    if (sanitized.name) sanitized.name = sanitizeText(sanitized.name);
    if (sanitized.description) sanitized.description = sanitizeText(sanitized.description);

    await db.updateItem(id, sanitized);
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...sanitized } : item
      ),
    }));

    const { settings } = get();
    if (settings.notificationsEnabled) {
      await rescheduleAllNotifications(
        get().items,
        settings.defaultNotificationDays,
        true
      );
    }
  },

  deleteItem: async (id) => {
    await db.deleteItem(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      history: state.history.filter((h) => h.itemId !== id),
    }));

    const { settings } = get();
    await rescheduleAllNotifications(
      get().items,
      settings.defaultNotificationDays,
      settings.notificationsEnabled
    );
  },

  markDone: async (id, notes = '', cost) => {
    const cleanNotes = sanitizeText(notes);
    const cleanCost = cost !== undefined ? sanitizeCost(String(cost)) : null;

    const { historyId, nextDueDate } = await db.markItemDone(id, cleanNotes, cleanCost);
    const now = new Date().toISOString();

    const newHistory: HistoryRecord = {
      id: historyId,
      itemId: id,
      completedDate: now,
      notes: cleanNotes,
      cost: cleanCost,
      createdAt: now,
    };

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, lastCompletedDate: now, nextDueDate, updatedAt: now }
          : item
      ),
      history: [newHistory, ...state.history],
    }));

    const { settings } = get();
    if (settings.notificationsEnabled) {
      await rescheduleAllNotifications(
        get().items,
        settings.defaultNotificationDays,
        true
      );
    }
  },

  // --- History ---

  loadHistory: async () => {
    const history = await db.fetchHistory();
    set({ history });
  },

  deleteHistoryRecord: async (id) => {
    await db.deleteHistoryRecord(id);
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    }));
  },

  // --- Settings ---

  loadSettings: async () => {
    const settings = await db.fetchSettings();
    set({ settings });
  },

  updateSettings: async (updates) => {
    const newSettings: AppSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });

    for (const [key, value] of Object.entries(updates)) {
      await saveSetting(key, String(value));
    }

    if ('notificationsEnabled' in updates || 'defaultNotificationDays' in updates) {
      await rescheduleAllNotifications(
        get().items,
        newSettings.defaultNotificationDays,
        newSettings.notificationsEnabled
      );
    }
  },

  // --- Security ---

  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}));

// Derived selectors (used in components)
export function selectOverdueItems(items: MaintenanceItem[], dueSoonDays: number) {
  const now = new Date();
  return items.filter((item) => {
    if (!item.nextDueDate && !item.lastCompletedDate) return false;
    if (!item.nextDueDate) return false;
    return new Date(item.nextDueDate) < now;
  });
}

export function selectDueSoonItems(items: MaintenanceItem[], dueSoonDays: number) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + dueSoonDays * 24 * 60 * 60 * 1000);
  return items.filter((item) => {
    if (!item.nextDueDate) return false;
    const due = new Date(item.nextDueDate);
    return due >= now && due <= windowEnd;
  });
}

export function selectNeverDoneItems(items: MaintenanceItem[]) {
  return items.filter((item) => !item.lastCompletedDate);
}

export function getItemStatus(
  item: MaintenanceItem,
  dueSoonDays = 14
): 'overdue' | 'due_soon' | 'ok' | 'never_done' {
  if (!item.lastCompletedDate) return 'never_done';
  if (!item.nextDueDate) return 'ok';
  const now = new Date();
  const due = new Date(item.nextDueDate);
  if (due < now) return 'overdue';
  const windowEnd = new Date(now.getTime() + dueSoonDays * 24 * 60 * 60 * 1000);
  if (due <= windowEnd) return 'due_soon';
  return 'ok';
}
