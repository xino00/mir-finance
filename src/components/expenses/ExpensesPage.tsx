import { useMemo, useState } from 'react';
import { Plus, Receipt, Pencil, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';

import { useAppContext } from '../../context/AppContext';
import { useSelectedMonth } from '../../hooks/useSelectedMonth';
import { formatCurrency, formatDate, currentDate } from '../../utils';
import type { Transaction } from '../../types';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';

/* ============================================================
   Form state
   ============================================================ */

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

/* ============================================================
   Component
   ============================================================ */

export default function ExpensesPage() {
  const { transactions, dispatchTransactions, settings } = useAppContext();
  const { selectedMonth } = useSelectedMonth();

  const expenseCategories = useMemo(
    () => settings.categories.filter((c) => c.type === 'expense'),
    [settings.categories],
  );

  const defaultCatId = expenseCategories[0]?.id ?? '';

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm(defaultCatId));
  const [formError, setFormError] = useState('');

  // Filtered and sorted expenses
  const monthExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth],
  );

  const totalExpenses = useMemo(
    () => monthExpenses.reduce((s, t) => s + t.amount, 0),
    [monthExpenses],
  );

  const avgExpense = monthExpenses.length > 0 ? totalExpenses / monthExpenses.length : 0;

  /* ---- helpers ---- */

  const selectedCat = useMemo(
    () => expenseCategories.find((c) => c.id === form.category),
    [expenseCategories, form.category],
  );

  const subcategoryOptions = useMemo(() => {
    const subs = selectedCat?.subcategories ?? [];
    return [
      { value: '', label: 'Sin subcategoria' },
      ...subs.map((s) => ({ value: s, label: s })),
    ];
  }, [selectedCat]);

  const categoryOptions = useMemo(
    () => expenseCategories.map((c) => ({ value: c.id, label: c.name })),
    [expenseCategories],
  );

  function getCategoryName(catId: string): string {
    return settings.categories.find((c) => c.id === catId)?.name ?? catId;
  }

  function getCategoryColor(catId: string): string {
    return settings.categories.find((c) => c.id === catId)?.color ?? '#94a3b8';
  }

  /* ---- modal open/close ---- */

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

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  /* ---- submit ---- */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFormError('Introduce un importe valido');
      return;
    }
    if (!form.date) {
      setFormError('Selecciona una fecha');
      return;
    }

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

    if (editingId) {
      dispatchTransactions({ type: 'EDIT_TRANSACTION', payload: transaction });
    } else {
      dispatchTransactions({ type: 'ADD_TRANSACTION', payload: transaction });
    }
    closeModal();
  }

  /* ---- delete ---- */

  function handleDelete(id: string) {
    if (window.confirm('¿Seguro que quieres eliminar este gasto?')) {
      dispatchTransactions({ type: 'DELETE_TRANSACTION', payload: id });
    }
  }

  /* ---- form updater ---- */

  function updateField<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Reset subcategory when category changes
      if (key === 'category') {
        next.subcategory = '';
      }
      return next;
    });
  }

  /* ============================================================
     Render
     ============================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-surface-800 dark:text-surface-100">Gastos</h1>
        <Button onClick={openNew} size="sm">
          <Plus size={16} />
          Nuevo gasto
        </Button>
      </div>

      {/* Summary card */}
      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Total del mes</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Transacciones</p>
            <p className="text-base font-bold text-surface-800 dark:text-surface-200 mt-0.5">
              {monthExpenses.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400">Gasto medio</p>
            <p className="text-base font-bold text-surface-800 dark:text-surface-200 mt-0.5">
              {formatCurrency(avgExpense)}
            </p>
          </div>
        </div>
      </Card>

      {/* Expense list */}
      {monthExpenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="Sin gastos este mes"
          description="Registra tu primer gasto para empezar a controlar tus finanzas."
          action={
            <Button onClick={openNew} size="sm">
              <Plus size={16} />
              Nuevo gasto
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-surface-100 dark:divide-surface-800">
            {monthExpenses.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {/* Colored dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(tx.category) }}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                    {tx.description || getCategoryName(tx.category)}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {formatDate(tx.date)} &middot; {getCategoryName(tx.category)}
                  </p>
                </div>

                {/* Amount */}
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                  -{formatCurrency(tx.amount)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(tx)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar gasto' : 'Nuevo gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}

          <Input
            label="Importe"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => updateField('amount', e.target.value)}
            required
          />

          <Select
            label="Categoria"
            options={categoryOptions}
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
          />

          {subcategoryOptions.length > 1 && (
            <Select
              label="Subcategoria"
              options={subcategoryOptions}
              value={form.subcategory}
              onChange={(e) => updateField('subcategory', e.target.value)}
            />
          )}

          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            required
          />

          <Input
            label="Descripcion"
            type="text"
            placeholder="Descripcion del gasto"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />

          {/* Recurring */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => updateField('isRecurring', e.target.checked)}
                className="rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
                Gasto recurrente
              </span>
            </label>

            {form.isRecurring && (
              <Input
                label="Dia del mes"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={form.recurringDay}
                onChange={(e) => updateField('recurringDay', e.target.value)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" size="md" className="flex-1" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1">
              {editingId ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
