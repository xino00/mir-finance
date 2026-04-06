import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  TrendingUp,
  Target,
  Settings,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ingresos', icon: ArrowUpCircle, label: 'Ingresos' },
  { to: '/gastos', icon: ArrowDownCircle, label: 'Gastos' },
  { to: '/tarjeta', icon: CreditCard, label: 'Tarjeta' },
  { to: '/inversiones', icon: TrendingUp, label: 'Inversiones' },
  { to: '/presupuesto', icon: Target, label: 'Presupuesto' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700">
      <div className="p-5">
        <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400">MIR Finance</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
