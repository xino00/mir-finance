# MIR Finance — Prompt Completo para Claude Artifact

## Descripcion del Proyecto

**MIR Finance** es una webapp de finanzas personales para medicos residentes (MIR) en Espana. Controla ingresos (nomina + guardias hospitalarias), gastos, compras con tarjeta de credito, inversiones, presupuestos y nominas. La interfaz esta completamente en **espanol** y todas las rutas usan nombres en espanol.

---

## Stack Tecnologico

- **React 19** + **TypeScript**
- **Vite 8** (bundler)
- **Tailwind CSS 4** (config via `@theme` en CSS, no tailwind.config)
- **react-router-dom** (HashRouter para GitHub Pages)
- **Recharts** para graficos
- **date-fns** para fechas
- **lucide-react** para iconos
- **nanoid** para IDs unicos
- **@supabase/supabase-js** para auth + sync (opcional)

---

## Tema de Colores (Tailwind 4 @theme)

```css
@theme {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  --color-surface-50: #f8fafc;
  --color-surface-100: #f1f5f9;
  --color-surface-200: #e2e8f0;
  --color-surface-300: #cbd5e1;
  --color-surface-400: #94a3b8;
  --color-surface-500: #64748b;
  --color-surface-600: #475569;
  --color-surface-700: #334155;
  --color-surface-800: #1e293b;
  --color-surface-900: #0f172a;
  --color-surface-950: #020617;
}
```

- **Primary:** azul (blue-500 base)
- **Surface:** slate para fondos, bordes y texto
- **Fondo claro:** `bg-surface-50`, **oscuro:** `bg-surface-950`
- **Tarjetas:** `bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-4 lg:p-5`
- **Fuente:** Inter, system-ui, sans-serif
- **Dark mode:** clase `.dark` en `<html>`

---

## Rutas (todas en espanol)

| Ruta | Pagina | Componente |
|------|--------|------------|
| `/` | Dashboard | `DashboardPage` |
| `/ingresos` | Ingresos (nomina + guardias) | `IncomePage` |
| `/gastos` | Gastos | `ExpensesPage` |
| `/tarjeta` | Tarjeta de credito | `CreditCardPage` |
| `/inversiones` | Inversiones | `InvestmentsPage` |
| `/presupuesto` | Presupuesto | `BudgetPage` |
| `/ajustes` | Ajustes | `SettingsPage` |

---

## Tipos de Datos

### Transaction
```typescript
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  date: string;          // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  isRecurring: boolean;
  recurringDay?: number;
  fromRecurringId?: string;
  createdAt: string;     // ISO
}

interface RecurringExpense {
  id: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  dayOfMonth: number;
}

interface MonthlyPayslip {
  month: string;         // YYYY-MM
  grossSalary: number;
  grossGuards: number;
  estimatedNet: number;
  actualNet?: number;
}
```

### GuardShift (Guardias hospitalarias)
```typescript
type ResidencyYear = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
type ShiftDuration = '12h' | '17h' | '24h';
type DayType = 'laborable' | 'festivo' | 'especial';
type ShiftModality = 'presencia_fisica' | 'localizada';

interface GuardShift {
  id: string;
  date: string;
  duration: ShiftDuration;
  dayType: DayType;
  modality: ShiftModality;
  residencyYear: ResidencyYear;
  grossAmount: number;
  notes?: string;
  createdAt: string;
}

interface GuardRateEntry {
  duration: ShiftDuration;
  dayType: DayType;
  rates: Record<ResidencyYear, number>;
}
```

### Investment
```typescript
interface InvestmentFund {
  id: string;
  fundName: string;
  isin: string;
  platform: string;
}

interface InvestmentEntry {
  id: string;
  fundId: string;
  date: string;
  shares: number;
  investedAmount: number;
  currentValue: number;
  type: 'buy' | 'sell' | 'valuation';
  createdAt: string;
}

interface PortfolioTarget {
  fundId: string;
  targetPercentage: number;
  label: string;
}
```

### CreditCardEntry
```typescript
type PaymentStatus = 'pendiente' | 'pagado' | 'vencido';

interface CreditCardEntry {
  id: string;
  description: string;
  amount: number;
  purchaseDate: string;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  createdAt: string;
}
```

