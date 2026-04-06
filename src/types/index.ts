export type { Transaction, TransactionType } from './transaction';
export type { GuardShift, GuardRateEntry, ResidencyYear, ShiftDuration, DayType, ShiftModality } from './guard-shift';
export type { InvestmentFund, InvestmentEntry, PortfolioTarget } from './investment';
export type { CreditCardEntry, PaymentStatus } from './credit-card';
export type { BudgetCategory, MonthlyBudget, EmergencyFundConfig } from './budget';
export type { SalaryTable, CategoryConfig, AppSettings } from './settings';

import type { Transaction } from './transaction';
import type { GuardShift } from './guard-shift';
import type { InvestmentFund, InvestmentEntry } from './investment';
import type { CreditCardEntry } from './credit-card';
import type { MonthlyBudget } from './budget';
import type { AppSettings } from './settings';

export interface AppState {
  transactions: Transaction[];
  guardShifts: GuardShift[];
  investmentFunds: InvestmentFund[];
  investmentEntries: InvestmentEntry[];
  creditCardEntries: CreditCardEntry[];
  monthlyBudgets: MonthlyBudget[];
  settings: AppSettings;
  version: number;
}
