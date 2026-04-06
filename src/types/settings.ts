import type { TransactionType } from './transaction';
import type { ResidencyYear, GuardRateEntry } from './guard-shift';
import type { PortfolioTarget } from './investment';
import type { EmergencyFundConfig } from './budget';

export interface SalaryTable {
  year: ResidencyYear;
  baseSalary: number;
  gradeComplement: number;
  totalMonthly: number;
  paymentsPerYear: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color: string;
  subcategories: string[];
  isDefault: boolean;
}

export interface AppSettings {
  currentResidencyYear: ResidencyYear;
  payDay: number;
  salaryTables: SalaryTable[];
  guardRates: GuardRateEntry[];
  categories: CategoryConfig[];
  investmentTargets: PortfolioTarget[];
  emergencyFund: EmergencyFundConfig;
  theme: 'light' | 'dark' | 'system';
  lastExportDate?: string;
}
