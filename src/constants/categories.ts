import type { CategoryConfig } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'vivienda', name: 'Vivienda', type: 'expense', color: '#3B82F6', icon: 'Home',
    subcategories: ['Alquiler', 'Comunidad', 'Seguro hogar'], isDefault: true,
  },
  {
    id: 'suministros', name: 'Suministros', type: 'expense', color: '#F59E0B', icon: 'Zap',
    subcategories: ['Luz', 'Gas', 'Agua', 'Internet', 'Movil'], isDefault: true,
  },
  {
    id: 'alimentacion', name: 'Alimentacion', type: 'expense', color: '#10B981', icon: 'ShoppingCart',
    subcategories: ['Supermercado', 'Comida fuera', 'Comida hospital'], isDefault: true,
  },
  {
    id: 'transporte', name: 'Transporte', type: 'expense', color: '#8B5CF6', icon: 'Train',
    subcategories: ['Abono transporte', 'Taxi/VTC', 'Gasolina', 'Parking'], isDefault: true,
  },
  {
    id: 'suscripciones', name: 'Suscripciones', type: 'expense', color: '#EC4899', icon: 'Tv',
    subcategories: ['Streaming', 'Software', 'Gimnasio', 'Otros'], isDefault: true,
  },
  {
    id: 'salud', name: 'Salud', type: 'expense', color: '#EF4444', icon: 'Heart',
    subcategories: ['Farmacia', 'Dentista', 'Optica', 'Seguro medico'], isDefault: true,
  },
  {
    id: 'ocio', name: 'Ocio', type: 'expense', color: '#F97316', icon: 'Music',
    subcategories: ['Restaurantes', 'Cine', 'Viajes', 'Compras'], isDefault: true,
  },
  {
    id: 'formacion', name: 'Formacion', type: 'expense', color: '#06B6D4', icon: 'BookOpen',
    subcategories: ['Cursos', 'Libros', 'Congresos'], isDefault: true,
  },
  {
    id: 'profesional', name: 'Profesional', type: 'expense', color: '#84CC16', icon: 'Briefcase',
    subcategories: ['Colegio Medicos', 'Seguro RC', 'Material'], isDefault: true,
  },
  {
    id: 'otros_gastos', name: 'Otros gastos', type: 'expense', color: '#6B7280', icon: 'MoreHorizontal',
    subcategories: ['Regalos', 'Imprevistos', 'Varios'], isDefault: true,
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryConfig[] = [
  {
    id: 'nomina', name: 'Nomina', type: 'income', color: '#22C55E', icon: 'Banknote',
    subcategories: ['Salario base', 'Extra junio', 'Extra diciembre'], isDefault: true,
  },
  {
    id: 'guardias', name: 'Guardias', type: 'income', color: '#14B8A6', icon: 'Clock',
    subcategories: [], isDefault: true,
  },
  {
    id: 'bizum', name: 'Bizum / Compartidos', type: 'income', color: '#0EA5E9', icon: 'Users',
    subcategories: ['Cenas', 'Viajes', 'Compras', 'Varios'], isDefault: true,
  },
  {
    id: 'otros_ingresos', name: 'Otros ingresos', type: 'income', color: '#A3E635', icon: 'PlusCircle',
    subcategories: ['Devolucion IRPF', 'Regalos', 'Varios'], isDefault: true,
  },
];

export const ALL_DEFAULT_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
