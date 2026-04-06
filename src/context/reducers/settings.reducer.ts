import type { AppSettings } from '../../types';

export type SettingsAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_SETTINGS'; payload: AppSettings };

export function settingsReducer(state: AppSettings, action: SettingsAction): AppSettings {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return { ...state, ...action.payload };
    case 'SET_SETTINGS':
      return action.payload;
  }
}
