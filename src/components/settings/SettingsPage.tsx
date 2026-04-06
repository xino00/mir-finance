import { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { formatCurrency } from '../../utils/formatters';
import { exportData, importData } from '../../utils/export-import';
import type { AppState, ResidencyYear, CategoryConfig } from '../../types';
import { Download, Upload, Sun, Moon, Monitor, Trash2, Plus } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function SettingsPage() {
  const ctx = useAppContext();
  const { settings, dispatchSettings } = ctx;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);

  // Category form
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catColor, setCatColor] = useState('#6B7280');
  const [catSubcategories, setCatSubcategories] = useState('');

  const handleExport = () => {
    const state: AppState = {
      transactions: ctx.transactions,
      guardShifts: ctx.guardShifts,
      investmentFunds: ctx.investmentFunds,
      investmentEntries: ctx.investmentEntries,
      creditCardEntries: ctx.creditCardEntries,
      monthlyBudgets: ctx.monthlyBudgets,
      monthlyPayslips: ctx.monthlyPayslips,
      settings: ctx.settings,
      version: 1,
    };
    exportData(state);
    dispatchSettings({ type: 'UPDATE_SETTINGS', payload: { lastExportDate: new Date().toISOString() } });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await importData(file);
      if (!window.confirm(`Se importaran ${data.transactions.length} transacciones, ${data.guardShifts.length} guardias, ${data.investmentFunds.length} fondos y ${data.creditCardEntries.length} cargos de tarjeta. ¿Continuar?`)) {
        setImporting(false);
        return;
      }
      ctx.dispatchTransactions({ type: 'SET_TRANSACTIONS', payload: data.transactions });
      ctx.dispatchGuardShifts({ type: 'SET_GUARD_SHIFTS', payload: data.guardShifts });
      ctx.dispatchInvestmentEntries({ type: 'SET_ENTRIES', payload: data.investmentEntries });
      ctx.dispatchCreditCard({ type: 'SET_CC_ENTRIES', payload: data.creditCardEntries });
      ctx.dispatchBudgets({ type: 'SET_BUDGETS', payload: data.monthlyBudgets });
      if (data.monthlyPayslips) ctx.dispatchPayslips({ type: 'SET_PAYSLIPS', payload: data.monthlyPayslips });
      if (data.settings) dispatchSettings({ type: 'SET_SETTINGS', payload: data.settings });
      // Funds need individual adds since there's no SET action
      data.investmentFunds.forEach((f) => ctx.dispatchInvestmentFunds({ type: 'ADD_FUND', payload: f }));
      alert('Datos importados correctamente');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType('expense');
    setCatColor('#6B7280');
    setCatSubcategories('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: CategoryConfig) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatColor(cat.color);
    setCatSubcategories(cat.subcategories.join(', '));
    setShowCategoryModal(true);
  };

  const saveCategory = () => {
    if (!catName.trim()) return;
    const subs = catSubcategories.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = [...settings.categories];

    if (editingCategory) {
      const idx = updated.findIndex((c) => c.id === editingCategory.id);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], name: catName, type: catType, color: catColor, subcategories: subs };
      }
    } else {
      updated.push({
        id: nanoid(8),
        name: catName,
        type: catType,
        color: catColor,
        icon: 'Tag',
        subcategories: subs,
        isDefault: false,
      });
    }
    dispatchSettings({ type: 'UPDATE_SETTINGS', payload: { categories: updated } });
    setShowCategoryModal(false);
  };

  const deleteCategory = (id: string) => {
    if (!window.confirm('¿Eliminar esta categoria?')) return;
    dispatchSettings({
      type: 'UPDATE_SETTINGS',
      payload: { categories: settings.categories.filter((c) => c.id !== id) },
    });
  };

  const themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Sistema' },
  ];

  const yearOptions: { value: string; label: string }[] = [
    { value: 'R1', label: 'R1' },
    { value: 'R2', label: 'R2' },
    { value: 'R3', label: 'R3' },
    { value: 'R4', label: 'R4' },
    { value: 'R5', label: 'R5' },
  ];

  const ThemeIcon = settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-surface-800 dark:text-surface-200">Ajustes</h2>

      {/* General */}
      <Card title="General">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Ano de residencia"
              options={yearOptions}
              value={settings.currentResidencyYear}
              onChange={(e) =>
                dispatchSettings({
                  type: 'UPDATE_SETTINGS',
                  payload: { currentResidencyYear: e.target.value as ResidencyYear },
                })
              }
            />
            <Input
              label="Dia de cobro"
              type="number"
              min={1}
              max={31}
              value={settings.payDay}
              onChange={(e) =>
                dispatchSettings({
                  type: 'UPDATE_SETTINGS',
                  payload: { payDay: Number(e.target.value) },
                })
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <ThemeIcon size={18} className="text-surface-500" />
            <Select
              label="Tema"
              options={themeOptions}
              value={settings.theme}
              onChange={(e) =>
                dispatchSettings({
                  type: 'UPDATE_SETTINGS',
                  payload: { theme: e.target.value as 'light' | 'dark' | 'system' },
                })
              }
            />
          </div>
        </div>
      </Card>

      {/* Salary Tables */}
      <Card title="Tablas salariales (BOCAM 2026)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-surface-500 border-b border-surface-100 dark:border-surface-800">
                <th className="py-2 pr-4">Ano</th>
                <th className="py-2 pr-4">Base</th>
                <th className="py-2 pr-4">Complemento</th>
                <th className="py-2 pr-4">Total/mes</th>
                <th className="py-2">Total/ano</th>
              </tr>
            </thead>
            <tbody>
              {settings.salaryTables.map((st) => (
                <tr key={st.year} className={`border-b border-surface-50 dark:border-surface-800/50 ${st.year === settings.currentResidencyYear ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                  <td className="py-2 pr-4 font-medium">{st.year}</td>
                  <td className="py-2 pr-4">{formatCurrency(st.baseSalary)}</td>
                  <td className="py-2 pr-4">{formatCurrency(st.gradeComplement)}</td>
                  <td className="py-2 pr-4 font-medium">{formatCurrency(st.totalMonthly)}</td>
                  <td className="py-2 font-medium">{formatCurrency(st.totalMonthly * st.paymentsPerYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-surface-400 mt-2">14 pagas/ano. Fuente: BOCAM 2026</p>
      </Card>

      {/* Guard Rates */}
      <Card title="Tarifas guardias (presencia fisica)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-surface-500 border-b border-surface-100 dark:border-surface-800">
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">R1</th>
                <th className="py-2 pr-4">R2</th>
                <th className="py-2 pr-4">R3</th>
                <th className="py-2 pr-4">R4</th>
                <th className="py-2">R5</th>
              </tr>
            </thead>
            <tbody>
              {settings.guardRates.map((gr) => (
                <tr key={`${gr.duration}-${gr.dayType}`} className="border-b border-surface-50 dark:border-surface-800/50">
                  <td className="py-2 pr-4 font-medium">{gr.duration} {gr.dayType}</td>
                  <td className="py-2 pr-4">{formatCurrency(gr.rates.R1)}</td>
                  <td className="py-2 pr-4">{formatCurrency(gr.rates.R2)}</td>
                  <td className="py-2 pr-4">{formatCurrency(gr.rates.R3)}</td>
                  <td className="py-2 pr-4">{formatCurrency(gr.rates.R4)}</td>
                  <td className="py-2">{formatCurrency(gr.rates.R5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-surface-400 mt-2">Guardias localizadas: 50% de estos importes</p>
      </Card>

      {/* Categories */}
      <Card
        title="Categorias"
        action={
          <Button variant="ghost" size="sm" onClick={openNewCategory}>
            <Plus size={14} /> Nueva
          </Button>
        }
      >
        <div className="space-y-1">
          {settings.categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 py-1.5 group">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm flex-1 text-surface-700 dark:text-surface-300">{cat.name}</span>
              <span className="text-xs text-surface-400">{cat.type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
              <button
                onClick={() => openEditCategory(cat)}
                className="text-xs text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Editar
              </button>
              {!cat.isDefault && (
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Export / Import */}
      <Card title="Datos">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExport} variant="secondary" className="flex-1">
              <Download size={16} /> Exportar JSON
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="flex-1"
              disabled={importing}
            >
              <Upload size={16} /> Importar JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {settings.lastExportDate && (
            <p className="text-xs text-surface-400">
              Ultimo backup: {new Date(settings.lastExportDate).toLocaleString('es-ES')}
            </p>
          )}
          <p className="text-xs text-surface-500">
            Exporta tus datos como archivo JSON y guardalo en OneDrive, Google Drive o GitHub para tener un backup.
          </p>
        </div>
      </Card>

      {/* Category Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? 'Editar categoria' : 'Nueva categoria'}>
        <div className="space-y-4">
          <Input label="Nombre" value={catName} onChange={(e) => setCatName(e.target.value)} />
          <Select
            label="Tipo"
            options={[
              { value: 'expense', label: 'Gasto' },
              { value: 'income', label: 'Ingreso' },
            ]}
            value={catType}
            onChange={(e) => setCatType(e.target.value as 'expense' | 'income')}
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-surface-600 dark:text-surface-400">Color</label>
            <input
              type="color"
              value={catColor}
              onChange={(e) => setCatColor(e.target.value)}
              className="w-10 h-10 rounded border border-surface-200 dark:border-surface-600 cursor-pointer"
            />
          </div>
          <Input
            label="Subcategorias (separadas por coma)"
            value={catSubcategories}
            onChange={(e) => setCatSubcategories(e.target.value)}
            placeholder="Sub1, Sub2, Sub3"
          />
          <Button onClick={saveCategory} className="w-full">Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}
