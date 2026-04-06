import { useState, useMemo, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  Banknote,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import {
  formatCurrency,
  formatDate,
  currentDate,
  calculateGuardGross,
  detectDayType,
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

type Tab = 'nomina' | 'guardias';

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
      </div>

      {/* ============================================================== */}
      {/*  TAB: Nomina y otros                                            */}
      {/* ============================================================== */}
      {activeTab === 'nomina' && (
        <>
          {/* Salary card */}
          {salaryEntry && (
            <Card title={`Salario ${settings.currentResidencyYear}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Bruto mensual</p>
                  <p className="text-lg font-bold text-surface-800 dark:text-surface-100">
                    {formatCurrency(salaryEntry.totalMonthly)}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                    Base {formatCurrency(salaryEntry.baseSalary)} + Complemento{' '}
                    {formatCurrency(salaryEntry.gradeComplement)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Bruto anual</p>
                  <p className="text-lg font-bold text-surface-800 dark:text-surface-100">
                    {formatCurrency(salaryEntry.totalMonthly * salaryEntry.paymentsPerYear)}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                    {salaryEntry.paymentsPerYear} pagas/ano (BOCAM 2026)
                  </p>
                </div>
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
