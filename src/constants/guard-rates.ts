import type { GuardRateEntry } from '../types';

// BOCAM 2026 — Guardias de presencia fisica
export const GUARD_SHIFT_RATES: GuardRateEntry[] = [
  {
    duration: '12h',
    dayType: 'laborable',
    rates: { R1: 150.00, R2: 180.00, R3: 209.88, R4: 239.88, R5: 239.88 },
  },
  {
    duration: '17h',
    dayType: 'laborable',
    rates: { R1: 212.50, R2: 255.00, R3: 297.33, R4: 339.83, R5: 339.83 },
  },
  {
    duration: '24h',
    dayType: 'festivo',
    rates: { R1: 356.88, R2: 416.64, R3: 476.40, R4: 535.92, R5: 535.92 },
  },
  {
    duration: '24h',
    dayType: 'especial',
    rates: { R1: 713.76, R2: 833.28, R3: 952.80, R4: 1071.84, R5: 1071.84 },
  },
];

// Dias especiales (1,6 ene + 24,25,31 dic)
export const SPECIAL_DATES_2026 = [
  '2026-01-01',
  '2026-01-06',
  '2026-12-24',
  '2026-12-25',
  '2026-12-31',
];
