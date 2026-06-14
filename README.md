# 🏠 Home Maintenance App

A mobile Android app for tracking scheduled home maintenance tasks — furnace filters, water filters, smoke detector batteries, gutter cleaning, and more. Get notified before tasks are due, log completion history with costs and notes, and add fully custom maintenance records.

Built with **React Native + Expo** (TypeScript), runs on Android and iOS.

---

## Screenshots

| Dashboard | All Items | Item Detail | History | Settings |
|-----------|-----------|-------------|---------|----------|
| Overdue & due-soon cards with quick Mark Done | Search, filter by category & status | Interval, history, inline edit | Monthly completion log with costs | PIN lock, biometrics, notification config |

---

## Features

### Maintenance Tracking
- **40+ pre-loaded items** across 8 categories (HVAC, Water, Safety, Exterior, Plumbing, Electrical, Appliances, Seasonal)
- **Custom items** — add anything with a name, category, icon, color, and custom interval
- **Flexible intervals** — daily, weekly, monthly, yearly, or exact day count
- **Mark Done** with optional notes and cost — updates next due date automatically

### Notifications
- **Local push notifications** scheduled per item (no server required)
- Configurable reminder lead time per item (e.g. 7 days before, 14 days before)
- Separate "due today" overdue alert
- Global notification toggle in Settings

### Dashboard
- At-a-glance summary: overdue count, due soon, not-yet-started, total
- Overdue items listed first, color-coded red
- Due-soon items in orange within your configurable window (default 14 days)
- Pull-to-refresh

### History Log
- Full completion history per item
- Filter by time range: 30 days / 3 months / 6 months / 1 year / all time
- Total cost tracking and summary
- Delete individual records

### Security
- **PIN lock** (4–8 digits) stored in the device secure enclave (Android Keystore / iOS Keychain)
- **Biometric unlock** — fingerprint or Face ID
- Auto-locks when app is sent to background
- All input sanitized against injection attacks
- **100% local storage** — no data leaves your device

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 52 |
| Navigation | Expo Router (file-based) |
| Database | expo-sqlite (SQLite, on-device) |
| State | Zustand |
| Notifications | expo-notifications (local) |
| Security | expo-secure-store + expo-local-authentication |
| Language | TypeScript (strict mode) |
| Date utils | date-fns |

---

## Pre-Loaded Maintenance Items

### HVAC
- Furnace Filter Replacement (every 90 days)
- AC Filter Replacement (every 90 days)
- HVAC Annual Tune-Up (every 365 days)
- Air Duct Cleaning (every 3 years)

### Water
- Refrigerator Water Filter (every 180 days)
- Under-Sink Water Filter (every 180 days)
- Whole House Water Filter (every 90 days)
- Water Heater Flush (every 365 days)
- Water Softener Salt (every 30 days)
- Water Heater Anode Rod (every 3 years)

### Safety
- Smoke Detector Battery (every 365 days)
- CO Detector Battery (every 365 days)
- Smoke/CO Detector Replacement (every 10 years)
- Fire Extinguisher Inspection (every 365 days)
- Garage Door Safety Test (every 180 days)

### Exterior
- Gutter Cleaning (every 180 days)
- Roof Inspection (every 365 days)
- Exterior Caulking & Sealing (every 2 years)
- Deck/Patio Sealing (every 2 years)
- Driveway Sealing (every 3 years)
- Window Cleaning (every 180 days)

### Plumbing
- Drain Cleaning (every 180 days)
- Washing Machine Hose Check (every 365 days)
- Toilet Flapper & Flush Check (every 365 days)
- Sump Pump Test (every 180 days)
- Outdoor Faucet Winterization (every 365 days)

### Electrical
- GFCI Outlet Test (every 180 days)
- Electrical Panel Inspection (every 365 days)
- Light Bulb Audit (every 180 days)

### Appliances
- Dryer Vent Cleaning (every 365 days)
- Refrigerator Coil Cleaning (every 180 days)
- Dishwasher Cleaning (every 90 days)
- Washing Machine Cleaning (every 30 days)
- Range Hood Filter Cleaning (every 90 days)
- Garbage Disposal Cleaning (every 30 days)

### Seasonal
- Lawn Fertilization (every 90 days)
- Pest Control Treatment (every 90 days)
- Sprinkler System Check (every 180 days)
- Chimney Cleaning & Inspection (every 365 days)

---

## Build & Run

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app on your Android device (for quick testing)
- (Optional) Android Studio + Android emulator for local builds

### Development (Expo Go — fastest)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/home-maintenance-app.git
cd home-maintenance-app

# Install dependencies
npm install

# Start the Expo development server
npx expo start

# Scan the QR code with Expo Go on your Android phone
# Or press 'a' to open in an Android emulator
```

### Build APK for Android (via Expo Application Services)

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account (create one free at expo.dev)
eas login

# Configure the project (first time only)
eas build:configure

# Build a preview APK (runs in the cloud, ~10 minutes)
eas build --platform android --profile preview

# Download and install the APK on your device when the build completes
```

### Build locally (requires Android Studio)

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug

# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Project Structure

```
home-maintenance-app/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (init, lock screen)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Dashboard screen
│   │   ├── items.tsx           # All items screen
│   │   ├── history.tsx         # History screen
│   │   └── settings.tsx        # Settings screen
│   └── item/
│       ├── [id].tsx            # Item detail / edit screen
│       └── add.tsx             # Add new item screen
├── src/
│   ├── types/index.ts          # TypeScript types and interfaces
│   ├── constants/
│   │   ├── defaults.ts         # Pre-loaded maintenance items
│   │   └── theme.ts            # Colors, spacing, typography
│   ├── database/db.ts          # SQLite operations (CRUD)
│   ├── services/
│   │   ├── notifications.ts    # Local notification scheduling
│   │   └── security.ts         # PIN (SecureStore) + biometrics
│   ├── store/useStore.ts       # Zustand global state + selectors
│   ├── hooks/useAppInit.ts     # Notification sync hook
│   └── components/
│       ├── MaintenanceCard.tsx # Item card with status + quick done
│       ├── StatusBadge.tsx     # Overdue/Due Soon/OK badge
│       ├── EmptyState.tsx      # Empty list placeholder
│       └── LockScreen.tsx      # PIN keypad lock screen
├── app.json                    # Expo configuration
├── package.json
└── tsconfig.json
```

---

## Configuration

### Notification Channels (Android)
- `maintenance-reminders` — HIGH priority, fires X days before due date
- `maintenance-overdue` — MAX priority, fires on the due date

### Data Model

**MaintenanceItem**
```ts
{
  id: string
  name: string
  category: MaintenanceCategory
  description: string
  intervalDays: number          // how often to perform
  lastCompletedDate: string | null
  nextDueDate: string | null    // auto-calculated
  notificationDaysBefore: number
  isActive: boolean
  isCustom: boolean
  color: string                 // hex color for UI accent
  icon: string                  // Ionicons icon name
}
```

**HistoryRecord**
```ts
{
  id: string
  itemId: string
  completedDate: string
  notes: string
  cost: number | null
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.
