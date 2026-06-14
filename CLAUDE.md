# CLAUDE.md — Home Maintenance App

This file gives Claude Code full context about this project so it can contribute effectively without re-deriving architecture from scratch.

---

## Project Overview

**Home Maintenance App** — A React Native / Expo mobile app for Android (and iOS) that lets homeowners track scheduled maintenance tasks, receive push notification reminders, log completion history with cost tracking, and lock the app with a PIN or biometrics.

All data is stored **locally on-device** using SQLite. There is no backend or network dependency.

---

## Tech Stack

| Concern | Library | Notes |
|---------|---------|-------|
| Framework | Expo SDK 52, React Native 0.76 | Managed workflow |
| Navigation | Expo Router 4 (file-based) | `app/` directory = routes |
| Database | expo-sqlite 15 | `SQLiteDatabase.execAsync` / `runAsync` / `getAllAsync` |
| State | Zustand 5 | Single store in `src/store/useStore.ts` |
| Notifications | expo-notifications 0.29 | Local only, no push server |
| Secure storage | expo-secure-store 14 | PIN stored here, never in SQLite |
| Biometrics | expo-local-authentication 15 | Fingerprint / Face ID |
| Date utilities | date-fns 4 | Used throughout; prefer `date-fns` over `Date` arithmetic |
| Icons | @expo/vector-icons (Ionicons) | All icons use `<Ionicons name="..." />` |
| Language | TypeScript (strict) | No `any`, no `as unknown` unless unavoidable |

---

## Directory Structure

```
app/                      ← Expo Router routes
  _layout.tsx             ← Root: DB init, settings load, AppState listener, lock gate
  (tabs)/
    _layout.tsx           ← Tab bar + overdue badge
    index.tsx             ← Dashboard
    items.tsx             ← All items (search, filter, grouped)
    history.tsx           ← Completion log (time-filtered, cost summary)
    settings.tsx          ← Notifications, PIN, biometrics
  item/
    [id].tsx              ← Item detail + inline edit + mark done modal
    add.tsx               ← Add new custom item

src/
  types/index.ts          ← All shared types + CATEGORY_META constant
  constants/
    theme.ts              ← Colors, Spacing, Radius, FontSize, Shadow
    defaults.ts           ← 40+ pre-loaded DefaultItem[] + DEFAULT_SETTINGS
  database/db.ts          ← All SQLite CRUD; single `getDb()` singleton
  services/
    notifications.ts      ← scheduleItemNotification, rescheduleAllNotifications
    security.ts           ← setPin/verifyPin (SecureStore), biometrics, sanitizeText
  store/useStore.ts       ← Zustand store + selectors (selectOverdueItems, getItemStatus)
  hooks/useAppInit.ts     ← useNotificationSync hook
  components/
    MaintenanceCard.tsx   ← Card with left-border status color, quick Mark Done
    StatusBadge.tsx       ← 'overdue' | 'due_soon' | 'ok' | 'never_done' pill
    EmptyState.tsx        ← Centered icon + text placeholder
    LockScreen.tsx        ← Full-screen PIN keypad + biometric button
```

---

## Data Model

### SQLite Tables