### Budget
```typescript
interface BudgetCategory {
  category: string;
  monthlyLimit: number;
}

interface MonthlyBudget {
  month: string;
  categories: BudgetCategory[];
  savingsTarget: number;
}

interface EmergencyFundConfig {
  targetMonths: number;
  currentAmount: number;
}
```

### Settings
```typescript
interface SalaryTable {
  year: ResidencyYear;
  baseSalary: number;
  gradeComplement: number;
  totalMonthly: number;
  paymentsPerYear: number;
}

interface CategoryConfig {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color: string;
  subcategories: string[];
  isDefault: boolean;
}

interface AppSettings {
  currentResidencyYear: ResidencyYear;
  payDay: number;
  salaryTables: SalaryTable[];
  guardRates: GuardRateEntry[];
  categories: CategoryConfig[];
  investmentTargets: PortfolioTarget[];
  emergencyFund: EmergencyFundConfig;
  recurringExpenses: RecurringExpense[];
  theme: 'light' | 'dark' | 'system';
  lastExportDate?: string;
  googleSheetId?: string;
  googleSheetLastSync?: string;
  googleSheetSyncedRows?: number;
}
```

### AppState (estado global)
```typescript
interface AppState {
  transactions: Transaction[];
  guardShifts: GuardShift[];
  investmentFunds: InvestmentFund[];
  investmentEntries: InvestmentEntry[];
  creditCardEntries: CreditCardEntry[];
  monthlyBudgets: MonthlyBudget[];
  monthlyPayslips: MonthlyPayslip[];
  settings: AppSettings;
  version: number;
}
```

---

## Constantes Clave

### Tablas Salariales MIR (BOCAM 2026, 14 pagas)

| Ano | Salario Base | Complemento | Total Mensual |
|-----|-------------|-------------|---------------|
| R1 | 1387.24 | 138.31 | 1525.55 |
| R2 | 1387.24 | 249.29 | 1636.53 |
| R3 | 1387.24 | 388.01 | 1775.25 |
| R4 | 1387.24 | 526.74 | 1913.98 |
| R5 | 1387.24 | 665.46 | 2052.70 |

### Tarifas de Guardias (presencia fisica, bruto)

| Duracion | Tipo | R1 | R2 | R3 | R4/R5 |
|----------|------|-----|-----|-----|-------|
| 12h | Laborable | 150 | 180 | 209.88 | 239.88 |
| 17h | Laborable | 212.50 | 255 | 297.33 | 339.83 |
| 24h | Festivo | 356.88 | 416.64 | 476.40 | 535.92 |
| 24h | Especial | 713.76 | 833.28 | 952.80 | 1071.84 |

- **Localizada** = 50% de la tarifa de presencia fisica
- **Dias especiales:** 1 y 6 de enero + 24, 25 y 31 de diciembre (2025-2027)

### Categorias de Gastos por Defecto

| ID | Nombre | Color | Icono | Subcategorias |
|----|--------|-------|-------|---------------|
| vivienda | Vivienda | #3B82F6 | Home | Alquiler, Comunidad, Seguro hogar |
| suministros | Suministros | #F59E0B | Zap | Luz, Gas, Agua, Internet, Movil |
| alimentacion | Alimentacion | #10B981 | ShoppingCart | Supermercado, Comida fuera, Comida hospital |
| transporte | Transporte | #8B5CF6 | Train | Abono transporte, Taxi/VTC, Gasolina, Parking |
| suscripciones | Suscripciones | #EC4899 | Tv | Streaming, Software, Gimnasio, Otros |
| salud | Salud | #EF4444 | Heart | Farmacia, Dentista, Optica, Seguro medico |
| ocio | Ocio | #F97316 | Music | Restaurantes, Cine, Viajes, Compras |
| formacion | Formacion | #06B6D4 | BookOpen | Cursos, Libros, Congresos |
| profesional | Profesional | #84CC16 | Briefcase | Colegio Medicos, Seguro RC, Material |
| otros_gastos | Otros gastos | #6B7280 | MoreHorizontal | Regalos, Imprevistos, Varios |

