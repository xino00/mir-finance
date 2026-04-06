import { useReducer, useEffect, useRef, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

export function usePersistedReducer<S, A>(
  key: string,
  reducer: (state: S, action: A) => S,
  initialState: S,
): [S, (action: A) => void] {
  const [state, dispatch] = useReducer(reducer, initialState, () =>
    loadFromStorage(key, initialState),
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveToStorage(key, stateRef.current);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, key]);

  const persistedDispatch = useCallback((action: A) => {
    dispatch(action);
  }, []);

  return [state, persistedDispatch];
}
