import type { GuardShift } from '../../types';

export type GuardShiftAction =
  | { type: 'ADD_GUARD_SHIFT'; payload: GuardShift }
  | { type: 'EDIT_GUARD_SHIFT'; payload: GuardShift }
  | { type: 'DELETE_GUARD_SHIFT'; payload: string }
  | { type: 'SET_GUARD_SHIFTS'; payload: GuardShift[] };

export function guardShiftsReducer(state: GuardShift[], action: GuardShiftAction): GuardShift[] {
  switch (action.type) {
    case 'ADD_GUARD_SHIFT':
      return [...state, action.payload];
    case 'EDIT_GUARD_SHIFT':
      return state.map((s) => (s.id === action.payload.id ? action.payload : s));
    case 'DELETE_GUARD_SHIFT':
      return state.filter((s) => s.id !== action.payload);
    case 'SET_GUARD_SHIFTS':
      return action.payload;
  }
}
