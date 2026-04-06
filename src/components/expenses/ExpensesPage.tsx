import { useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Receipt, Pencil, Trash2, RepeatIcon, Lock, RefreshCw, Zap } from 'lucide-react';
import { nanoid } from 'nanoid';

import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import { formatCurrency, formatDate, currentDate } from '../../utils';
import { fetchGoogleSheet } from '../../utils/google-sheets';
import type { Transaction, RecurringExpense } from '../../types';
import type { CategoryConfig } from '../../types';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';

interface ExpenseForm {
  amount: string;
  category: string;
  subcategory: string;
  date: string;
  description: string;
  isRecurring: boolean;
  recurringDay: string;
}

const emptyForm = (defaultCategory: string): ExpenseForm => ({
  amount: '',
  category: defaultCategory,
  subcategory: '',
  date: currentDate(),
  description: '',
  isRecurring: false,
  recurringDay: '',
});

interface RecurringForm {
  amount: string;
  category: string;
  subcategory: string;
  description: string;
  dayOfMonth: string;
}

const emptyRecurringForm = (defaultCategory: string): RecurringForm => ({
  amount: '',
  category: defaultCategory,
  subcategory: '',
  description: '',
  dayOfMonth: '1',
});

export default function ExpensesPage() {
  const { transactions, dispatchTransactions, settings, dispatchSettings } = useAppContext();
  const { selectedMonth } = useSelectedMonth();

  const expenseCategories = useMemo(
    () => settings.categories.filter((c) => c.type === 'expense'),
    [settings.categories],
  );

  const defaultCatId = expenseCategories[0]?.id ?? '';
  const recurringExpenses = useMemo(
    () => settings.recurringExpenses ?? [],
    [settings.recurringExpenses],
  );

  // --- Auto-generate recurring expenses for selectedMonth ---
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  useEffect(() => {
    if (recurringExpenses.length === 0) return;

    const existingRecurringIds = transactionsRef.current
      .filter((t) => t.date.startsWith(selectedMonth) && t.fromRecurringId)
      .map((t) => t.fromRecurringId);

    recurringExpenses.forEach((re) => {
      if (existingRecurringIds.includes(re.id)) return;

      const day = String(re.dayOfMonth).padStart(2, '0');
      const tx: Transaction = {
        id: nanoid(),
        date: `${selectedMonth}-${day}`,
        amount: re.amount,
        type: 'expense',
        category: re.category,
        subcategory: re.subcategory,
        description: re.description,
        isRecurring: true,
        recurringDay: re.dayOfMonth,
        fromRecurringId: re.id,
        createdAt: new Date().toISOString(),
      };
      dispatchTransactions({ type: 'ADD_TRANSACTION', payload: tx });
    });
  }, [selectedMonth, recurringExpenses, dispatchTransactions]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm(defaultCatId));
  const [formError, setFormError] = useState('');

  // Recurring modal state
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const [recurringForm, setRecurringForm] = useState<RecurringForm>(emptyRecurringForm(defaultCatId));

  // Filtered expenses
  const monthExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth],
  );

  const fixedExpenses = monthExpenses.filter((t) => t.fromRecurringId);
  const totalExpenses = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalFixed = fixedExpenses.reduce((s, t) => s + t.amount, 0);
  const totalVariable = totalExpenses - totalFixed;

  /* ---- helpers ---- */
  const selectedCat = useMemo(
    () => expenseCategories.find((c) => c.id === form.category),
    [expenseCategories, form.category],
  );

  const subcategoryOptions = useMemo(() => {
    const subs = selectedCat?.subcategories ?? [];
    return [{ value: '', label: 'Sin subcategoria' }, ...subs.map((s) => ({ value: s, label: s }))];
  }, [selectedCat]);

  const categoryOptions = useMemo(
    () => expenseCategories.map((c) => ({ value: c.id, label: c.name })),
    [expenseCategories],
  );

  const selectedRecCat = useMemo(
    () => expenseCategories.find((c) => c.id === recurringForm.category),
    [expenseCategories, recurringForm.category],
  );

  const recSubcategoryOptions = useMemo(() => {
    const subs = selectedRecCat?.subcategories ?? [];
    return [{ value: '', label: 'Sin subcategoria' }, ...subs.map((s) => ({ value: s, label: s }))];
  }, [selectedRecCat]);

  function getCategoryName(catId: string): string {
    return settings.categories.find((c) => c.id === catId)?.name ?? catId;
  }

  function getCategoryColor(catId: string): string {
    return settings.categories.find((c) => c.id === catId)?.color ?? '#94a3b8';
  }

  /* ---- expense modal ---- */
  function openNew() {
    setEditingId(null);
    setForm(emptyForm(defaultCatId));
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setForm({
      amount: String(tx.amount),
      category: tx.category,
      subcategory: tx.subcategory ?? '',
      date: tx.date,
      description: tx.description,
      isRecurring: tx.isRecurring,
      recurringDay: tx.recurringDay != null ? String(tx.recurringDay) : '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setFormError('Introduce un importe valido'); return; }

    const transaction: Transaction = {
      id: editingId ?? nanoid(),
      date: form.date,
      amount,
      type: 'expense',
      category: form.category,
      subcategory: form.subcategory || undefined,
      description: form.description,
      isRecurring: form.isRecurring,
      recurringDay: form.isRecurring && form.recurringDay ? parseInt(form.recurringDay, 10) : undefined,
      createdAt: editingId
        ? (transactions.find((t) => t.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    dispatchTransactions({ type: editingId ? 'EDIT_TRANSACTION' : 'ADD_TRANSACTION', payload: transaction });
    setModalOpen(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (window.confirm('¿Eliminar este gasto?')) {
      dispatchTransactions({ type: 'DELETE_TRANSACTION', payload: id });
    }
  }

  function updateField<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category') next.subcategory = '';
      return next;
    });
  }

  /* ---- recurring expense modal ---- */
  function openNewRecurring() {
    setEditingRecurringId(null);
    setRecurringForm(emptyRecurringForm(defaultCatId));
    setRecurringModalOpen(true);
  }

  function openEditRecurring(re: RecurringExpense) {
    setEditingRecurringId(re.id);
    setRecurringForm({
      amount: String(re.amount),
      category: re.category,
      subcategory: re.subcategory ?? '',
      description: re.description,
      dayOfMonth: String(re.dayOfMonth),
    });
    setRecurringModalOpen(true);
  }

  function saveRecurring(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(recurringForm.amount);
    if (!amount || amount <= 0) return;

    const entry: RecurringExpense = {
      id: editingRecurringId ?? nanoid(8),
      amount,
      category: recurringForm.category,
      subcategory: recurringForm.subcategory || undefined,
      description: recurringForm.description,
      dayOfMonth: parseInt(recurringForm.dayOfMonth, 10) || 1,
    };

    const updated = editingRecurringId
      ? recurringExpenses.map((r) => (r.id === editingRecurringId ? entry : r))
      : [...recurringExpenses, entry];

    dispatchSettings({ type: 'UPDATE_SETTINGS', payload: { recurringExpenses: updated } });
    setRecurringModalOpen(false);
    setEditingRecurringId(null);
  }

  function deleteRecurring(id: string) {
    if (!window.confirm('¿Eliminar este gasto fijo?')) return;
    dispatchSettings({
      type: 'UPDATE_SETTINGS',
      payload: { recurringExpenses: recurringExpenses.filter((r) => r.id !== id) },
    });
  }

  /* ---- Google Sheets sync ---- */
  const [syncing, setSyncing] = useState(false);

  async function handleGoogleSync() {
    if (!settings.googleSheetId) return;
    setSyncing(true);
    try {
      const rows = await fetchGoogleSheet(settings.googleSheetId);
      const alreadySynced = settings.googleSheetSyncedRows ?? 0;
      const newRows = rows.slice(alreadySynced);

      if (newRows.length === 0) {
        alert('No hay nuevos gastos para importar.');
        setSyncing(false);
        return;
      }

      let imported = 0;
      for (const row of newRows) {
        // Match category name to category ID
        const cat = expenseCategories.find(
          (c) => c.name.toLowerCase() === row.category.toLowerCase(),
        );
        const catId = cat?.id ?? defaultCatId;

        const tx: Transaction = {
          id: nanoid(),
          date: row.date,
          amount: row.amount,
          type: 'expense',
          category: catId,
          description: row.description,
          isRecurring: false,
          fromRecurringId: undefined,
          createdAt: new Date().toISOString(),
        };
        dispatchTransactions({ type: 'ADD_TRANSACTION', payload: tx });
        imported++;
      }

      dispatchSettings({
        type: 'UPDATE_SETTINGS',
        payload: {
          googleSheetSyncedRows: rows.length,
          googleSheetLastSync: new Date().toISOString(),
        },
      });

      alert(`${imported} gasto${imported !== 1 ? 's' : ''} importado${imported !== 1 ? 's' : ''} desde Google Forms.`);
    } catch (err) {
      alert(`Error al sincronizar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSyncing(false);
    }
  }

  /* ---- render ---- */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-surface-800 dark:text-surface-100">Gastos</h1>
        <div className="flex gap-2">
          {settings.googleSheetId && (
            <Button onClick={handleGoogleSync} variant="secondary" size="sm" disabled={syncing}>
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync...' : 'Sincronizar'}
            </Button>
          )}
          <Button onClick={openNewRecurring} variant="secondary" size="sm">
            <Lock size={14} /> Fijos
          </Button>
          <Button onClick={openNew} size="sm">
            <Plus size={16} /> Nuevo
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Total del mes</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Fijos</p>
            <p className="text-base font-bold text-surface-800 dark:text-surface-200 mt-0.5">{formatCurrency(totalFixed)}</p>
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Variables</p>
            <p className="text-base font-bold text-surface-800 dark:text-surface-200 mt-0.5">{formatCurrency(totalVariable)}</p>
          </div>
        </div>
      </Card>

      {/* Quick-add expense inline form */}
      <QuickAddExpense
        categories={expenseCategories}
        defaultCategoryId={defaultCatId}
        onAdd={(amount, categoryId, description) => {
          const tx: Transaction = {
            id: nanoid(),
            date: currentDate(),
            amount,
            type: 'expense',
            category: categoryId,
            description,
            isRecurring: false,
            createdAt: new Date().toISOString(),
          };
          dispatchTransactions({ type: 'ADD_TRANSACTION', payload: tx });
        }}
      />

      {/* Recurring expenses card */}
      {recurringExpenses.length > 0 && (
        <Card
          title="Gastos fijos mensuales"
          action={<Button variant="ghost" size="sm" onClick={openNewRecurring}><Plus size={14} /></Button>}
        >
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {recurringExpenses.map((re) => (
              <li key={re.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 group">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(re.category) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{re.description}</p>
                  <p className="text-xs text-surface-400">{getCategoryName(re.category)} &middot; dia {re.dayOfMonth}</p>
                </div>
                <span className="text-sm font-semibold text-surface-600 dark:text-surface-300">{formatCurrency(re.amount)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditRecurring(re)} className="p-1 text-surface-400 hover:text-primary-500"><Pencil size={13} /></button>
                  <button onClick={() => deleteRecurring(re.id)} className="p-1 text-surface-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-2 border-t border-surface-100 dark:border-surface-800 flex justify-between text-sm">
            <span className="text-surface-500">Total fijos</span>
            <span className="font-semibold text-surface-700 dark:text-surface-300">{formatCurrency(recurringExpenses.reduce((s, r) => s + r.amount, 0))}/mes</span>
          </div>
        </Card>
      )}

      {/* Expense list */}
      {monthExpenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="Sin gastos este mes"
          description="Registra tu primer gasto para empezar a controlar tus finanzas."
          action={<Button onClick={openNew} size="sm"><Plus size={16} /> Nuevo gasto</Button>}
        />
      ) : (
        <Card title="Gastos del mes">
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {monthExpenses.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(tx.category) }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                      {tx.description || getCategoryName(tx.category)}
                    </p>
                    {tx.fromRecurringId && <Badge variant="neutral"><RepeatIcon size={10} /> Fijo</Badge>}
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {formatDate(tx.date)} &middot; {getCategoryName(tx.category)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">-{formatCurrency(tx.amount)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(tx)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Expense Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Editar gasto' : 'Nuevo gasto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{formError}</p>}
          <Input label="Importe" type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} required />
          <Select label="Categoria" options={categoryOptions} value={form.category} onChange={(e) => updateField('category', e.target.value)} />
          {subcategoryOptions.length > 1 && <Select label="Subcategoria" options={subcategoryOptions} value={form.subcategory} onChange={(e) => updateField('subcategory', e.target.value)} />}
          <Input label="Fecha" type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} required />
          <Input label="Descripcion" type="text" placeholder="Descripcion del gasto" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setModalOpen(false); setEditingId(null); }}>Cancelar</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Guardar' : 'Agregar'}</Button>
          </div>
        </form>
      </Modal>

      {/* Recurring Expense Modal */}
      <Modal open={recurringModalOpen} onClose={() => { setRecurringModalOpen(false); setEditingRecurringId(null); }} title={editingRecurringId ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}>
        <form onSubmit={saveRecurring} className="space-y-4">
          <p className="text-xs text-surface-500 bg-surface-50 dark:bg-surface-800 px-3 py-2 rounded-lg">
            Los gastos fijos se generan automaticamente cada mes.
          </p>
          <Input label="Importe mensual" type="number" step="0.01" min="0" value={recurringForm.amount} onChange={(e) => setRecurringForm((p) => ({ ...p, amount: e.target.value }))} required />
          <Select label="Categoria" options={categoryOptions} value={recurringForm.category} onChange={(e) => setRecurringForm((p) => ({ ...p, category: e.target.value, subcategory: '' }))} />
          {recSubcategoryOptions.length > 1 && <Select label="Subcategoria" options={recSubcategoryOptions} value={recurringForm.subcategory} onChange={(e) => setRecurringForm((p) => ({ ...p, subcategory: e.target.value }))} />}
          <Input label="Descripcion" type="text" placeholder="Ej: Alquiler" value={recurringForm.description} onChange={(e) => setRecurringForm((p) => ({ ...p, description: e.target.value }))} required />
          <Input label="Dia del mes" type="number" min="1" max="31" value={recurringForm.dayOfMonth} onChange={(e) => setRecurringForm((p) => ({ ...p, dayOfMonth: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setRecurringModalOpen(false); setEditingRecurringId(null); }}>Cancelar</Button>
            <Button type="submit" className="flex-1">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ---- Quick-add expense inline form ---- */

interface QuickAddExpenseProps {
  categories: CategoryConfig[];
  defaultCategoryId: string;
  onAdd: (amount: number, categoryId: string, description: string) => void;
}

function QuickAddExpense({ categories, defaultCategoryId, onAdd }: QuickAddExpenseProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    onAdd(parsed, categoryId, description);
    setAmount('');
    setDescription('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-none w-28">
          <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Importe</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-6 pr-2 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-surface-500 dark:text-surface-400 mb-1">Descripcion</label>
          <input
            type="text"
            placeholder="Opcional..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-surface-800 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white'
          }`}
        >
          {saved ? '✓' : <><Zap size={14} /> Añadir</>}
        </button>
      </form>
    </Card>
  );
}
