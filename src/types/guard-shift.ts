export type ResidencyYear = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export type ShiftDuration = '12h' | '17h' | '24h';
export type DayType = 'laborable' | 'festivo' | 'especial';
export type ShiftModality = 'presencia_fisica' | 'localizada';

export interface GuardShift {
  id: string;
  date: string;
  duration: ShiftDuration;
  dayType: DayType;
  modality: ShiftModality;
  residencyYear: ResidencyYear;
  grossAmount: number;
  notes?: string;
  createdAt: string;
}

export interface GuardRateEntry {
  duration: ShiftDuration;
  dayType: DayType;
  rates: Record<ResidencyYear, number>;
}
