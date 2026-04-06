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
  createdAt: string;
}
