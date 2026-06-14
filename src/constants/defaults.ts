import { MaintenanceCategory } from '../types';

export interface DefaultItem {
  name: string;
  category: MaintenanceCategory;
  description: string;
  intervalDays: number;
  icon: string;
  color: string;
}

export const DEFAULT_MAINTENANCE_ITEMS: DefaultItem[] = [
  // HVAC
  {
    name: 'Furnace Filter Replacement',
    category: 'HVAC',
    description: 'Replace the furnace/air handler filter to maintain air quality and HVAC efficiency.',
    intervalDays: 90,
    icon: 'thermometer',
    color: '#E74C3C',
  },
  {
    name: 'AC Filter Replacement',
    category: 'HVAC',
    description: 'Replace the air conditioner filter. Check monthly in heavy-use seasons.',
    intervalDays: 90,
    icon: 'thermometer',
    color: '#E74C3C',
  },
  {
    name: 'HVAC Annual Tune-Up',
    category: 'HVAC',
    description: 'Professional inspection and tune-up of heating and cooling system.',
    intervalDays: 365,
    icon: 'thermometer',
    color: '#E74C3C',
  },
  {
    name: 'Air Duct Cleaning',
    category: 'HVAC',
    description: 'Professional cleaning of air ducts to remove dust, mold, and allergens.',
    intervalDays: 1095,
    icon: 'thermometer',
    color: '#E74C3C',
  },

  // Water
  {
    name: 'Refrigerator Water Filter',
    category: 'Water',
    description: 'Replace the refrigerator inline water filter for clean drinking water and ice.',
    intervalDays: 180,
    icon: 'water',
    color: '#3498DB',
  },
  {
    name: 'Under-Sink Water Filter',
    category: 'Water',
    description: 'Replace under-sink water filtration cartridges.',
    intervalDays: 180,
    icon: 'water',
    color: '#3498DB',
  },
  {
    name: 'Whole House Water Filter',
    category: 'Water',
    description: 'Replace or clean the whole-house sediment/carbon filter.',
    intervalDays: 90,
    icon: 'water',
    color: '#3498DB',
  },
  {
    name: 'Water Heater Flush',
    category: 'Water',
    description: 'Flush sediment from the water heater tank to extend its life and efficiency.',
    intervalDays: 365,
    icon: 'water',
    color: '#3498DB',
  },
  {
    name: 'Water Softener Salt',
    category: 'Water',
    description: 'Check and refill water softener salt pellets.',
    intervalDays: 30,
    icon: 'water',
    color: '#3498DB',
  },
  {
    name: 'Water Heater Anode Rod',
    category: 'Water',
    description: 'Inspect and replace the sacrificial anode rod to prevent tank corrosion.',
    intervalDays: 1095,
    icon: 'water',
    color: '#3498DB',
  },

  // Safety
  {
    name: 'Smoke Detector Battery',
    category: 'Safety',
    description: 'Replace batteries in all smoke detectors. Test by pressing the test button.',
    intervalDays: 365,
    icon: 'shield-checkmark',
    color: '#E67E22',
  },
  {
    name: 'CO Detector Battery',
    category: 'Safety',
    description: 'Replace batteries in all carbon monoxide detectors and test functionality.',
    intervalDays: 365,
    icon: 'shield-checkmark',
    color: '#E67E22',
  },
  {
    name: 'Smoke/CO Detector Replacement',
    category: 'Safety',
    description: 'Replace entire smoke/CO detector units — sensors degrade over time.',
    intervalDays: 3650,
    icon: 'shield-checkmark',
    color: '#E67E22',
  },
  {
    name: 'Fire Extinguisher Inspection',
    category: 'Safety',
    description: 'Inspect fire extinguisher pressure gauge and check for corrosion or damage.',
    intervalDays: 365,
    icon: 'shield-checkmark',
    color: '#E67E22',
  },
  {
    name: 'Garage Door Safety Test',
    category: 'Safety',
    description: 'Test auto-reverse feature and photo-eye sensors on garage door opener.',
    intervalDays: 180,
    icon: 'shield-checkmark',
    color: '#E67E22',
  },

  // Exterior
  {
    name: 'Gutter Cleaning',
    category: 'Exterior',
    description: 'Clean gutters and downspouts of leaves and debris. Check for proper drainage.',
    intervalDays: 180,
    icon: 'home',
    color: '#27AE60',
  },
  {
    name: 'Roof Inspection',
    category: 'Exterior',
    description: 'Inspect roof for missing/damaged shingles, flashing, and signs of leaks.',
    intervalDays: 365,
    icon: 'home',
    color: '#27AE60',
  },
  {
    name: 'Exterior Caulking & Sealing',
    category: 'Exterior',
    description: 'Inspect and re-caulk around windows, doors, and penetrations to prevent water intrusion.',
    intervalDays: 730,
    icon: 'home',
    color: '#27AE60',
  },
  {
    name: 'Deck/Patio Sealing',
    category: 'Exterior',
    description: 'Clean and apply sealant/stain to wood deck or patio to prevent weathering.',
    intervalDays: 730,
    icon: 'home',
    color: '#27AE60',
  },
  {
    name: 'Driveway Sealing',
    category: 'Exterior',
    description: 'Seal asphalt driveway to fill cracks and protect from weather damage.',
    intervalDays: 1095,
    icon: 'home',
    color: '#27AE60',
  },
  {
    name: 'Window Cleaning',
    category: 'Exterior',
    description: 'Clean exterior windows and check window seals for fogging or failure.',
    intervalDays: 180,
    icon: 'home',
    color: '#27AE60',
  },

  // Plumbing
  {
    name: 'Drain Cleaning',
    category: 'Plumbing',
    description: 'Clean sink, shower, and tub drains to prevent slow drains and clogs.',
    intervalDays: 180,
    icon: 'construct',
    color: '#8E44AD',
  },
  {
    name: 'Washing Machine Hose Check',
    category: 'Plumbing',
    description: 'Inspect washing machine inlet hoses for bulges, cracks, or leaks. Replace if needed.',
    intervalDays: 365,
    icon: 'construct',
    color: '#8E44AD',
  },
  {
    name: 'Toilet Flapper & Flush Check',
    category: 'Plumbing',
    description: 'Check toilet for running water — replace flapper if worn to prevent water waste.',
    intervalDays: 365,
    icon: 'construct',
    color: '#8E44AD',
  },
  {
    name: 'Sump Pump Test',
    category: 'Plumbing',
    description: 'Test sump pump by pouring water into pit. Confirm float switch and discharge.',
    intervalDays: 180,
    icon: 'construct',
    color: '#8E44AD',
  },
  {
    name: 'Outdoor Faucet Winterization',
    category: 'Plumbing',
    description: 'Shut off and drain outdoor faucets/hose bibs before winter to prevent pipe freezing.',
    intervalDays: 365,
    icon: 'construct',
    color: '#8E44AD',
  },

  // Electrical
  {
    name: 'GFCI Outlet Test',
    category: 'Electrical',
    description: 'Test all GFCI outlets (kitchen, bathrooms, garage, outdoor) using test/reset buttons.',
    intervalDays: 180,
    icon: 'flash',
    color: '#F1C40F',
  },
  {
    name: 'Electrical Panel Inspection',
    category: 'Electrical',
    description: 'Inspect electrical panel for signs of overheating, corrosion, or tripping breakers.',
    intervalDays: 365,
    icon: 'flash',
    color: '#D4AC0D',
  },
  {
    name: 'Light Bulb Audit',
    category: 'Electrical',
    description: 'Replace any burnt-out bulbs and consider upgrading to LED for energy savings.',
    intervalDays: 180,
    icon: 'flash',
    color: '#D4AC0D',
  },

  // Appliances
  {
    name: 'Dryer Vent Cleaning',
    category: 'Appliances',
    description: 'Clean dryer exhaust vent duct — a leading cause of home fires when blocked.',
    intervalDays: 365,
    icon: 'hardware-chip',
    color: '#16A085',
  },
  {
    name: 'Refrigerator Coil Cleaning',
    category: 'Appliances',
    description: 'Vacuum condenser coils behind/under refrigerator to improve efficiency and lifespan.',
    intervalDays: 180,
    icon: 'hardware-chip',
    color: '#16A085',
  },
  {
    name: 'Dishwasher Cleaning',
    category: 'Appliances',
    description: 'Run a cleaning cycle and clean filter, spray arms, and door gasket.',
    intervalDays: 90,
    icon: 'hardware-chip',
    color: '#16A085',
  },
  {
    name: 'Washing Machine Cleaning',
    category: 'Appliances',
    description: 'Run a hot cleaning cycle with washer cleaner. Clean gasket and detergent drawer.',
    intervalDays: 30,
    icon: 'hardware-chip',
    color: '#16A085',
  },
  {
    name: 'Range Hood Filter Cleaning',
    category: 'Appliances',
    description: 'Clean or replace range hood/vent filters to maintain airflow and fire safety.',
    intervalDays: 90,
    icon: 'hardware-chip',
    color: '#16A085',
  },
  {
    name: 'Garbage Disposal Cleaning',
    category: 'Appliances',
    description: 'Clean disposal with ice cubes and citrus to remove odors and buildup.',
    intervalDays: 30,
    icon: 'hardware-chip',
    color: '#16A085',
  },

  // Seasonal
  {
    name: 'Lawn Fertilization',
    category: 'Seasonal',
    description: 'Apply fertilizer to lawn. Schedule for spring/fall based on grass type.',
    intervalDays: 90,
    icon: 'leaf',
    color: '#2ECC71',
  },
  {
    name: 'Pest Control Treatment',
    category: 'Seasonal',
    description: 'Apply pest control treatment around home perimeter and in crawl spaces.',
    intervalDays: 90,
    icon: 'leaf',
    color: '#2ECC71',
  },
  {
    name: 'Sprinkler System Check',
    category: 'Seasonal',
    description: 'Inspect and test all sprinkler heads. Adjust timing for seasonal watering needs.',
    intervalDays: 180,
    icon: 'leaf',
    color: '#2ECC71',
  },
  {
    name: 'Chimney Cleaning & Inspection',
    category: 'Seasonal',
    description: 'Professional chimney sweep and inspection before fireplace season.',
    intervalDays: 365,
    icon: 'leaf',
    color: '#2ECC71',
  },
];

export const DEFAULT_SETTINGS = {
  pinEnabled: false,
  biometricEnabled: false,
  defaultNotificationDays: 7,
  notificationsEnabled: true,
  dueSoonWindowDays: 14,
};
