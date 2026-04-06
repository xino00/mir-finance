import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type {
  Transaction,
  GuardShift,
  InvestmentFund,
  InvestmentEntry,
  CreditCardEntry,
  MonthlyBudget,
  MonthlyPayslip,
  AppSettings,
} from '../types';
import { usePersistedReducer } from '../hooks/usePersistedReducer';
import { transactionsReducer, type TransactionAction } from './reducers/transactions.reducer';
import { guardShiftsReducer, type GuardShiftAction } from './reducers/guard-shifts.reducer';
import {
  investmentFundsReducer,
  investmentEntriesReducer,
  type InvestmentFundAction,
  type InvestmentEntryAction,
} from './reducers/investments.reducer';
import { creditCardReducer, type CreditCardAction } from './reducers/credit-card.reducer';
import { budgetsReducer, type BudgetAction } from './reducers/budgets.reducer';
import { payslipsReducer, type PayslipAction } from './reducers/payslips.reducer';
import { settingsReducer, type SettingsAction } from './reducers/settings.reducer';
import { MIR_SALARY_TABLES, GUARD_SHIFT_RATES, ALL_DEFAULT_CATEGORIES, DEFAULT_INVESTMENT_TARGETS } from '../constants';

const defaultSettings: AppSettings = {
  currentResidencyYear: 'R1',
  payDay: 29,
  salaryTables: MIR_SALARY_TABLES,
  guardRates: GUARD_SHIFT_RATES,
  categories: ALL_DEFAULT_CATEGORIES,
  investmentTargets: DEFAULT_INVESTMENT_TARGETS,
  emergencyFund: { targetMonths: 6, currentAmount: 0 },
  recurringExpenses: [],
  theme: 'system',
};

interface AppContextType {
  transactions: Transaction[];
  dispatchTransactions: (action: TransactionAction) => void;
  guardShifts: GuardShift[];
  dispatchGuardShifts: (action: GuardShiftAction) => void;
  investmentFunds: InvestmentFund[];
  dispatchInvestmentFunds: (action: InvestmentFundAction) => void;
  investmentEntries: InvestmentEntry[];
  dispatchInvestmentEntries: (action: InvestmentEntryAction) => void;
  creditCardEntries: CreditCardEntry[];
  dispatchCreditCard: (action: CreditCardAction) => void;
  monthlyBudgets: MonthlyBudget[];
  dispatchBudgets: (action: BudgetAction) => void;
  monthlyPayslips: MonthlyPayslip[];
  dispatchPayslips: (action: PayslipAction) => void;
  settings: AppSettings;
  dispatchSettings: (action: SettingsAction) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, dispatchTransactions] = usePersistedReducer<Transaction[], TransactionAction>(
    'transactions', transactionsReducer, [],
  );
  const [guardShifts, dispatchGuardShifts] = usePersistedReducer<GuardShift[], GuardShiftAction>(
    'guardShifts', guardShiftsReducer, [],
  );
  const [investmentFunds, dispatchInvestmentFunds] = usePersistedReducer<InvestmentFund[], InvestmentFundAction>(
    'investmentFunds', investmentFundsReducer, [],
  );
  const [investmentEntries, dispatchInvestmentEntries] = usePersistedReducer<InvestmentEntry[], InvestmentEntryAction>(
    'investmentEntries', investmentEntriesReducer, [],
  );
  const [creditCardEntries, dispatchCreditCard] = usePersistedReducer<CreditCardEntry[], CreditCardAction>(
    'creditCardEntries', creditCardReducer, [],
  );
  const [monthlyBudgets, dispatchBudgets] = usePersistedReducer<MonthlyBudget[], BudgetAction>(
    'monthlyBudgets', budgetsReducer, [],
  );
  const [monthlyPayslips, dispatchPayslips] = usePersistedReducer<MonthlyPayslip[], PayslipAction>(
    'monthlyPayslips', payslipsReducer, [],
  );
  const [settings, dispatchSettings] = usePersistedReducer<AppSettings, SettingsAction>(
    'settings', settingsReducer, defaultSettings,
  );

  const value = useMemo(() => ({
    transactions,
    dispatchTransactions,
    guardShifts,
    dispatchGuardShifts,
    investmentFunds,
    dispatchInvestmentFunds,
    investmentEntries,
    dispatchInvestmentEntries,
    creditCardEntries,
    dispatchCreditCard,
    monthlyBudgets,
    dispatchBudgets,
    monthlyPayslips,
    dispatchPayslips,
    settings,
    dispatchSettings,
  }), [
    transactions, dispatchTransactions,
    guardShifts, dispatchGuardShifts,
    investmentFunds, dispatchInvestmentFunds,
    investmentEntries, dispatchInvestmentEntries,
    creditCardEntries, dispatchCreditCard,
    monthlyBudgets, dispatchBudgets,
    monthlyPayslips, dispatchPayslips,
    settings, dispatchSettings,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
