export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  isRecurring: boolean;
  recurringDay?: number;
  fromRecurringId?: string;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  dayOfMonth: number;
}

export interface MonthlyPayslip {
  month: string;
  grossSalary: number;
  grossGuards: number;
  estimatedNet: number;
  actualNet?: number;
}
