import { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { subMonths, parse, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import { formatCurrency, formatPercent } from '../../utils';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export default function DashboardPage() {
  const { transactions, guardShifts, monthlyPayslips, settings } = useAppContext();
  const { selectedMonth } = useSelectedMonth();

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  );

  const monthGuardShifts = useMemo(
    () => guardShifts.filter((g) => g.date.startsWith(selectedMonth)),
    [guardShifts, selectedMonth],
  );

  // Use actual net from payslip if available, otherwise estimated, otherwise fall back to gross
  const payslip = useMemo(
    () => monthlyPayslips.find((p) => p.month === selectedMonth),
    [monthlyPayslips, selectedMonth],
  );

  const income = useMemo(() => {
    const txIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // If payslip exists, use net (actual or estimated) instead of gross
    if (payslip) {
      const netPayslip = payslip.actualNet ?? payslip.estimatedNet;
      return txIncome + netPayslip;
    }

    // Fallback: gross salary + gross guards (for months without payslip data)
    const guardIncome = monthGuardShifts.reduce((sum, g) => sum + g.grossAmount, 0);
    return txIncome + guardIncome;
  }, [monthTransactions, monthGuardShifts, payslip]);

  const expenses = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions],
  );

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Expenses by category for the donut chart
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    return Array.from(map.entries()).map(([catId, amount]) => {
      const cat = settings.categories.find((c) => c.id === catId);
      return {
        name: cat?.name ?? catId,
        value: amount,
        color: cat?.color ?? '#94a3b8',
      };
    });
  }, [monthTransactions, settings.categories]);

  // Last 6 months evolution data
  const evolutionData = useMemo(() => {
    const base = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    const months: { month: string; key: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(base, i);
      months.push({
        month: format(d, 'MMM yy', { locale: es }),
        key: format(d, 'yyyy-MM'),
      });
    }

    return months.map(({ month, key }) => {
      const txMonth = transactions.filter((t) => t.date.startsWith(key));
      const gsMonth = guardShifts.filter((g) => g.date.startsWith(key));
      const ps = monthlyPayslips.find((p) => p.month === key);

      const txInc = txMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const inc = ps
        ? txInc + (ps.actualNet ?? ps.estimatedNet)
        : txInc + gsMonth.reduce((s, g) => s + g.grossAmount, 0);
      const exp = txMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      return { month, Ingresos: inc, Gastos: exp };
    });
  }, [selectedMonth, transactions, guardShifts, monthlyPayslips]);

  const hasData = monthTransactions.length > 0 || monthGuardShifts.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<BarChart3 size={48} />}
        title="Sin datos este mes"
        description="Agrega ingresos, gastos o guardias para ver tu resumen financiero."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Ingresos del mes"
          value={formatCurrency(income)}
          colorClass="text-green-600 dark:text-green-400"
          bgClass="bg-green-50 dark:bg-green-900/20"
        />
        <KpiCard
          icon={<TrendingDown size={20} />}
          label="Gastos del mes"
          value={formatCurrency(expenses)}
          colorClass="text-red-600 dark:text-red-400"
          bgClass="bg-red-50 dark:bg-red-900/20"
        />
        <KpiCard
          icon={<PiggyBank size={20} />}
          label="Ahorro del mes"
          value={formatCurrency(savings)}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard
          icon={<Percent size={20} />}
          label="Tasa de ahorro"
          value={formatPercent(savingsRate)}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart - expenses by category */}
        <Card title="Gastos por categoria">
          {expensesByCategory.length === 0 ? (
            <p className="text-xs text-surface-500 dark:text-surface-400 text-center py-8">
              Sin gastos este mes
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend below chart */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {expensesByCategory.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-400">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Bar chart - monthly evolution */}
        <Card title="Evolucion mensual">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionData}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.75rem' }}
                />
                <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---- KPI card helper ---- */

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  bgClass: string;
}

function KpiCard({ icon, label, value, colorClass, bgClass }: KpiCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{label}</p>
          <p className={`text-lg font-bold mt-0.5 ${colorClass}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}
