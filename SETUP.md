# Home Maintenance App — Setup Guide

## Prerequisites

1. **Install Node.js** (v18 or later): https://nodejs.org/
2. **Install Expo Go** on your Android phone (from the Play Store) — for quick testing
3. (Optional) Android Studio + emulator for full build

## Quick Start

```bash
# 1. Open a terminal in this folder
cd C:\Users\Satya\home-maintenance-app

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start

# 4. Scan the QR code with Expo Go on your phone
```

## Building an APK (Android Install File)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo account (free)
eas login

# Configure the build
eas build:configure

# Build a preview APK (runs in cloud, takes ~10 min)
eas build -p android --profile preview
```

## Features

### Dashboard
- See overdue and upcoming maintenance at a glance
- Color-coded status: red = overdue, orange = due soon, green = up to date
- Quick "Mark Done" button on every card (checkmark icon)
- Pull to refresh

### All Items
- Browse all 40+ pre-loaded maintenance items
- Filter by category (HVAC, Water, Safety, Electrical, etc.)
- Filter by status (Overdue, Due Soon, Up to Date)
- Search by name or category
- Tap + to add a custom item

### Item Detail
- Full maintenance info: interval, last done, next due, notification setting
- "Mark as Completed Today" — optionally add notes and cost
- Full completion history log
- Edit interval, notification days, name, and description inline
- Delete item (with confirmation)

### History
- Chronological log of all completions
- Filter by time range (30 days / 3 months / 6 months / 1 year / all time)
- Shows total tasks done, total cost, unique items
- Delete individual records

### Settings
- Toggle notifications on/off
- Change default reminder days (how many days before due to notify)
- Change "due soon" window (how many days ahead to show warnings)
- PIN lock (4-8 digits, stored in device secure enclave)
- Biometric unlock (fingerprint / Face ID)
- Lock app manually

## Pre-loaded Categories

| Category     | Examples                                              |
|-------------|-------------------------------------------------------|
| HVAC         | Furnace filter, AC filter, duct cleaning             |
| Water        | Refrigerator filter, water heater flush, softener    |
| Safety       | Smoke detector batteries, CO detector, extinguisher  |
| Exterior     | Gutters, roof inspection, caulking, deck sealing     |
| Plumbing     | Drains, washing machine hoses, sump pump             |
| Electrical   | GFCI outlets, panel inspection, bulbs                |
| Appliances   | Dryer vent, refrigerator coils, dishwasher           |
| Seasonal     | Lawn fertilizer, pest control, chimney               |
| Custom       | Anything you add yourself                            |

## Security

- All data stored **locally on device** — never sent to the internet
- PIN stored in the device's **secure enclave** (Keychain/Keystore)
- All text inputs sanitized to prevent injection attacks
- Biometric authentication uses the device OS — no biometric data touches the app
- App auto-locks when sent to background (if PIN enabled)