### Categorias de Ingresos por Defecto

| ID | Nombre | Color | Icono |
|----|--------|-------|-------|
| nomina | Nomina | #22C55E | Banknote |
| guardias | Guardias | #14B8A6 | Clock |
| bizum | Bizum / Compartidos | #0EA5E9 | Users |
| otros_ingresos | Otros ingresos | #A3E635 | PlusCircle |

### Distribucion de Inversion por Defecto
- 75% Developed World
- 10% Emerging Markets
- 15% Cobas / Valor

---

## Calculadora de Neto (IRPF Madrid)

```typescript
const SS_RATE = 0.0635; // Contingencias comunes 4.70% + desempleo 1.55% + FP 0.10%

// Tramos IRPF 2025/2026 (estatal + autonomico Madrid)
const IRPF_BRACKETS = [
  { limit: 12450, rate: 0.18 },
  { limit: 17707, rate: 0.227 },
  { limit: 33007, rate: 0.278 },
  { limit: 53407, rate: 0.359 },
  { limit: 60000, rate: 0.43 },
  { limit: Infinity, rate: 0.47 },
];

const PERSONAL_MINIMUM = 5550;

function getWorkReduction(netAnnual: number): number {
  if (netAnnual <= 13115) return 6498;
  if (netAnnual <= 16825) return 2000;
  return 0;
}

function calculateAnnualIRPF(grossAnnual: number): number {
  const workReduction = getWorkReduction(grossAnnual);
  const taxableBase = Math.max(0, grossAnnual - PERSONAL_MINIMUM - workReduction);
  let tax = 0;
  let remaining = taxableBase;
  let prevLimit = 0;
  for (const bracket of IRPF_BRACKETS) {
    const bracketSize = bracket.limit - prevLimit;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevLimit = bracket.limit;
    if (remaining <= 0) break;
  }
  return tax;
}

function estimateMonthlyNet(grossMonthly: number, paymentsPerYear = 14): number {
  const grossAnnual = grossMonthly * paymentsPerYear;
  const ssMontly = grossMonthly * SS_RATE;
  const annualIRPF = calculateAnnualIRPF(grossAnnual - grossAnnual * SS_RATE);
  const irpfMonthly = annualIRPF / 12;
  return Math.round((grossMonthly - ssMontly - irpfMonthly) * 100) / 100;
}

function estimateExtraPayNet(grossSalary: number): number {
  const grossAnnual = grossSalary * 14;
  const marginalRate = getMarginalRate(grossAnnual - grossAnnual * SS_RATE);
  return Math.round(grossSalary * (1 - marginalRate - SS_RATE) * 100) / 100;
}

function estimatePayslipNet(grossSalary: number, grossGuards: number): number {
  const netSalary = estimateMonthlyNet(grossSalary);
  const grossAnnual = grossSalary * 14;
  const marginalRate = getMarginalRate(grossAnnual - grossAnnual * SS_RATE);
  const netGuards = grossGuards * (1 - marginalRate - SS_RATE);
  return Math.round((netSalary + netGuards) * 100) / 100;
}
```

**Reglas importantes:**
- Las pagas extras (junio/diciembre) usan `estimateExtraPayNet()` — NUNCA pasar `grossSalary * 2` a `estimateMonthlyNet`
- Las guardias se pagan un mes despues: la nomina de abril incluye las guardias de marzo
- La tasa marginal se aplica a las guardias

---

## Calculadora de Guardias

```typescript
function calculateGuardGross(
  duration: ShiftDuration,
  dayType: DayType,
  residencyYear: ResidencyYear,
  modality: ShiftModality,
): number {
  const entry = GUARD_SHIFT_RATES.find(
    (r) => r.duration === duration && r.dayType === dayType,
  );
  if (!entry) return 0;
  const gross = entry.rates[residencyYear];
  return modality === 'localizada' ? gross * 0.5 : gross;
}

function detectDayType(dateStr: string): DayType {
  if (SPECIAL_DATES_2026.includes(dateStr)) return 'especial';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = getDay(new Date(y, m - 1, d));
  if (dayOfWeek === 0 || dayOfWeek === 6) return 'festivo';
  return 'laborable';
}
```

