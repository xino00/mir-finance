import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowUpCircle, ArrowDownCircle, TrendingUp, Menu } from 'lucide-react';
import { useState } from 'react';
import { CreditCard, Target, Settings } from 'lucide-react';

const mainLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/ingresos', icon: ArrowUpCircle, label: 'Ingresos' },
  { to: '/gastos', icon: ArrowDownCircle, label: 'Gastos' },
  { to: '/inversiones', icon: TrendingUp, label: 'Cartera' },
];

const moreLinks = [
  { to: '/tarjeta', icon: CreditCard, label: 'Tarjeta' },
  { to: '/presupuesto', icon: Target, label: 'Presupuesto' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function BottomNav() {
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setShowMore(false)}
        />
      )}
      {showMore && (
        <div className="fixed bottom-16 right-2 z-50 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-2 min-w-[160px]">
          {moreLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-400'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {mainLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-400 dark:text-surface-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setShowMore((p) => !p)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-surface-400 dark:text-surface-500"
          >
            <Menu size={20} />
            Mas
          </button>
        </div>
      </nav>
    </>
  );
}
