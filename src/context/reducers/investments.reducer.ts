import type { InvestmentFund, InvestmentEntry } from '../../types';

export type InvestmentFundAction =
  | { type: 'ADD_FUND'; payload: InvestmentFund }
  | { type: 'EDIT_FUND'; payload: InvestmentFund }
  | { type: 'DELETE_FUND'; payload: string };

export type InvestmentEntryAction =
  | { type: 'ADD_ENTRY'; payload: InvestmentEntry }
  | { type: 'EDIT_ENTRY'; payload: InvestmentEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_ENTRIES'; payload: InvestmentEntry[] };

export function investmentFundsReducer(state: InvestmentFund[], action: InvestmentFundAction): InvestmentFund[] {
  switch (action.type) {
    case 'ADD_FUND':
      return [...state, action.payload];
    case 'EDIT_FUND':
      return state.map((f) => (f.id === action.payload.id ? action.payload : f));
    case 'DELETE_FUND':
      return state.filter((f) => f.id !== action.payload);
  }
}

export function investmentEntriesReducer(state: InvestmentEntry[], action: InvestmentEntryAction): InvestmentEntry[] {
  switch (action.type) {
    case 'ADD_ENTRY':
      return [...state, action.payload];
    case 'EDIT_ENTRY':
      return state.map((e) => (e.id === action.payload.id ? action.payload : e));
    case 'DELETE_ENTRY':
      return state.filter((e) => e.id !== action.payload);
    case 'SET_ENTRIES':
      return action.payload;
  }
}
