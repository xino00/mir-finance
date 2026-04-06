import type { ShiftDuration, DayType, ResidencyYear, ShiftModality } from '../types';
import { GUARD_SHIFT_RATES, SPECIAL_DATES_2026 } from '../constants';
import { getDay } from 'date-fns';

export function calculateGuardGross(
  duration: ShiftDuration,
  dayType: DayType,
  residencyYear: ResidencyYear,
  modality: ShiftModality,
): number {
  const entry = GUARD_SHIFT_RATES.find(
    (r) => r.duration === duration && r.dayType === dayType,
  );
  if (!entry) return 0;
  const gross = entry.rates[residencyYear];
  return modality === 'localizada' ? gross * 0.5 : gross;
}

export function detectDayType(dateStr: string): DayType {
  if (SPECIAL_DATES_2026.includes(dateStr)) return 'especial';
  // Parse as local date to avoid UTC timezone shift (YYYY-MM-DD parses as UTC in Date constructor)
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = getDay(new Date(y, m - 1, d));
  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) return 'festivo';
  return 'laborable';
}
