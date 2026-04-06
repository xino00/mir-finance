import { ChevronLeft, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { formatMonth } from '../../utils/formatters';
import { format, addMonths, subMonths, parse } from 'date-fns';
import AccountMenu from './AccountMenu';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export default function Header({ selectedMonth, onMonthChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const goPrev = () => {
    const d = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    onMonthChange(format(subMonths(d, 1), 'yyyy-MM'));
  };

  const goNext = () => {
    const d = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    onMonthChange(format(addMonths(d, 1), 'yyyy-MM'));
  };

  const nextTheme = () => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % 3]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="flex items-center justify-between px-4 py-3 lg:px-6 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700">
      <div className="flex items-center gap-2">
        <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold min-w-[140px] text-center capitalize">
          {formatMonth(selectedMonth)}
        </span>
        <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={nextTheme}
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
          title={`Tema: ${theme}`}
        >
          <ThemeIcon size={18} />
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