**maintenance_items**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
category TEXT NOT NULL          -- one of MaintenanceCategory union
description TEXT
interval_days INTEGER NOT NULL  -- how often (days)
last_completed_date TEXT        -- ISO string, nullable
next_due_date TEXT              -- ISO string, auto-computed by db.ts
notification_days_before INTEGER
is_active INTEGER               -- 0 or 1
is_custom INTEGER               -- 0 or 1
color TEXT                      -- hex e.g. '#E74C3C'
icon TEXT                       -- Ionicons name
created_at TEXT
updated_at TEXT
```

**maintenance_history**
```sql
id TEXT PRIMARY KEY
item_id TEXT REFERENCES maintenance_items(id) ON DELETE CASCADE
completed_date TEXT NOT NULL    -- ISO string
notes TEXT
cost REAL                       -- nullable
created_at TEXT
```

**app_settings**
```sql
key TEXT PRIMARY KEY
value TEXT NOT NULL             -- always serialized as string
```

### Key invariants
- `next_due_date` is always computed from `last_completed_date + interval_days` inside `db.ts`. Never set it directly from a screen.
- When `last_completed_date` is NULL, `next_due_date` is NULL and status is `'never_done'`.
- `markItemDone()` in `db.ts` inserts a history record and updates both fields atomically.
- All notification rescheduling goes through `rescheduleAllNotifications()` (cancels all, re-schedules all active items). Do not schedule individual notifications in screens.

---

## State Architecture

The single Zustand store (`useStore`) owns:
- `items: MaintenanceItem[]`
- `history: HistoryRecord[]`
- `settings: AppSettings`
- `isLoading: boolean`
- `isLocked: boolean`

**Derived selectors** live in `useStore.ts` (not in the store state) and are called directly in components:
```ts
selectOverdueItems(items, dueSoonDays)
selectDueSoonItems(items, dueSoonDays)
selectNeverDoneItems(items)
getItemStatus(item, dueSoonDays) → ItemStatus
```

Never compute overdue/due-soon logic in a screen — always use these selectors.

---

## Security Rules

1. **PIN** is stored via `expo-secure-store` with `WHEN_UNLOCKED` accessibility. Never store it in SQLite or AsyncStorage.
2. **All user text inputs** must be passed through `sanitizeText()` from `src/services/security.ts` before saving to DB.
3. **Cost inputs** must go through `sanitizeCost()` — returns `null` for invalid values, rounds to 2 decimals.
4. **Do not log** any user-entered data, costs, or notes to the console in production paths.
5. The `isLocked` flag in the store gates the entire UI (checked in `app/_layout.tsx`). Respect it.

---

## Notification Architecture

- Two Android channels: `maintenance-reminders` (HIGH) and `maintenance-overdue` (MAX).
- Each item gets two notifications: one `notificationDaysBefore` days before due, one on the due date.
- All scheduling goes through `rescheduleAllNotifications(items, defaultDays, enabled)` which cancels everything and re-schedules from scratch. This is called after any item or settings mutation.
- `requestNotificationPermission()` must be called before scheduling. It creates channels on Android.

---

## Patterns & Conventions

### Adding a new screen
1. Create a file in `app/` (Expo Router auto-registers it as a route).
2. If it needs a custom header, use `<Stack.Screen options={{...}} />` inside the component.
3. Access state via `useStore()` — never import from `db.ts` directly in a screen.

### Adding a new setting
1. Add the field to `AppSettings` in `src/types/index.ts`.
2. Add a default value to `DEFAULT_SETTINGS` in `src/constants/defaults.ts`.
3. Add `INSERT OR IGNORE` seeding in `seedDefaultSettings()` in `db.ts`.
4. Add a `saveSetting(key, value)` call in the `updateSettings` store action.
5. Add the UI row in `app/(tabs)/settings.tsx`.

### Adding a new pre-loaded maintenance item
Add an entry to the `DEFAULT_MAINTENANCE_ITEMS` array in `src/constants/defaults.ts`. It will only appear on first install (the seed function checks `COUNT(*) > 0` and skips if data exists).

### Adding a new category
1. Add it to the `MaintenanceCategory` union in `src/types/index.ts`.
2. Add its metadata to `CATEGORY_META` in the same file.
3. Add at least one default item using it in `src/constants/defaults.ts`.

### Editing the database schema
The schema is in `initDatabase()` in `src/database/db.ts`. For schema changes on existing installs, add `ALTER TABLE` statements after the `CREATE TABLE IF NOT EXISTS` block, wrapped in a try/catch so they're idempotent.

---

## Common Commands

```bash
# Start development server
npx expo start

# Start and open in Android emulator
npx expo start --android

# TypeScript check
npx tsc --noEmit

# Lint
npx expo lint

# Build preview APK (EAS cloud)
eas build --platform android --profile preview

# Build local APK (requires Android Studio)
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

---

## Known Limitations & Future Work

- **No cloud sync** — data is device-local. A future version could add optional iCloud/Google Drive backup.
- **No photo attachment** — adding before/after photos to history records would be a useful extension.
- **No recurring cost tracking** — currently costs are per-completion; budget summaries could be added to the History screen.
- **Single device** — no multi-user or household sharing support.
- **Notification reschedule on boot** — Android kills scheduled notifications on reboot; a `RECEIVE_BOOT_COMPLETED` broadcast receiver (native module or Expo plugin) would fix this.
- **`useNotificationSync` hook** in `src/hooks/useAppInit.ts` is defined but not yet wired into a screen — it should be called from the root layout after initial data load.

---

## Dependencies: Do Not Change Without Reading

- **expo-sqlite**: Uses the new async API (`execAsync`, `runAsync`, `getAllAsync`). Do NOT use the old synchronous API (`openDatabase`, `transaction`).
- **react-native-uuid**: Used as `import { v4 as uuidv4 } from 'react-native-uuid'` — the default export is the namespace, not the function.
- **date-fns**: Imported as named exports (`import { format, parseISO } from 'date-fns'`). Never use `new Date(string)` for ISO parsing — always use `parseISO`.
- **Zustand v5**: Uses the `create<Store>((set, get) => ...)` API. `get()` is available inside async actions to read current state after awaiting.
