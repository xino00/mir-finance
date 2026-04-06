export interface BudgetCategory {
  category: string;
  monthlyLimit: number;
}

export interface MonthlyBudget {
  month: string;
  categories: BudgetCategory[];
  savingsTarget: number;
}

export interface EmergencyFundConfig {
  targetMonths: number;
  currentAmount: number;
}
