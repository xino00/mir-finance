import { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import { estimateMonthlyNet } from '../../utils/net-calculator';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import { formatCurrency } from '../../utils/formatters';
import { Target, PiggyBank, AlertTriangle, Plus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { MonthlyBudget, BudgetCategory, ResidencyYear } from '../../types';
import { subMonths, format, parse } from 'date-fns';

export default function BudgetPage() {
  const { selectedMonth } = useSelectedMonth();
  const { transactions, settings, monthlyBudgets, dispatchBudgets, dispatchSettings } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const expenseCategories = settings.categories.filter((c) => c.type === 'expense');

  const currentBudget = monthlyBudgets.find((b) => b.month === selectedMonth);

  const monthExpenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense' && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [monthExpenses]);

  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalBudget = currentBudget?.categories.reduce((s, c) => s + c.monthlyLimit, 0) ?? 0;

  // Budget form state
  const [formCategories, setFormCategories] = useState<BudgetCategory[]>([]);
  const [formSavingsTarget, setFormSavingsTarget] = useState(0);

  const openBudgetModal = () => {
    if (currentBudget) {
      setFormCategories(currentBudget.categories);
      setFormSavingsTarget(currentBudget.savingsTarget);
    } else {
      setFormCategories(
        expenseCategories.map((c) => ({ category: c.id, monthlyLimit: 0 }))
      );
      setFormSavingsTarget(200);
    }
    setShowModal(true);
  };

  const saveBudget = () => {
    const budget: MonthlyBudget = {
      month: selectedMonth,
      categories: formCategories.filter((c) => c.monthlyLimit > 0),
      savingsTarget: formSavingsTarget,
    };
    dispatchBudgets({ type: 'SET_BUDGET', payload: budget });
    setShowModal(false);
  };

  const updateCategoryLimit = (catId: string, limit: number) => {
    setFormCategories((prev) =>
      prev.map((c) => (c.category === catId ? { ...c, monthlyLimit: limit } : c))
    );
  };

  // Emergency fund
  const { emergencyFund } = settings;
  const avgMonthlyExpenses = useMemo(() => {
    const months: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const m = t.date.slice(0, 7);
        months[m] = (months[m] || 0) + t.amount;
      });
    const vals = Object.values(months);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 1000;
  }, [transactions]);

  const emergencyTarget = emergencyFund.targetMonths * avgMonthlyExpenses;
  const emergencyProgress = emergencyTarget > 0 ? Math.min(100, (emergencyFund.currentAmount / emergencyTarget) * 100) : 0;

  // Savings projection (next 6 months)
  const savingsProjection = useMemo(() => {
    const monthIncome = transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(selectedMonth))
      .reduce((s, t) => s + t.amount, 0);
    const avgSavings = monthIncome - totalSpent;
    const base = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    const data = [];
    let cumulative = 0;
    for (let i = 0; i < 6; i++) {
      const d = subMonths(base, -i);
      cumulative += Math.max(0, avgSavings);
      data.push({ month: format(d, 'MMM'), ahorro: Math.round(cumulative) });
    }
    return data;
  }, [selectedMonth, transactions, totalSpent]);

  // Budget vs actual chart data
  const budgetChartData = useMemo(() => {
    if (!currentBudget) return [];
    return currentBudget.categories.map((bc) => {
      const cat = expenseCategories.find((c) => c.id === bc.category);
      const spent = spentByCategory[bc.category] || 0;
      const pct = bc.monthlyLimit > 0 ? (spent / bc.monthlyLimit) * 100 : 0;
      return {
        name: cat?.name || bc.category,
        presupuesto: bc.monthlyLimit,
        gastado: spent,
        pct,
        color: cat?.color || '#6B7280',
      };
    });
  }, [currentBudget, spentByCategory, expenseCategories]);

  const overBudgetCategories = budgetChartData.filter((d) => d.pct > 80);

  // Emergency fund form
  const [efAmount, setEfAmount] = useState(emergencyFund.currentAmount);
  const [efMonths, setEfMonths] = useState(emergencyFund.targetMonths);

  const openEmergencyModal = () => {
    setEfAmount(emergencyFund.currentAmount);
    setEfMonths(emergencyFund.targetMonths);
    setShowEmergencyModal(true);
  };

  const saveEmergencyFund = () => {
    dispatchSettings({
      type: 'UPDATE_SETTINGS',
      payload: { emergencyFund: { currentAmount: efAmount, targetMonths: efMonths } },
    });
    setShowEmergencyModal(false);
  };

  // R1→R5 long-term projection
  const residencyYears: ResidencyYear[] = ['R1', 'R2', 'R3', 'R4', 'R5'];

  const longTermProjection = useMemo(() => {
    const monthlyExpenses = avgMonthlyExpenses > 0 ? avgMonthlyExpenses : 800;

    const data: { year: string; netoMensual: number; gastos: number; ahorroMensual: number; ahorroAcumulado: number }[] = [];
    let accumulated = emergencyFund.currentAmount;

    for (let i = 0; i <= 4; i++) {
      const yearKey = residencyYears[i];
      const salary = settings.salaryTables.find((s) => s.year === yearKey);
      if (!salary) continue;

      const netMonthly = estimateMonthlyNet(salary.totalMonthly);

      // Assume expenses grow 3% per year (inflation)
      const yearExpenses = monthlyExpenses * Math.pow(1.03, i);
      const monthlySavings = netMonthly - yearExpenses;

      // 12 months of savings (simplified)
      accumulated += monthlySavings * 12;

      // Extra pagas (2 per year, net estimated at ~85% of gross monthly)
      const extraPay = salary.totalMonthly * 0.85 * 2;
      accumulated += extraPay;

      data.push({
        year: yearKey,
        netoMensual: Math.round(netMonthly),
        gastos: Math.round(yearExpenses),
        ahorroMensual: Math.round(monthlySavings),
        ahorroAcumulado: Math.round(Math.max(0, accumulated)),
      });
    }

    return data;
  }, [settings.salaryTables, avgMonthlyExpenses, emergencyFund.currentAmount, residencyYears]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Presupuesto</h2>
        <Button onClick={openBudgetModal} size="sm">
          <Plus size={16} />
          {currentBudget ? 'Editar' : 'Crear'} presupuesto
        </Button>
      </div>

      {/* Budget vs Actual */}
      {currentBudget && budgetChartData.length > 0 ? (
        <Card title="Presupuesto vs Gasto real">
          <div className="space-y-3">
            {budgetChartData.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-surface-700 dark:text-surface-300">{d.name}</span>
                  <span className="text-surface-500">
                    {formatCurrency(d.gastado)} / {formatCurrency(d.presupuesto)}
                  </span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, d.pct)}%`,
                      backgroundColor: d.pct > 100 ? '#EF4444' : d.pct > 80 ? '#F59E0B' : d.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800 flex justify-between text-sm">
            <span className="text-surface-600 dark:text-surface-400">Total</span>
            <span className={`font-semibold ${totalSpent > totalBudget ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Target size={40} />}
            title="Sin presupuesto"
            description="Crea un presupuesto mensual para controlar tus gastos por categoria"
            action={<Button onClick={openBudgetModal} size="sm">Crear presupuesto</Button>}
          />
        </Card>
      )}

      {/* Alerts */}
      {overBudgetCategories.length > 0 && (
        <Card title="Alertas">
          <div className="space-y-2">
            {overBudgetCategories.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className={d.pct > 100 ? 'text-red-500' : 'text-amber-500'} />
                <span className="text-surface-700 dark:text-surface-300">
                  <strong>{d.name}</strong>: {d.pct > 100 ? 'superado' : 'al ' + Math.round(d.pct) + '%'} del limite ({formatCurrency(d.gastado)} / {formatCurrency(d.presupuesto)})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Savings Projection */}
        <Card title="Proyeccion de ahorro (6 meses)">
          {savingsProjection.some((d) => d.ahorro > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={savingsProjection}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v}€`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="ahorro" radius={[4, 4, 0, 0]}>
                  {savingsProjection.map((_, i) => (
                    <Cell key={i} fill="#3B82F6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-surface-500 text-center py-8">Anade ingresos y gastos para ver la proyeccion</p>
          )}
        </Card>

        {/* Emergency Fund */}
        <Card
          title="Fondo de emergencia"
          action={<Button variant="ghost" size="sm" onClick={openEmergencyModal}>Editar</Button>}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <PiggyBank size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-surface-800 dark:text-surface-200">
                  {formatCurrency(emergencyFund.currentAmount)}
                </p>
                <p className="text-xs text-surface-500">
                  Objetivo: {formatCurrency(emergencyTarget)} ({emergencyFund.targetMonths} meses de gastos)
                </p>
              </div>
            </div>
            <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${emergencyProgress}%` }}
              />
            </div>
            <p className="text-xs text-surface-500 text-right">{emergencyProgress.toFixed(0)}% completado</p>
          </div>
        </Card>
      </div>

      {/* R1→R5 Long-term projection */}
      <Card title="Proyeccion R1 → R5">
        <div className="space-y-4">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Estimacion basada en tu gasto medio actual ({formatCurrency(avgMonthlyExpenses)}/mes), salarios BOCAM y 2 pagas extras/ano. Inflacion estimada: 3%/ano.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={longTermProjection}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '0.5rem', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem' }} />
                <Area
                  type="monotone"
                  dataKey="ahorroAcumulado"
                  name="Ahorro acumulado"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Table breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-surface-500 border-b border-surface-100 dark:border-surface-800">
                  <th className="py-1.5 pr-3">Ano</th>
                  <th className="py-1.5 pr-3">Neto/mes</th>
                  <th className="py-1.5 pr-3">Gastos/mes</th>
                  <th className="py-1.5 pr-3">Ahorro/mes</th>
                  <th className="py-1.5">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {longTermProjection.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-surface-50 dark:border-surface-800/50 ${
                      row.year === settings.currentResidencyYear ? 'bg-primary-50/50 dark:bg-primary-900/10 font-medium' : ''
                    }`}
                  >
                    <td className="py-1.5 pr-3 font-medium">{row.year}</td>
                    <td className="py-1.5 pr-3 text-green-600 dark:text-green-400">{formatCurrency(row.netoMensual)}</td>
                    <td className="py-1.5 pr-3 text-red-500">{formatCurrency(row.gastos)}</td>
                    <td className="py-1.5 pr-3 text-blue-600 dark:text-blue-400">{formatCurrency(row.ahorroMensual)}</td>
                    <td className="py-1.5 font-semibold text-blue-700 dark:text-blue-300">{formatCurrency(row.ahorroAcumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-surface-400 italic">
            Al terminar R5 tendras aprox. {formatCurrency(longTermProjection[longTermProjection.length - 1]?.ahorroAcumulado ?? 0)} ahorrados (sin contar guardias ni inversiones).
          </p>
        </div>
      </Card>

      {/* Budget Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Presupuesto mensual">
        <div className="space-y-4">
          <Input
            label="Objetivo de ahorro mensual"
            type="number"
            min={0}
            step={10}
            value={formSavingsTarget}
            onChange={(e) => setFormSavingsTarget(Number(e.target.value))}
          />
          <p className="text-xs font-medium text-surface-600 dark:text-surface-400">Limites por categoria</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {formCategories.map((fc) => {
              const cat = expenseCategories.find((c) => c.id === fc.category);
              return (
                <div key={fc.category} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color }} />
                  <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 min-w-0 truncate">
                    {cat?.name || fc.category}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={fc.monthlyLimit || ''}
                    onChange={(e) => updateCategoryLimit(fc.category, Number(e.target.value))}
                    placeholder="0"
                    className="w-24 px-2 py-1 text-sm text-right rounded border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200"
                  />
                </div>
              );
            })}
          </div>
          <Button onClick={saveBudget} className="w-full">Guardar presupuesto</Button>
        </div>
      </Modal>

      {/* Emergency Fund Modal */}
      <Modal open={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} title="Fondo de emergencia">
        <div className="space-y-4">
          <Input
            label="Cantidad ahorrada actualmente"
            type="number"
            min={0}
            step={50}
            value={efAmount}
            onChange={(e) => setEfAmount(Number(e.target.value))}
          />
          <Input
            label="Meses objetivo"
            type="number"
            min={1}
            max={24}
            value={efMonths}
            onChange={(e) => setEfMonths(Number(e.target.value))}
          />
          <p className="text-xs text-surface-500">
            Gasto medio mensual estimado: {formatCurrency(avgMonthlyExpenses)}
          </p>
          <Button onClick={saveEmergencyFund} className="w-full">Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}
