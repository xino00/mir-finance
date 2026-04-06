import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export function useTheme() {
  const { settings, dispatchSettings } = useAppContext();
  const { theme } = settings;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => {
        if (mq.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    dispatchSettings({ type: 'UPDATE_SETTINGS', payload: { theme: t } });
  };

  return { theme, setTheme };
}
