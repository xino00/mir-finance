import type { MonthlyPayslip } from '../../types';

export type PayslipAction =
  | { type: 'SET_PAYSLIP'; payload: MonthlyPayslip }
  | { type: 'SET_PAYSLIPS'; payload: MonthlyPayslip[] };

export function payslipsReducer(state: MonthlyPayslip[], action: PayslipAction): MonthlyPayslip[] {
  switch (action.type) {
    case 'SET_PAYSLIP': {
      const idx = state.findIndex((p) => p.month === action.payload.month);
      if (idx >= 0) {
        return state.map((p, i) => (i === idx ? action.payload : p));
      }
      return [...state, action.payload];
    }
    case 'SET_PAYSLIPS':
      return action.payload;
  }
}