---

## Componentes UI Reutilizables

### Card
```tsx
function Card({ children, className, title, action }) {
  // bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-4 lg:p-5
  // Titulo: text-sm font-semibold text-surface-700 dark:text-surface-300
}
```

### Button (variantes: primary, secondary, danger, ghost; tamanos: sm, md)
```tsx
const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
  ghost: 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
};
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
// Base: inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
```

### Modal
```tsx
// Backdrop: fixed inset-0 z-50 bg-black/40
// Panel: bg-white dark:bg-surface-900 w-full lg:max-w-lg lg:rounded-xl rounded-t-xl
// Header: p-4 border-b con titulo text-base font-semibold y boton X
// Body: p-4 overflow-y-auto flex-1
```

### Input
```tsx
// Label: text-xs font-medium text-surface-600 dark:text-surface-400
// Input: w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-surface-800
//        focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
```

### Select
```tsx
// Mismo estilo que Input, usa <select> con options
```

### Badge (variantes: success, warning, danger, neutral)
```tsx
const variants = {
  success: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  neutral: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
};
// Base: inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
```

### EmptyState
```tsx
// flex flex-col items-center justify-center py-12 text-center
// Icono: text-surface-300 dark:text-surface-600 mb-3
// Titulo: text-sm font-semibold text-surface-700 dark:text-surface-300
// Descripcion: text-xs text-surface-500 max-w-xs mb-4
```

---

## Estructura de Layout

```
Layout
  ├── Sidebar (solo desktop, lg:flex, w-56)
  │   ├── Logo "MIR Finance"
  │   └── NavLinks: /, /ingresos, /gastos, /tarjeta, /inversiones, /presupuesto, /ajustes
  ├── Main area (flex-1)
  │   ├── Header
  │   │   ├── Selector de mes (chevron izq/der + nombre mes)
  │   │   ├── Boton tema (Sun/Moon)
  │   │   └── AccountMenu (Google login + sync status)
  │   └── <Outlet /> (pagina actual)
  └── BottomNav (solo mobile, fixed bottom, 5 iconos + menu expandible)
```

---

## Gestion de Estado

- **AppContext** unico con `useAppContext()` hook
- Cada dominio tiene su propio reducer en `src/context/reducers/`
- Estado persistido a **localStorage** con `usePersistedReducer` (debounce 300ms)
- El contexto usa `useMemo` para evitar re-renders innecesarios
- **Sync opcional con Supabase:** push/pull del `AppState` completo como JSONB
- Cada reducer soporta acciones CRUD + `SET_*` para bulk-replace desde sync

---

## Helpers de Formateo

```typescript
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

function formatDate(dateStr: string): string {
  // "d MMM yyyy" con locale es → "6 abr 2026"
}

function formatMonth(monthStr: string): string {
  // "MMMM yyyy" con locale es → "abril 2026"
}

function currentMonth(): string {
  // "2026-04"
}

function currentDate(): string {
  // "2026-04-06"
}
```

---

## Paginas Principales — Resumen de Funcionalidad

### Dashboard (`/`)
- 4 tarjetas KPI: Ingresos, Gastos, Balance, Ahorro del mes
- Grafico de barras: ingresos vs gastos ultimos 6 meses
- Desglose de gastos por categoria (donut chart)
- Alertas de presupuesto (categorias por encima del 80%)
- Comparativa 3 meses
- Proyeccion de ahorro R1-R5

### Ingresos (`/ingresos`)
- 3 tabs: Nominas, Guardias, Transacciones
- **Nominas:** Estimacion neto con IRPF, campo para neto real, prediccion de proxima nomina
- **Guardias:** Formulario de alta con calendario, calculo automatico del bruto, tabla de guardias del mes
- **Transacciones:** Lista de ingresos con filtro por mes

### Gastos (`/gastos`)
- Lista de gastos del mes con filtro por categoria
- Gastos recurrentes (se generan automaticamente cada mes)
- Quick-add con cantidad rapida
- Importacion CSV (Revolut, Sabadell)
- Sincronizacion con Google Sheets/Forms
- Desglose por categoria con barra de progreso

