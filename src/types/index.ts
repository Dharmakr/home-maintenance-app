export type MaintenanceCategory =
  | 'HVAC'
  | 'Water'
  | 'Safety'
  | 'Exterior'
  | 'Plumbing'
  | 'Electrical'
  | 'Appliances'
  | 'Seasonal'
  | 'Custom';

export type ItemStatus = 'overdue' | 'due_soon' | 'ok' | 'never_done';

export interface MaintenanceItem {
  id: string;
  name: string;
  category: MaintenanceCategory;
  description: string;
  intervalDays: number;
  lastCompletedDate: string | null; // ISO date string
  nextDueDate: string | null;       // ISO date string
  notificationDaysBefore: number;
  isActive: boolean;
  isCustom: boolean;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryRecord {
  id: string;
  itemId: string;
  completedDate: string; // ISO date string
  notes: string;
  cost: number | null;
  createdAt: string;
}

export interface AppSettings {
  pinEnabled: boolean;
  biometricEnabled: boolean;
  defaultNotificationDays: number;
  notificationsEnabled: boolean;
  dueSoonWindowDays: number;
}

export interface MaintenanceStore {
  items: MaintenanceItem[];
  history: HistoryRecord[];
  settings: AppSettings;
  isLoading: boolean;
  isLocked: boolean;

  // Items
  loadItems: () => Promise<void>;
  addItem: (item: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<MaintenanceItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  markDone: (id: string, notes?: string, cost?: number) => Promise<void>;

  // History
  loadHistory: () => Promise<void>;
  deleteHistoryRecord: (id: string) => Promise<void>;

  // Settings
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Security
  lock: () => void;
  unlock: () => void;
}

export const CATEGORY_META: Record<
  MaintenanceCategory,
  { label: string; icon: string; color: string }
> = {
  HVAC: { label: 'HVAC', icon: 'thermometer', color: '#E74C3C' },
  Water: { label: 'Water', icon: 'water', color: '#3498DB' },
  Safety: { label: 'Safety', icon: 'shield-checkmark', color: '#E67E22' },
  Exterior: { label: 'Exterior', icon: 'home', color: '#27AE60' },
  Plumbing: { label: 'Plumbing', icon: 'construct', color: '#8E44AD' },
  Electrical: { label: 'Electrical', icon: 'flash', color: '#F1C40F' },
  Appliances: { label: 'Appliances', icon: 'hardware-chip', color: '#16A085' },
  Seasonal: { label: 'Seasonal', icon: 'leaf', color: '#2ECC71' },
  Custom: { label: 'Custom', icon: 'add-circle', color: '#95A5A6' },
};
