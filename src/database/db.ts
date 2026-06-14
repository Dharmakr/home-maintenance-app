import * as SQLite from 'expo-sqlite';
import { MaintenanceItem, HistoryRecord, AppSettings } from '../types';
import { DEFAULT_MAINTENANCE_ITEMS, DEFAULT_SETTINGS } from '../constants/defaults';
import { addDays, format, parseISO } from 'date-fns';
import 'react-native-uuid';
import { v4 as uuidv4 } from 'react-native-uuid';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('home_maintenance.db');
  }
  return db;
}

// --- Schema ---

export async function initDatabase(): Promise<void> {
  const database = getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS maintenance_items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      interval_days INTEGER NOT NULL,
      last_completed_date TEXT,
      next_due_date TEXT,
      notification_days_before INTEGER NOT NULL DEFAULT 7,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_custom INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#95A5A6',
      icon TEXT NOT NULL DEFAULT 'construct',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_history (
      id TEXT PRIMARY KEY NOT NULL,
      item_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      cost REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES maintenance_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_history_item_id ON maintenance_history(item_id);
    CREATE INDEX IF NOT EXISTS idx_history_date ON maintenance_history(completed_date);
    CREATE INDEX IF NOT EXISTS idx_items_category ON maintenance_items(category);
  `);

  await seedDefaultItemsIfEmpty();
  await seedDefaultSettings();
}

async function seedDefaultItemsIfEmpty(): Promise<void> {
  const database = getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM maintenance_items'
  );
  if (result && result.count > 0) return;

  const now = new Date().toISOString();
  const stmt = await database.prepareAsync(
    `INSERT INTO maintenance_items
      (id, name, category, description, interval_days, last_completed_date,
       next_due_date, notification_days_before, is_active, is_custom, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)`
  );

  try {
    for (const item of DEFAULT_MAINTENANCE_ITEMS) {
      await stmt.executeAsync([
        uuidv4(),
        item.name,
        item.category,
        item.description,
        item.intervalDays,
        null,
        null,
        DEFAULT_SETTINGS.defaultNotificationDays,
        item.color,
        item.icon,
        now,
        now,
      ]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

async function seedDefaultSettings(): Promise<void> {
  const database = getDb();
  const defaults: Record<string, string> = {
    pinEnabled: 'false',
    biometricEnabled: 'false',
    defaultNotificationDays: String(DEFAULT_SETTINGS.defaultNotificationDays),
    notificationsEnabled: 'true',
    dueSoonWindowDays: String(DEFAULT_SETTINGS.dueSoonWindowDays),
  };

  for (const [key, value] of Object.entries(defaults)) {
    await database.runAsync(
      'INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }
}

// --- Items ---

export async function fetchAllItems(): Promise<MaintenanceItem[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM maintenance_items WHERE is_active = 1 ORDER BY name ASC'
  );
  return rows.map(rowToItem);
}

export async function insertItem(item: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceItem> {
  const database = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const nextDue = computeNextDue(item.lastCompletedDate, item.intervalDays);

  await database.runAsync(
    `INSERT INTO maintenance_items
      (id, name, category, description, interval_days, last_completed_date,
       next_due_date, notification_days_before, is_active, is_custom, color, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.name,
      item.category,
      item.description,
      item.intervalDays,
      item.lastCompletedDate,
      nextDue,
      item.notificationDaysBefore,
      item.isActive ? 1 : 0,
      item.isCustom ? 1 : 0,
      item.color,
      item.icon,
      now,
      now,
    ]
  );

  return {
    ...item,
    id,
    nextDueDate: nextDue,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateItem(id: string, updates: Partial<MaintenanceItem>): Promise<void> {
  const database = getDb();
  const now = new Date().toISOString();

  // Fetch existing to merge
  const existing = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM maintenance_items WHERE id = ?',
    [id]
  );
  if (!existing) return;

  const merged = { ...rowToItem(existing), ...updates };
  const nextDue = computeNextDue(merged.lastCompletedDate, merged.intervalDays);

  await database.runAsync(
    `UPDATE maintenance_items SET
      name = ?, category = ?, description = ?, interval_days = ?,
      last_completed_date = ?, next_due_date = ?, notification_days_before = ?,
      is_active = ?, is_custom = ?, color = ?, icon = ?, updated_at = ?
     WHERE id = ?`,
    [
      merged.name,
      merged.category,
      merged.description,
      merged.intervalDays,
      merged.lastCompletedDate,
      nextDue,
      merged.notificationDaysBefore,
      merged.isActive ? 1 : 0,
      merged.isCustom ? 1 : 0,
      merged.color,
      merged.icon,
      now,
      id,
    ]
  );
}

export async function deleteItem(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM maintenance_items WHERE id = ?', [id]);
}

export async function markItemDone(
  id: string,
  notes: string,
  cost: number | null
): Promise<{ historyId: string; nextDueDate: string }> {
  const database = getDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const historyId = uuidv4();

  // Insert history record
  await database.runAsync(
    `INSERT INTO maintenance_history (id, item_id, completed_date, notes, cost, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [historyId, id, nowIso, notes, cost, nowIso]
  );

  // Fetch interval
  const item = await database.getFirstAsync<{ interval_days: number }>(
    'SELECT interval_days FROM maintenance_items WHERE id = ?',
    [id]
  );
  const intervalDays = item?.interval_days ?? 90;
  const nextDue = format(addDays(now, intervalDays), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  // Update item's last completed and next due
  await database.runAsync(
    `UPDATE maintenance_items SET last_completed_date = ?, next_due_date = ?, updated_at = ? WHERE id = ?`,
    [nowIso, nextDue, nowIso, id]
  );

  return { historyId, nextDueDate: nextDue };
}

// --- History ---

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM maintenance_history ORDER BY completed_date DESC'
  );
  return rows.map(rowToHistory);
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM maintenance_history WHERE id = ?', [id]);
}

// --- Settings ---

export async function fetchSettings(): Promise<AppSettings> {
  const database = getDb();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings'
  );
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  return {
    pinEnabled: map.pinEnabled === 'true',
    biometricEnabled: map.biometricEnabled === 'true',
    defaultNotificationDays: parseInt(map.defaultNotificationDays ?? '7', 10),
    notificationsEnabled: map.notificationsEnabled !== 'false',
    dueSoonWindowDays: parseInt(map.dueSoonWindowDays ?? '14', 10),
  };
}

export async function saveSetting(key: string, value: string): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// --- Helpers ---

function computeNextDue(lastDate: string | null, intervalDays: number): string | null {
  if (!lastDate) return null;
  try {
    const base = parseISO(lastDate);
    return format(addDays(base, intervalDays), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  } catch {
    return null;
  }
}

function rowToItem(row: Record<string, unknown>): MaintenanceItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as MaintenanceItem['category'],
    description: (row.description as string) ?? '',
    intervalDays: row.interval_days as number,
    lastCompletedDate: (row.last_completed_date as string | null) ?? null,
    nextDueDate: (row.next_due_date as string | null) ?? null,
    notificationDaysBefore: row.notification_days_before as number,
    isActive: row.is_active === 1,
    isCustom: row.is_custom === 1,
    color: (row.color as string) ?? '#95A5A6',
    icon: (row.icon as string) ?? 'construct',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToHistory(row: Record<string, unknown>): HistoryRecord {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    completedDate: row.completed_date as string,
    notes: (row.notes as string) ?? '',
    cost: (row.cost as number | null) ?? null,
    createdAt: row.created_at as string,
  };
}
