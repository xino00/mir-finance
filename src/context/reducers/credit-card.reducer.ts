import type { CreditCardEntry } from '../../types';

export type CreditCardAction =
  | { type: 'ADD_CC_ENTRY'; payload: CreditCardEntry }
  | { type: 'EDIT_CC_ENTRY'; payload: CreditCardEntry }
  | { type: 'DELETE_CC_ENTRY'; payload: string }
  | { type: 'SET_CC_ENTRIES'; payload: CreditCardEntry[] };

export function creditCardReducer(state: CreditCardEntry[], action: CreditCardAction): CreditCardEntry[] {
  switch (action.type) {
    case 'ADD_CC_ENTRY':
      return [...state, action.payload];
    case 'EDIT_CC_ENTRY':
      return state.map((e) => (e.id === action.payload.id ? action.payload : e));
    case 'DELETE_CC_ENTRY':
      return state.filter((e) => e.id !== action.payload);
    case 'SET_CC_ENTRIES':
      return action.payload;
  }
}
