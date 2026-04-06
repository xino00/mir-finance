import type { MonthlyBudget } from '../../types';

export type BudgetAction =
  | { type: 'SET_BUDGET'; payload: MonthlyBudget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'SET_BUDGETS'; payload: MonthlyBudget[] };

export function budgetsReducer(state: MonthlyBudget[], action: BudgetAction): MonthlyBudget[] {
  switch (action.type) {
    case 'SET_BUDGET': {
      const idx = state.findIndex((b) => b.month === action.payload.month);
      if (idx >= 0) {
        return state.map((b, i) => (i === idx ? action.payload : b));
      }
      return [...state, action.payload];
    }
    case 'DELETE_BUDGET':
      return state.filter((b) => b.month !== action.payload);
    case 'SET_BUDGETS':
      return action.payload;
  }
}
