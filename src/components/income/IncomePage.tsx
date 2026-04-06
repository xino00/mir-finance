import { useState, useMemo, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { subMonths, parse, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Banknote,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  TrendingUp,
  FileText,
  Check,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import {
  formatCurrency,
  formatDate,
  currentDate,
  calculateGuardGross,
  detectDayType,
  estimatePayslipNet,
  estimateExtraPayNet,
} from '../../utils';
import type {
  GuardShift,
  ResidencyYear,
  ShiftDuration,
  DayType,
  ShiftModality,
  Transaction,
} from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';

type Tab = 'nomina' | 'guardias' | 'calendario';

/* ---------- helper to get duration options based on dayType ---------- */
function durationOptionsForDayType(dayType: DayType): { value: string; label: string }[] {
  if (dayType === 'laborable') {
    return [
      { value: '12h', label: '12 horas' },
      { value: '17h', label: '17 horas' },
    ];
  }
  return [{ value: '24h', label: '24 horas' }];
}

/* ---------- badge variant helpers ---------- */
function dayTypeBadgeVariant(dt: DayType): 'success' | 'warning' | 'danger' {
  if (dt === 'laborable') return 'success';
  if (dt === 'festivo') return 'warning';
  return 'danger';
}

function dayTypeLabel(dt: DayType): string {
  if (dt === 'laborable') return 'Laborable';
  if (dt === 'festivo') return 'Festivo';
  return 'Especial';
}

function modalityLabel(m: ShiftModality): string {
  return m === 'presencia_fisica' ? 'Presencia fisica' : 'Localizada';
}

/* ====================================================================== */
/*  IncomePage                                                             */
/* ====================================================================== */

export default function IncomePage() {
  const {
    guardShifts,
    dispatchGuardShifts,
    transactions,
    dispatchTransactions,
    monthlyPayslips,
    dispatchPayslips,
    settings,
  } = useAppContext();
  const { selectedMonth } = useSelectedMonth();

  const [activeTab, setActiveTab] = useState<Tab>('nomina');

  /* ---------- Guard shift modal state ---------- */
  const [guardModalOpen, setGuardModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<GuardShift | null>(null);

  const [gDate, setGDate] = useState(currentDate());
  const [gDayType, setGDayType] = useState<DayType>(() => detectDayType(currentDate()));
  const [gDuration, setGDuration] = useState<ShiftDuration>('24h');
  const [gModality, setGModality] = useState<ShiftModality>('presencia_fisica');
  const [gYear, setGYear] = useState<ResidencyYear>(settings.currentResidencyYear);
  const [gNotes, setGNotes] = useState('');

  /* ---------- Income transaction modal state ---------- */
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [txDate, setTxDate] = useState(currentDate());
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');

  /* ---------- derived data ---------- */
  const salaryEntry = useMemo(
    () => settings.salaryTables.find((s) => s.year === settings.currentResidencyYear),
    [settings],
  );

  const monthShifts = useMemo(
    () =>
      guardShifts
        .filter((s) => s.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [guardShifts, selectedMonth],
  );

  const monthShiftGross = useMemo(
    () => monthShifts.reduce((sum, s) => sum + s.grossAmount, 0),
    [monthShifts],
  );

  const incomeTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, selectedMonth],
  );

  const incomeCategories = useMemo(
    () => settings.categories.filter((c) => c.type === 'income'),
    [settings.categories],
  );

  /* ---------- Payslip / net salary computation ---------- */
  // Guards are paid month+1: April payslip includes March guards
  const previousMonthKey = useMemo(() => {
    const base = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    return format(subMonths(base, 1), 'yyyy-MM');
  }, [selectedMonth]);

  const previousMonthLabel = useMemo(() => {
    const base = parse(previousMonthKey + '-01', 'yyyy-MM-dd', new Date());
    return format(base, 'MMMM yyyy', { locale: es });
  }, [previousMonthKey]);

  const previousMonthGuardsGross = useMemo(
    () =>
      guardShifts
        .filter((s) => s.date.startsWith(previousMonthKey))
        .reduce((sum, s) => sum + s.grossAmount, 0),
    [guardShifts, previousMonthKey],
  );

  const grossSalary = salaryEntry?.totalMonthly ?? 0;

  // Paga extra: June and December get an extra monthly salary
  const selectedMonthNum = parseInt(selectedMonth.split('-')[1], 10);
  const isExtraPayMonth = selectedMonthNum === 6 || selectedMonthNum === 12;
  const extraPayGross = isExtraPayMonth ? grossSalary : 0;

  const estimatedNet = useMemo(
    () =>
      estimatePayslipNet(grossSalary, previousMonthGuardsGross) +
      (isExtraPayMonth ? estimateExtraPayNet(grossSalary) : 0),
    [grossSalary, isExtraPayMonth, previousMonthGuardsGross],
  );

  // Existing payslip record for this month (if any)
  const existingPayslip = useMemo(
    () => monthlyPayslips.find((p) => p.month === selectedMonth),
    [monthlyPayslips, selectedMonth],
  );

  const [editingActualNet, setEditingActualNet] = useState(false);
  const [actualNetInput, setActualNetInput] = useState('');

  // Reset editing state when month changes
  useEffect(() => {
    setEditingActualNet(false);
  }, [selectedMonth]);

  function handleSaveActualNet() {
    const value = parseFloat(actualNetInput);
    if (!value || value <= 0) return;
    dispatchPayslips({
      type: 'SET_PAYSLIP',
      payload: {
        month: selectedMonth,
        grossSalary,
        grossGuards: previousMonthGuardsGross,
        estimatedNet,
        actualNet: value,
      },
    });
    setEditingActualNet(false);
  }

  function handleClearActualNet() {
    dispatchPayslips({
      type: 'SET_PAYSLIP',
      payload: {
        month: selectedMonth,
        grossSalary,
        grossGuards: previousMonthGuardsGross,
        estimatedNet,
        actualNet: undefined,
      },
    });
  }

  /* ---------- Next-month payslip prediction ---------- */
  // Guards worked this month will be paid on next month's payslip
  const nextMonthKey = useMemo(() => {
    const base = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    return format(next, 'yyyy-MM');
  }, [selectedMonth]);

  const nextMonthLabel = useMemo(() => {
    const base = parse(nextMonthKey + '-01', 'yyyy-MM-dd', new Date());
    return format(base, 'MMMM yyyy', { locale: es });
  }, [nextMonthKey]);

  const nextMonthNum = parseInt(nextMonthKey.split('-')[1], 10);
  const nextMonthIsExtra = nextMonthNum === 6 || nextMonthNum === 12;

  const predictedNet = useMemo(() => {
    if (!grossSalary) return 0;
    return (
      estimatePayslipNet(grossSalary, monthShiftGross) +
      (nextMonthIsExtra ? estimateExtraPayNet(grossSalary) : 0)
    );
  }, [grossSalary, monthShiftGross, nextMonthIsExtra]);

  // Auto-save estimated payslip data when month/values change
  useEffect(() => {
    if (grossSalary > 0) {
      dispatchPayslips({
        type: 'SET_PAYSLIP',
        payload: {
          month: selectedMonth,
          grossSalary,
          grossGuards: previousMonthGuardsGross,
          estimatedNet,
          actualNet: existingPayslip?.actualNet,
        },
      });
    }
  }, [selectedMonth, grossSalary, previousMonthGuardsGross, estimatedNet]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- calculated guard gross (live preview) ---------- */
  const liveGross = useMemo(
    () => calculateGuardGross(gDuration, gDayType, gYear, gModality),
    [gDuration, gDayType, gYear, gModality],
  );

  /* ---------- auto-detect dayType on date change ---------- */
  useEffect(() => {
    const detected = detectDayType(gDate);
    setGDayType(detected);
    // also fix duration if it becomes incompatible
    const opts = durationOptionsForDayType(detected);
    if (!opts.find((o) => o.value === gDuration)) {
      setGDuration(opts[0].value as ShiftDuration);
    }
  }, [gDate]); // eslint-disable-line react-hooks/exhaustive-deps

  /* keep duration compatible when dayType is manually changed */
  useEffect(() => {
    const opts = durationOptionsForDayType(gDayType);
    if (!opts.find((o) => o.value === gDuration)) {
      setGDuration(opts[0].value as ShiftDuration);
    }
  }, [gDayType]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Guard modal open/reset helpers ---------- */
  function openNewGuardModal() {
    setEditingShift(null);
    setGDate(currentDate());
    setGDayType(detectDayType(currentDate()));
    setGDuration(detectDayType(currentDate()) === 'laborable' ? '12h' : '24h');
    setGModality('presencia_fisica');
    setGYear(settings.currentResidencyYear);
    setGNotes('');
    setGuardModalOpen(true);
  }

  function openEditGuardModal(shift: GuardShift) {
    setEditingShift(shift);
    setGDate(shift.date);
    setGDayType(shift.dayType);
    setGDuration(shift.duration);
    setGModality(shift.modality);
    setGYear(shift.residencyYear);
    setGNotes(shift.notes ?? '');
    setGuardModalOpen(true);
  }

  function handleGuardSave() {
    const gross = calculateGuardGross(gDuration, gDayType, gYear, gModality);
    const shift: GuardShift = {
      id: editingShift?.id ?? nanoid(),
      date: gDate,
      duration: gDuration,
      dayType: gDayType,
      modality: gModality,
      residencyYear: gYear,
      grossAmount: gross,
      notes: gNotes || undefined,
      createdAt: editingShift?.createdAt ?? new Date().toISOString(),
    };
    if (editingShift) {
      dispatchGuardShifts({ type: 'EDIT_GUARD_SHIFT', payload: shift });
    } else {
      dispatchGuardShifts({ type: 'ADD_GUARD_SHIFT', payload: shift });
    }
    setGuardModalOpen(false);
  }

  function handleDeleteShift(id: string) {
    dispatchGuardShifts({ type: 'DELETE_GUARD_SHIFT', payload: id });
  }

  /* ---------- Income transaction modal helpers ---------- */
  function openNewIncomeModal() {
    setEditingTx(null);
    setTxDate(currentDate());
    setTxAmount('');
    setTxCategory(incomeCategories[0]?.id ?? '');
    setTxDescription('');
    setIncomeModalOpen(true);
  }

  function openEditIncomeModal(tx: Transaction) {
    setEditingTx(tx);
    setTxDate(tx.date);
    setTxAmount(String(tx.amount));
    setTxCategory(tx.category);
    setTxDescription(tx.description);
    setIncomeModalOpen(true);
  }

  function handleIncomeSave() {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) return;

    const tx: Transaction = {
      id: editingTx?.id ?? nanoid(),
      date: txDate,
      amount,
      type: 'income',
      category: txCategory,
      description: txDescription,
      isRecurring: false,
      createdAt: editingTx?.createdAt ?? new Date().toISOString(),
    };
    if (editingTx) {
      dispatchTransactions({ type: 'EDIT_TRANSACTION', payload: tx });
    } else {
      dispatchTransactions({ type: 'ADD_TRANSACTION', payload: tx });
    }
    setIncomeModalOpen(false);
  }

  function handleDeleteTransaction(id: string) {
    dispatchTransactions({ type: 'DELETE_TRANSACTION', payload: id });
  }

  /* ---------- category name lookup ---------- */
  function categoryName(catId: string): string {
    return settings.categories.find((c) => c.id === catId)?.name ?? catId;
  }

  /* ====================================================================== */
  /*  RENDER                                                                 */
  /* ====================================================================== */

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 p-1">
        <button
          onClick={() => setActiveTab('nomina')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'nomina'
              ? 'bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          Nomina y otros
        </button>
        <button
          onClick={() => setActiveTab('guardias')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'guardias'
              ? 'bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          Guardias
        </button>
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'calendario'
              ? 'bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          Calendario
        </button>
      </div>

      {/* ============================================================== */}
      {/*  TAB: Nomina y otros                                            */}
      {/* ============================================================== */}
      {activeTab === 'nomina' && (
        <>
          {/* Net salary card */}
          {salaryEntry && (
            <Card
              title={`Nomina estimada — ${settings.currentResidencyYear}`}
              action={
                <div className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                  <FileText size={12} />
                  BOCAM 2026
                </div>
              }
            >
              <div className="space-y-4">
                {/* Gross breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Bruto salario</p>
                    <p className="text-lg font-bold text-surface-800 dark:text-surface-100">
                      {formatCurrency(grossSalary)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      Base {formatCurrency(salaryEntry.baseSalary)} + Compl.{' '}
                      {formatCurrency(salaryEntry.gradeComplement)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Bruto guardias</p>
                    <p className="text-lg font-bold text-surface-800 dark:text-surface-100">
                      {formatCurrency(previousMonthGuardsGross)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      Cobradas de {previousMonthLabel}
                    </p>
                  </div>
                </div>

                {/* Extra pay indicator */}
                {isExtraPayMonth && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2.5 flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-lg">*</span>
                    <div>
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        Paga extra ({selectedMonthNum === 6 ? 'junio' : 'diciembre'})
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        +{formatCurrency(extraPayGross)} brutos incluidos en el calculo
                      </p>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-surface-100 dark:border-surface-800" />

                {/* Net section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">Neto estimado</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(estimatedNet)}
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      IRPF + SS aprox.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      Neto real (nomina)
                    </p>
                    {existingPayslip?.actualNet && !editingActualNet ? (
                      <div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(existingPayslip.actualNet)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            onClick={() => {
                              setActualNetInput(String(existingPayslip.actualNet));
                              setEditingActualNet(true);
                            }}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={handleClearActualNet}
                            className="text-xs text-surface-400 hover:text-red-500"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                    ) : editingActualNet ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={actualNetInput}
                          onChange={(e) => setActualNetInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveActualNet()}
                          className="w-28 rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-2 py-1 text-sm font-semibold text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveActualNet}
                          className="p-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingActualNet(false)}
                          className="text-xs text-surface-400 hover:text-surface-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-surface-300 dark:text-surface-600">—</p>
                        <button
                          onClick={() => {
                            setActualNetInput('');
                            setEditingActualNet(true);
                          }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-0.5"
                        >
                          Introducir neto real
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Difference indicator when actual net exists */}
                {existingPayslip?.actualNet && !editingActualNet && (
                  <div className="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-2.5 text-xs text-surface-600 dark:text-surface-400">
                    Diferencia con estimacion:{' '}
                    <span
                      className={
                        existingPayslip.actualNet >= estimatedNet
                          ? 'font-semibold text-green-600 dark:text-green-400'
                          : 'font-semibold text-red-600 dark:text-red-400'
                      }
                    >
                      {existingPayslip.actualNet >= estimatedNet ? '+' : ''}
                      {formatCurrency(existingPayslip.actualNet - estimatedNet)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Next-month payslip prediction */}
          {salaryEntry && (
            <Card
              title={`Prediccion nomina — ${nextMonthLabel}`}
              action={
                <div className="flex items-center gap-1 text-xs text-primary-500 dark:text-primary-400">
                  <Sparkles size={12} />
                  Basado en guardias de este mes
                </div>
              }
            >
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-surface-50 dark:bg-surface-800/60 p-2.5">
                    <p className="text-xs text-surface-500 dark:text-surface-400">Salario base</p>
                    <p className="text-sm font-bold text-surface-800 dark:text-surface-100 mt-0.5">
                      {formatCurrency(grossSalary)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface-50 dark:bg-surface-800/60 p-2.5">
                    <p className="text-xs text-surface-500 dark:text-surface-400">Guardias ({monthShifts.length})</p>
                    <p className="text-sm font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                      {formatCurrency(monthShiftGross)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-2.5">
                    <p className="text-xs text-primary-600 dark:text-primary-400">Neto estimado</p>
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300 mt-0.5">
                      {formatCurrency(predictedNet)}
                    </p>
                  </div>
                </div>
                {nextMonthIsExtra && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5">
                    {nextMonthNum === 6 ? 'Junio' : 'Diciembre'}: incluye paga extra estimada
                  </p>
                )}
                {monthShifts.length === 0 && (
                  <p className="text-xs text-surface-400 dark:text-surface-500 text-center">
                    Sin guardias registradas este mes — la prediccion es solo del salario base.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Income transactions list */}
          <Card
            title="Ingresos del mes"
            action={
              <Button size="sm" onClick={openNewIncomeModal}>
                <Plus size={14} /> Nuevo ingreso
              </Button>
            }
          >
            {incomeTransactions.length === 0 ? (
              <EmptyState
                icon={<Banknote size={32} />}
                title="Sin ingresos registrados"
                description="Anade ingresos manuales como extras, devoluciones u otros cobros."
                action={
                  <Button size="sm" onClick={openNewIncomeModal}>
                    <Plus size={14} /> Nuevo ingreso
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {incomeTransactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                        {tx.description || categoryName(tx.category)}
                      </p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {formatDate(tx.date)} &middot; {categoryName(tx.category)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      +{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditIncomeModal(tx)}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* ============================================================== */}
      {/*  TAB: Guardias                                                   */}
      {/* ============================================================== */}
      {activeTab === 'guardias' && (
        <>
          {/* Summary card */}
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Guardias este mes</p>
                  <p className="text-lg font-bold text-surface-800 dark:text-surface-100">
                    {monthShifts.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Bruto total</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(monthShiftGross)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Guard shifts list */}
          <Card
            title="Guardias del mes"
            action={
              <Button size="sm" onClick={openNewGuardModal}>
                <Plus size={14} /> Nueva guardia
              </Button>
            }
          >
            {monthShifts.length === 0 ? (
              <EmptyState
                icon={<Clock size={32} />}
                title="Sin guardias registradas"
                description="Registra tus guardias para llevar el control de ingresos extra."
                action={
                  <Button size="sm" onClick={openNewGuardModal}>
                    <Plus size={14} /> Nueva guardia
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {monthShifts.map((shift) => (
                  <li key={shift.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                          {formatDate(shift.date)}
                        </p>
                        <Badge variant="neutral">{shift.duration}</Badge>
                        <Badge variant={dayTypeBadgeVariant(shift.dayType)}>
                          {dayTypeLabel(shift.dayType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                        {modalityLabel(shift.modality)}
                        {shift.notes ? ` — ${shift.notes}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      +{formatCurrency(shift.grossAmount)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditGuardModal(shift)}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* ============================================================== */}
      {/*  TAB: Calendario                                                 */}
      {/* ============================================================== */}
      {activeTab === 'calendario' && (
        <GuardCalendar
          selectedMonth={selectedMonth}
          shifts={guardShifts}
          onAddShift={() => { setActiveTab('guardias'); openNewGuardModal(); }}
          onEditShift={(shift) => { setActiveTab('guardias'); openEditGuardModal(shift); }}
        />
      )}

      {/* ============================================================== */}
      {/*  Modal: Nueva / Editar guardia                                   */}
      {/* ============================================================== */}
      <Modal
        open={guardModalOpen}
        onClose={() => setGuardModalOpen(false)}
        title={editingShift ? 'Editar guardia' : 'Nueva guardia'}
      >
        <div className="space-y-4">
          <Input
            label="Fecha"
            type="date"
            value={gDate}
            onChange={(e) => setGDate(e.target.value)}
          />

          <Select
            label="Tipo de dia"
            value={gDayType}
            onChange={(e) => setGDayType(e.target.value as DayType)}
            options={[
              { value: 'laborable', label: 'Laborable' },
              { value: 'festivo', label: 'Festivo' },
              { value: 'especial', label: 'Especial' },
            ]}
          />

          <Select
            label="Duracion"
            value={gDuration}
            onChange={(e) => setGDuration(e.target.value as ShiftDuration)}
            options={durationOptionsForDayType(gDayType)}
          />

          <Select
            label="Modalidad"
            value={gModality}
            onChange={(e) => setGModality(e.target.value as ShiftModality)}
            options={[
              { value: 'presencia_fisica', label: 'Presencia fisica' },
              { value: 'localizada', label: 'Localizada' },
            ]}
          />

          <Select
            label="Ano de residencia"
            value={gYear}
            onChange={(e) => setGYear(e.target.value as ResidencyYear)}
            options={[
              { value: 'R1', label: 'R1' },
              { value: 'R2', label: 'R2' },
              { value: 'R3', label: 'R3' },
              { value: 'R4', label: 'R4' },
              { value: 'R5', label: 'R5' },
            ]}
          />

          {/* Live gross preview */}
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
            <p className="text-xs text-green-700 dark:text-green-400 mb-0.5">Bruto estimado</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(liveGross)}
            </p>
          </div>

          <Input
            label="Notas (opcional)"
            value={gNotes}
            onChange={(e) => setGNotes(e.target.value)}
            placeholder="Servicio, planta, etc."
          />

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setGuardModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleGuardSave}>
              {editingShift ? 'Guardar cambios' : 'Anadir guardia'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/*  Modal: Nuevo / Editar ingreso                                   */}
      {/* ============================================================== */}
      <Modal
        open={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        title={editingTx ? 'Editar ingreso' : 'Nuevo ingreso'}
      >
        <div className="space-y-4">
          <Input
            label="Fecha"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />

          <Input
            label="Importe"
            type="number"
            min="0"
            step="0.01"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            placeholder="0.00"
          />

          <Select
            label="Categoria"
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            options={incomeCategories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Input
            label="Descripcion"
            value={txDescription}
            onChange={(e) => setTxDescription(e.target.value)}
            placeholder="Concepto del ingreso"
          />

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIncomeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleIncomeSave}
              disabled={!txAmount || parseFloat(txAmount) <= 0}
            >
              {editingTx ? 'Guardar cambios' : 'Anadir ingreso'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================== */
/*  GuardCalendar component                                       */
/* ============================================================== */

const DAY_COLORS: Record<DayType, string> = {
  laborable: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
  festivo:   'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
  especial:  'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
};

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

interface GuardCalendarProps {
  selectedMonth: string; // 'YYYY-MM'
  shifts: GuardShift[];
  onAddShift: () => void;
  onEditShift: (shift: GuardShift) => void;
}

function GuardCalendar({ selectedMonth, shifts, onAddShift, onEditShift }: GuardCalendarProps) {
  const [y, m] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  // Day-of-week of the 1st (0=Sun→adjust to Mon-based: Mon=0...Sun=6)
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7;

  const shiftByDay = useMemo(() => {
    const map = new Map<string, GuardShift>();
    shifts
      .filter((s) => s.date.startsWith(selectedMonth))
      .forEach((s) => map.set(s.date, s));
    return map;
  }, [shifts, selectedMonth]);

  const totalGross = useMemo(
    () => Array.from(shiftByDay.values()).reduce((s, sh) => s + sh.grossAmount, 0),
    [shiftByDay],
  );

  // Build grid cells (nulls = empty leading cells)
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary-500" />
            <div>
              <p className="text-xs text-surface-500 dark:text-surface-400">{shiftByDay.size} guardia{shiftByDay.size !== 1 ? 's' : ''} este mes</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(totalGross)} bruto</p>
            </div>
          </div>
          <Button size="sm" onClick={onAddShift}><Plus size={14} /> Nueva</Button>
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-3 text-xs">
          {(['laborable', 'festivo', 'especial'] as DayType[]).map((dt) => (
            <div key={dt} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm border ${DAY_COLORS[dt]}`} />
              <span className="text-surface-500 dark:text-surface-400 capitalize">{dayTypeLabel(dt)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Calendar grid */}
      <Card>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-surface-400 dark:text-surface-500 py-1">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const shift = shiftByDay.get(dateStr);
            const isWeekend = ((firstDow + day - 1) % 7) >= 5; // Sat or Sun
            return (
              <div
                key={day}
                onClick={() => shift && onEditShift(shift)}
                className={`relative rounded-lg text-center py-1.5 px-0.5 text-xs transition-colors ${
                  shift
                    ? `border cursor-pointer hover:opacity-80 ${DAY_COLORS[shift.dayType]}`
                    : isWeekend
                    ? 'text-surface-400 dark:text-surface-600'
                    : 'text-surface-600 dark:text-surface-400'
                }`}
              >
                <span className="font-medium">{day}</span>
                {shift && (
                  <p className="text-[10px] leading-tight mt-0.5 font-semibold">
                    {formatCurrency(shift.grossAmount).replace('€', '')}€
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
