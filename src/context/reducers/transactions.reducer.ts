import type { Transaction } from '../../types';

export type TransactionAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'EDIT_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] };

export function transactionsReducer(state: Transaction[], action: TransactionAction): Transaction[] {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return [...state, action.payload];
    case 'EDIT_TRANSACTION':
      return state.map((t) => (t.id === action.payload.id ? action.payload : t));
    case 'DELETE_TRANSACTION':
      return state.filter((t) => t.id !== action.payload);
    case 'SET_TRANSACTIONS':
      return action.payload;
  }
}
