import { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  PieChart as PieChartIcon,
  Calculator,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatPercent, currentDate } from '../../utils';
import type { InvestmentFund, InvestmentEntry } from '../../types';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';

/* ------------------------------------------------------------------ */
/*  Colour palette for pie chart                                       */
/* ------------------------------------------------------------------ */

const COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#64748b', // slate
];

/* ------------------------------------------------------------------ */
/*  Form states                                                        */
/* ------------------------------------------------------------------ */

interface FundFormState {
  fundName: string;
  isin: string;
  platform: string;
}

const emptyFundForm: FundFormState = { fundName: '', isin: '', platform: '' };

interface EntryFormState {
  fundId: string;
  type: 'buy' | 'sell' | 'valuation';
  date: string;
  shares: string;
  investedAmount: string;
  currentValue: string;
}

const emptyEntryForm: EntryFormState = {
  fundId: '',
  type: 'buy',
  date: currentDate(),
  shares: '',
  investedAmount: '',
  currentValue: '',
};

/* ------------------------------------------------------------------ */
/*  Helper: latest entry per fund                                      */
/* ------------------------------------------------------------------ */

function getLatestEntryPerFund(
  funds: InvestmentFund[],
  entries: InvestmentEntry[],
): Map<string, InvestmentEntry> {
  const map = new Map<string, InvestmentEntry>();
  for (const fund of funds) {
    const fundEntries = entries.filter((e) => e.fundId === fund.id);
    if (fundEntries.length === 0) continue;
    const latest = fundEntries.reduce((a, b) => (a.date >= b.date ? a : b));
    map.set(fund.id, latest);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InvestmentsPage() {
  const {
    investmentFunds,
    dispatchInvestmentFunds,
    investmentEntries,
    dispatchInvestmentEntries,
    settings,
  } = useAppContext();

  // Modal state - funds
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [fundForm, setFundForm] = useState<FundFormState>(emptyFundForm);

  // Modal state - entries
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryForm, setEntryForm] = useState<EntryFormState>(emptyEntryForm);

  // Rebalancing input
  const [rebalAmount, setRebalAmount] = useState('');

  /* ---- Derived data ---- */

  const latestByFund = useMemo(
    () => getLatestEntryPerFund(investmentFunds, investmentEntries),
    [investmentFunds, investmentEntries],
  );

  const totalInvested = useMemo(
    () => Array.from(latestByFund.values()).reduce((s, e) => s + e.investedAmount, 0),
    [latestByFund],
  );

  const totalCurrentValue = useMemo(
    () => Array.from(latestByFund.values()).reduce((s, e) => s + e.currentValue, 0),
    [latestByFund],
  );

  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  /* ---- Allocation data for pie chart ---- */

  const allocationData = useMemo(() => {
    if (totalCurrentValue === 0) return [];
    return investmentFunds
      .map((f, idx) => {
        const latest = latestByFund.get(f.id);
        const value = latest?.currentValue ?? 0;
        return {
          name: f.fundName,
          value,
          pct: (value / totalCurrentValue) * 100,
          color: COLORS[idx % COLORS.length],
        };
      })
      .filter((d) => d.value > 0);
  }, [investmentFunds, latestByFund, totalCurrentValue]);

  const targetData = useMemo(() => {
    const targets = settings.investmentTargets;
    if (targets.length === 0 || totalCurrentValue === 0) return [];
    return targets.map((t, idx) => {
      const fund = investmentFunds.find((f) => f.id === t.fundId);
      return {
        name: fund?.fundName ?? t.label,
        value: t.targetPercentage,
        color: COLORS[idx % COLORS.length],
      };
    });
  }, [settings.investmentTargets, investmentFunds, totalCurrentValue]);

  /* ---- Rebalancing ---- */

  const rebalSuggestions = useMemo(() => {
    const amount = parseFloat(rebalAmount);
    if (isNaN(amount) || amount <= 0 || totalCurrentValue === 0) return [];
    const targets = settings.investmentTargets;
    if (targets.length === 0) return [];

    const newTotal = totalCurrentValue + amount;

    return targets.map((t, idx) => {
      const fund = investmentFunds.find((f) => f.id === t.fundId);
      const latest = t.fundId ? latestByFund.get(t.fundId) : undefined;
      const currentVal = latest?.currentValue ?? 0;
      const actualPct = (currentVal / totalCurrentValue) * 100;
      const idealValue = (t.targetPercentage / 100) * newTotal;
      const toInvest = Math.max(0, idealValue - currentVal);

      return {
        name: fund?.fundName ?? t.label,
        actualPct,
        targetPct: t.targetPercentage,
        toInvest,
        color: COLORS[idx % COLORS.length],
      };
    });
  }, [rebalAmount, totalCurrentValue, settings.investmentTargets, investmentFunds, latestByFund]);

  /* ---- Fund modal helpers ---- */

  function openNewFundModal() {
    setFundForm(emptyFundForm);
    setEditingFundId(null);
    setFundModalOpen(true);
  }

  function openEditFundModal(fund: InvestmentFund) {
    setFundForm({
      fundName: fund.fundName,
      isin: fund.isin,
      platform: fund.platform,
    });
    setEditingFundId(fund.id);
    setFundModalOpen(true);
  }

  function saveFund() {
    if (!fundForm.fundName.trim()) return;
    const payload: InvestmentFund = {
      id: editingFundId ?? nanoid(),
      fundName: fundForm.fundName.trim(),
      isin: fundForm.isin.trim(),
      platform: fundForm.platform.trim(),
    };
    if (editingFundId) {
      dispatchInvestmentFunds({ type: 'EDIT_FUND', payload });
    } else {
      dispatchInvestmentFunds({ type: 'ADD_FUND', payload });
    }
    setFundModalOpen(false);
    setEditingFundId(null);
  }

  function deleteFund(id: string) {
    dispatchInvestmentFunds({ type: 'DELETE_FUND', payload: id });
  }

  /* ---- Entry modal helpers ---- */

  function openNewEntryModal(prefillFundId?: string) {
    setEntryForm({
      ...emptyEntryForm,
      date: currentDate(),
      fundId: prefillFundId ?? investmentFunds[0]?.id ?? '',
    });
    setEditingEntryId(null);
    setEntryModalOpen(true);
  }

  function saveEntry() {
    const shares = parseFloat(entryForm.shares);
    const invested = parseFloat(entryForm.investedAmount);
    const current = parseFloat(entryForm.currentValue);
    if (!entryForm.fundId || !entryForm.date) return;
    if (isNaN(shares) || isNaN(invested) || isNaN(current)) return;

    const payload: InvestmentEntry = {
      id: editingEntryId ?? nanoid(),
      fundId: entryForm.fundId,
      type: entryForm.type,
      date: entryForm.date,
      shares,
      investedAmount: invested,
      currentValue: current,
      createdAt: editingEntryId
        ? investmentEntries.find((e) => e.id === editingEntryId)!.createdAt
        : new Date().toISOString(),
    };

    if (editingEntryId) {
      dispatchInvestmentEntries({ type: 'EDIT_ENTRY', payload });
    } else {
      dispatchInvestmentEntries({ type: 'ADD_ENTRY', payload });
    }
    setEntryModalOpen(false);
    setEditingEntryId(null);
  }

  /* ---- Form updaters ---- */

  function setFundField<K extends keyof FundFormState>(key: K, val: FundFormState[K]) {
    setFundForm((prev) => ({ ...prev, [key]: val }));
  }

  function setEntryField<K extends keyof EntryFormState>(key: K, val: EntryFormState[K]) {
    setEntryForm((prev) => ({ ...prev, [key]: val }));
  }

  /* ---------------------------------------------------------------- */
  /*  Render: empty state                                              */
  /* ---------------------------------------------------------------- */

  if (investmentFunds.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Landmark size={48} />}
          title="Sin fondos de inversion"
          description="Agrega tu primer fondo para comenzar a registrar operaciones y visualizar tu cartera."
          action={
            <Button onClick={openNewFundModal}>
              <Plus size={16} /> Nuevo fondo
            </Button>
          }
        />

        {/* Fund modal (accessible even in empty state) */}
        <FundModal
          open={fundModalOpen}
          onClose={() => setFundModalOpen(false)}
          editing={!!editingFundId}
          form={fundForm}
          setField={setFundField}
          onSave={saveFund}
        />
      </>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: main page                                                */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Portfolio summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Landmark size={20} />}
          label="Total invertido"
          value={formatCurrency(totalInvested)}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard
          icon={<PieChartIcon size={20} />}
          label="Valor actual"
          value={formatCurrency(totalCurrentValue)}
          colorClass="text-indigo-600 dark:text-indigo-400"
          bgClass="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <KpiCard
          icon={totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          label="PnL absoluto"
          value={formatCurrency(totalPnl)}
          colorClass={totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          bgClass={totalPnl >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}
        />
        <KpiCard
          icon={totalPnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          label="PnL porcentual"
          value={formatPercent(totalPnlPct)}
          colorClass={totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          bgClass={totalPnl >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}
        />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" onClick={openNewFundModal}>
          <Plus size={16} /> Nuevo fondo
        </Button>
        <Button onClick={() => openNewEntryModal()}>
          <Plus size={16} /> Nueva operacion
        </Button>
      </div>

      {/* Fund cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {investmentFunds.map((fund, idx) => {
          const latest = latestByFund.get(fund.id);
          const invested = latest?.investedAmount ?? 0;
          const currentVal = latest?.currentValue ?? 0;
          const pnl = currentVal - invested;
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
          const portfolioPct = totalCurrentValue > 0 ? (currentVal / totalCurrentValue) * 100 : 0;
          const color = COLORS[idx % COLORS.length];

          return (
            <Card key={fund.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                    {fund.fundName}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {fund.isin} &middot; {fund.platform}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openNewEntryModal(fund.id)} title="Nueva operacion">
                    <Plus size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditFundModal(fund)} title="Editar fondo">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deleteFund(fund.id)} title="Eliminar fondo">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {latest ? (
                <>
                  <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                    <div>
                      <p className="text-surface-500 dark:text-surface-400">Participaciones</p>
                      <p className="font-medium text-surface-800 dark:text-surface-200">{latest.shares.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500 dark:text-surface-400">Invertido</p>
                      <p className="font-medium text-surface-800 dark:text-surface-200">{formatCurrency(invested)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500 dark:text-surface-400">Valor actual</p>
                      <p className="font-medium text-surface-800 dark:text-surface-200">{formatCurrency(currentVal)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500 dark:text-surface-400">PnL</p>
                      <p className={`font-medium ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                      </p>
                    </div>
                  </div>

                  {/* Portfolio bar */}
                  <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${portfolioPct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-1">
                    {portfolioPct.toFixed(1)}% de la cartera
                  </p>
                </>
              ) : (
                <p className="text-xs text-surface-400 dark:text-surface-500 py-4 text-center">
                  Sin operaciones registradas
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Allocation chart */}
      {allocationData.length > 0 && (
        <Card title="Distribucion de cartera">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Inner ring: target */}
                {targetData.length > 0 && (
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {targetData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} opacity={0.4} />
                    ))}
                  </Pie>
                )}

                {/* Outer ring: actual */}
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {allocationData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => {
                    const v = Number(value);
                    return [formatCurrency(v), String(name)];
                  }}
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-surface-500 dark:text-surface-400 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-indigo-500 opacity-40" />
              Objetivo (anillo interior)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
              Actual (anillo exterior)
            </div>
          </div>
        </Card>
      )}

      {/* Rebalancing suggestion */}
      {settings.investmentTargets.length > 0 && totalCurrentValue > 0 && (
        <Card
          title="Sugerencia de rebalanceo"
          action={<Calculator size={16} className="text-surface-400" />}
        >
          <div className="mb-4 max-w-xs">
            <Input
              label="Cantidad a invertir"
              type="number"
              min="0"
              step="100"
              placeholder="0.00"
              value={rebalAmount}
              onChange={(e) => setRebalAmount(e.target.value)}
            />
          </div>

          {rebalSuggestions.length > 0 && (
            <div className="overflow-x-auto -mx-4 lg:-mx-5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="text-left px-4 lg:px-5 py-2 font-medium text-surface-500 dark:text-surface-400">
                      Fondo
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-surface-500 dark:text-surface-400">
                      Actual %
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-surface-500 dark:text-surface-400">
                      Objetivo %
                    </th>
                    <th className="text-right px-4 lg:px-5 py-2 font-medium text-surface-500 dark:text-surface-400">
                      Aportar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {rebalSuggestions.map((row) => (
                    <tr key={row.name}>
                      <td className="px-4 lg:px-5 py-2 text-surface-800 dark:text-surface-200 font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.name}
                        </div>
                      </td>
                      <td className="text-right px-3 py-2 text-surface-600 dark:text-surface-400">
                        {row.actualPct.toFixed(1)}%
                      </td>
                      <td className="text-right px-3 py-2 text-surface-600 dark:text-surface-400">
                        {row.targetPct.toFixed(1)}%
                      </td>
                      <td className="text-right px-4 lg:px-5 py-2 font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(row.toInvest)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rebalSuggestions.length === 0 && (
            <p className="text-xs text-surface-400 dark:text-surface-500 text-center py-2">
              Introduce una cantidad para ver la sugerencia de distribucion.
            </p>
          )}
        </Card>
      )}

      {/* Fund modal */}
      <FundModal
        open={fundModalOpen}
        onClose={() => { setFundModalOpen(false); setEditingFundId(null); }}
        editing={!!editingFundId}
        form={fundForm}
        setField={setFundField}
        onSave={saveFund}
      />

      {/* Entry modal */}
      <Modal
        open={entryModalOpen}
        onClose={() => { setEntryModalOpen(false); setEditingEntryId(null); }}
        title={editingEntryId ? 'Editar operacion' : 'Nueva operacion'}
      >
        <div className="space-y-4">
          <Select
            label="Fondo"
            value={entryForm.fundId}
            onChange={(e) => setEntryField('fundId', e.target.value)}
            options={investmentFunds.map((f) => ({ value: f.id, label: f.fundName }))}
          />

          <Select
            label="Tipo"
            value={entryForm.type}
            onChange={(e) => setEntryField('type', e.target.value as 'buy' | 'sell' | 'valuation')}
            options={[
              { value: 'buy', label: 'Compra' },
              { value: 'sell', label: 'Venta' },
              { value: 'valuation', label: 'Valoracion' },
            ]}
          />

          <Input
            label="Fecha"
            type="date"
            value={entryForm.date}
            onChange={(e) => setEntryField('date', e.target.value)}
          />

          <Input
            label="Participaciones"
            type="number"
            step="0.0001"
            min="0"
            value={entryForm.shares}
            onChange={(e) => setEntryField('shares', e.target.value)}
            placeholder="0.0000"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Importe invertido"
              type="number"
              step="0.01"
              min="0"
              value={entryForm.investedAmount}
              onChange={(e) => setEntryField('investedAmount', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Valor actual"
              type="number"
              step="0.01"
              min="0"
              value={entryForm.currentValue}
              onChange={(e) => setEntryField('currentValue', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setEntryModalOpen(false); setEditingEntryId(null); }}>
              Cancelar
            </Button>
            <Button onClick={saveEntry}>
              {editingEntryId ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fund Modal sub-component                                           */
/* ------------------------------------------------------------------ */

interface FundModalProps {
  open: boolean;
  onClose: () => void;
  editing: boolean;
  form: FundFormState;
  setField: <K extends keyof FundFormState>(key: K, val: FundFormState[K]) => void;
  onSave: () => void;
}

function FundModal({ open, onClose, editing, form, setField, onSave }: FundModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar fondo' : 'Nuevo fondo'}>
      <div className="space-y-4">
        <Input
          label="Nombre del fondo"
          value={form.fundName}
          onChange={(e) => setField('fundName', e.target.value)}
          placeholder="Ej: Vanguard Global Stock Index"
        />
        <Input
          label="ISIN"
          value={form.isin}
          onChange={(e) => setField('isin', e.target.value)}
          placeholder="Ej: IE00B03HCZ61"
        />
        <Input
          label="Plataforma"
          value={form.platform}
          onChange={(e) => setField('platform', e.target.value)}
          placeholder="Ej: MyInvestor"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            {editing ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI card helper                                                    */
/* ------------------------------------------------------------------ */

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
