import { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  CalendarClock,
  TrendingDown,
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';
import { formatCurrency, formatDate, currentDate } from '../../utils';
import type { CreditCardEntry, PaymentStatus } from '../../types';

import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

interface EntryFormState {
  description: string;
  amount: string;
  purchaseDate: string;
  dueDate: string;
  isInstallment: boolean;
  installmentNumber: string;
  totalInstallments: string;
}

const emptyForm: EntryFormState = {
  description: '',
  amount: '',
  purchaseDate: currentDate(),
  dueDate: '',
  isInstallment: false,
  installmentNumber: '',
  totalInstallments: '',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function effectiveStatus(entry: CreditCardEntry, today: string): PaymentStatus {
  if (entry.status === 'pagado') return 'pagado';
  if (entry.dueDate < today) return 'vencido';
  return 'pendiente';
}

const statusBadge: Record<PaymentStatus, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  pagado: { label: 'Pagado', variant: 'success' },
  vencido: { label: 'Vencido', variant: 'danger' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CreditCardPage() {
  const { creditCardEntries, dispatchCreditCard } = useAppContext();
  const today = currentDate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);

  // Entries with effective status
  const entries = useMemo(
    () =>
      [...creditCardEntries]
        .map((e) => ({ ...e, _effectiveStatus: effectiveStatus(e, today) }))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [creditCardEntries, today],
  );

  // Summary KPIs
  const totalPendiente = useMemo(
    () =>
      entries
        .filter((e) => e._effectiveStatus !== 'pagado')
        .reduce((sum, e) => sum + e.amount, 0),
    [entries],
  );

  const proximoVencimiento = useMemo(() => {
    const pendientes = entries.filter((e) => e._effectiveStatus === 'pendiente');
    if (pendientes.length === 0) return null;
    return pendientes.reduce((earliest, e) =>
      e.dueDate < earliest.dueDate ? e : earliest,
    );
  }, [entries]);

  /* ---- Modal helpers ---- */

  function openNewModal() {
    setForm({ ...emptyForm, purchaseDate: currentDate() });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(entry: CreditCardEntry) {
    setForm({
      description: entry.description,
      amount: String(entry.amount),
      purchaseDate: entry.purchaseDate,
      dueDate: entry.dueDate,
      isInstallment: entry.isInstallment,
      installmentNumber: entry.installmentNumber ? String(entry.installmentNumber) : '',
      totalInstallments: entry.totalInstallments ? String(entry.totalInstallments) : '',
    });
    setEditingId(entry.id);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function handleSave() {
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amount) || !form.dueDate) return;

    const payload: CreditCardEntry = {
      id: editingId ?? nanoid(),
      description: form.description.trim(),
      amount,
      purchaseDate: form.purchaseDate,
      dueDate: form.dueDate,
      status: 'pendiente',
      isInstallment: form.isInstallment,
      installmentNumber: form.isInstallment ? parseInt(form.installmentNumber) || undefined : undefined,
      totalInstallments: form.isInstallment ? parseInt(form.totalInstallments) || undefined : undefined,
      createdAt: editingId
        ? (creditCardEntries.find((e) => e.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    if (editingId) {
      // Preserve existing status / paidDate when editing
      const existing = creditCardEntries.find((e) => e.id === editingId);
      if (existing) {
        payload.status = existing.status;
        payload.paidDate = existing.paidDate;
      }
      dispatchCreditCard({ type: 'EDIT_CC_ENTRY', payload });
    } else {
      dispatchCreditCard({ type: 'ADD_CC_ENTRY', payload });
    }

    closeModal();
  }

  function markPagado(entry: CreditCardEntry) {
    dispatchCreditCard({
      type: 'EDIT_CC_ENTRY',
      payload: { ...entry, status: 'pagado', paidDate: currentDate() },
    });
  }

  function deleteEntry(id: string) {
    dispatchCreditCard({ type: 'DELETE_CC_ENTRY', payload: id });
  }

  /* ---- Form updater ---- */

  function set<K extends keyof EntryFormState>(key: K, value: EntryFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (entries.length === 0 && !modalOpen) {
    return (
      <EmptyState
        icon={<CreditCard size={48} />}
        title="Sin cargos registrados"
        description="Registra tus cargos de tarjeta de credito para llevar un control de pagos."
        action={
          <Button onClick={openNewModal}>
            <Plus size={16} /> Nuevo cargo
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-500 dark:text-surface-400">Total pendiente</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(totalPendiente)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <CalendarClock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-surface-500 dark:text-surface-400">Proximo vencimiento</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {proximoVencimiento ? formatDate(proximoVencimiento.dueDate) : '---'}
              </p>
              {proximoVencimiento && (
                <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  {proximoVencimiento.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex justify-end">
        <Button onClick={openNewModal}>
          <Plus size={16} /> Nuevo cargo
        </Button>
      </div>

      {/* Entry list */}
      <Card title="Cargos">
        <div className="divide-y divide-surface-100 dark:divide-surface-800 -mx-4 lg:-mx-5">
          {entries.map((entry) => {
            const st = entry._effectiveStatus;
            const badge = statusBadge[st];
            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 lg:px-5 py-3"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                      {entry.description}
                    </p>
                    {entry.isInstallment && entry.installmentNumber && entry.totalInstallments && (
                      <Badge variant="neutral">
                        {entry.installmentNumber}/{entry.totalInstallments}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Vence: {formatDate(entry.dueDate)}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                    {formatCurrency(entry.amount)}
                  </p>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {st !== 'pagado' && (
                    <Button variant="ghost" size="sm" onClick={() => markPagado(entry)} title="Marcar pagado">
                      <CheckCircle size={15} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(entry)} title="Editar">
                    <Pencil size={15} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deleteEntry(entry.id)} title="Eliminar">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Debt payoff strategy */}
      {totalPendiente > 0 && (
        <Card title="Plan de pago">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                  Deuda total pendiente: {formatCurrency(totalPendiente)}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Sin intereses — paga todo antes del vencimiento para mantenerlo asi.
                </p>
              </div>
            </div>

            {/* Payment timeline */}
            <div className="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-3 space-y-2">
              <p className="text-xs font-medium text-surface-700 dark:text-surface-300">Calendario de pagos:</p>
              {entries
                .filter((e) => e._effectiveStatus !== 'pagado')
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="text-surface-600 dark:text-surface-400">
                      {formatDate(e.dueDate)} — {e.description}
                    </span>
                    <span className="font-semibold text-surface-800 dark:text-surface-200">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                ))}
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-xs text-green-700 dark:text-green-400">
                <strong>Estrategia recomendada:</strong> Paga el total pendiente con la nomina del mes.
                Despues, usa la tarjeta solo para gastos que puedas pagar al mes siguiente.
                Objetivo: deuda = 0 al recibir cada nomina.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* New / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar cargo' : 'Nuevo cargo'}
      >
        <div className="space-y-4">
          <Input
            label="Descripcion"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ej: Seguro coche"
          />

          <Input
            label="Importe"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0.00"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de compra"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => set('purchaseDate', e.target.value)}
            />
            <Input
              label="Fecha de vencimiento"
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
          </div>

          {/* Installment toggle */}
          <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isInstallment}
              onChange={(e) => set('isInstallment', e.target.checked)}
              className="rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500"
            />
            Pago a plazos
          </label>

          {form.isInstallment && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cuota actual"
                type="number"
                min="1"
                value={form.installmentNumber}
                onChange={(e) => set('installmentNumber', e.target.value)}
                placeholder="1"
              />
              <Input
                label="Total cuotas"
                type="number"
                min="1"
                value={form.totalInstallments}
                onChange={(e) => set('totalInstallments', e.target.value)}
                placeholder="12"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