### Tarjeta de Credito (`/tarjeta`)
- Entradas con estado: pendiente, pagado, vencido
- Soporte para compras a plazos
- Resumen de deuda pendiente y pagada del mes

### Inversiones (`/inversiones`)
- Cartera de fondos con PnL individual y global
- Grafico de donut: distribucion actual vs objetivo
- Calculadora de rebalanceo
- Sugerencia mensual de inversion (basada en ahorro, deuda, fondo de emergencia)
- Lookup automatico de fondos por ISIN

### Presupuesto (`/presupuesto`)
- Limites mensuales por categoria
- Objetivo de ahorro
- Barras de progreso gasto vs limite
- Alertas de categorias que superan el 80%

### Ajustes (`/ajustes`)
- Ano de residencia (R1-R5)
- Dia de cobro
- Tablas salariales editables
- Tarifas de guardias editables
- Gestion de categorias (agregar, editar, eliminar)
- Fondo de emergencia (meses objetivo, cantidad actual)
- Objetivos de inversion
- Tema (claro, oscuro, sistema)
- Export/Import JSON

---

## Patrones de Diseno CSS

### KPI Cards (patron comun en Dashboard y varias paginas)
```tsx
<Card>
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-surface-500 dark:text-surface-400 truncate">Label</p>
      <p className="text-lg font-bold mt-0.5 text-green-600 dark:text-green-400">Valor</p>
    </div>
  </div>
</Card>
```

### Tablas
```tsx
<div className="overflow-x-auto -mx-4 lg:-mx-5">
  <table className="w-full text-xs">
    <thead>
      <tr className="border-b border-surface-200 dark:border-surface-700">
        <th className="text-left px-4 py-2 font-medium text-surface-500 dark:text-surface-400">...</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
      <tr>
        <td className="px-4 py-2.5 text-surface-800 dark:text-surface-200">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Formularios en Modales
```tsx
<Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Titulo">
  <div className="space-y-4">
    <Input label="Campo" value={value} onChange={...} />
    <Select label="Selector" options={[...]} value={value} onChange={...} />
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="secondary" onClick={close}>Cancelar</Button>
      <Button onClick={save}>Guardar</Button>
    </div>
  </div>
</Modal>
```

### Tabs
```tsx
<div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-200 shadow-sm'
          : 'text-surface-500 hover:text-surface-700 dark:text-surface-400'
      }`}
    >
      {tab}
    </button>
  ))}
</div>
```

### Grid Responsivo
```tsx
// KPIs: grid grid-cols-2 lg:grid-cols-4 gap-4
// Cards: grid grid-cols-1 lg:grid-cols-2 gap-4
// Forms: grid grid-cols-2 gap-4 (campos lado a lado)
```

---

## Supabase Integration (Opcional)

- Auth con Google OAuth via `supabase.auth.signInWithOAuth`
- Sync bidireccional: push/pull del AppState completo como JSONB en tabla `user_data`
- RLS: cada usuario solo accede a su propia fila (`auth.uid() = user_id`)
- Auto-push con debounce de 2 segundos al cambiar estado
- Pull al hacer login (una vez por sesion)
- Re-pull automatico si el usuario vuelve al tab despues de 5+ minutos
- UI: AccountMenu en el Header con estado de sync (Cloud/CloudOff/Spinner)

---

## Contexto de Dominio

1. Los anos de residencia R1-R5 afectan salario y tarifas de guardia
2. `settings.currentResidencyYear` es el driver principal de calculos
3. Las guardias se tipifican por dia (laborable/festivo/especial), duracion (12h/17h/24h), y modalidad (presencia_fisica/localizada)
4. El neto usa 6 tramos IRPF combinados (estatal + Madrid), con reduccion por rendimientos del trabajo y tipo marginal para guardias
5. Las guardias se pagan un mes despues: la nomina de abril incluye las guardias de marzo
6. Las pagas extras (junio/diciembre) tienen calculo separado con `estimateExtraPayNet()`
7. `settings.salaryTables` y `settings.guardRates` son editables por el usuario
8. Moneda: EUR, formato espanol (1.234,56 EUR)
9. Fechas en formato espanol (6 abr 2026)
