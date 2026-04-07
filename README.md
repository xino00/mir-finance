# MIR Finance

Aplicación web de finanzas personales para médicos internos residentes (MIR) en España. Controla ingresos, guardias, gastos, tarjeta de crédito, inversiones y presupuesto con cálculos adaptados al sistema retributivo MIR (tablas BOCAM 2026, IRPF Madrid).

Desplegada en GitHub Pages: [xino00.github.io/mir-finance](https://xino00.github.io/mir-finance/)

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19, TypeScript 5.9, Tailwind CSS 4 |
| Build | Vite 8 |
| Routing | React Router 7 (HashRouter) |
| Gráficos | Recharts 3 |
| Fechas | date-fns 4 |
| Iconos | lucide-react |
| Backend (opcional) | Supabase (Auth + PostgreSQL) |
| PWA | Service Worker (network-first), Web App Manifest |

---

## Funcionalidades

### Dashboard (`/`)
- KPIs mensuales: ingresos, gastos, ahorro, tasa de ahorro
- Gráfico de gastos por categoría (donut)
- Evolución de los últimos 6 meses (barras: ingresos vs gastos)
- Proyección de ahorro a 12 meses (área, media móvil de 3 meses)
- Alertas de presupuesto (80% y 100% de límite)
- Comparativa de categorías vs media de 3 meses
- FAB de gasto rápido (móvil)

### Ingresos (`/ingresos`)
- **Nómina estimada**: desglose bruto (salario base + complemento de grado), cálculo de neto via IRPF + SS Madrid
- **Nómina real**: campo para introducir el neto del recibo de sueldo y ver la diferencia vs estimado
- **Predicción**: calcula el neto del siguiente mes según las guardias del mes actual
- **Guardias**: CRUD completo. Registra fecha, tipo de día (laborable / festivo / especial), duración (12h/17h/24h) y modalidad (presencia física / localizada). Cálculo del bruto en tiempo real
- **Calendario de guardias**: vista mensual con días coloreados por tipo, importes y acceso directo a edición
- Ingresos extra manuales (Bizum, devoluciones, etc.)

### Gastos (`/gastos`)
- Resumen mensual: total, fijos y variables
- Añadir gasto rápido inline (importe, categoría, descripción)
- Gastos fijos recurrentes: se generan automáticamente cada mes (alquiler, suscripciones, etc.)
- CRUD completo con categoría, subcategoría, fecha y descripción
- Sincronización con Google Forms/Sheets: importa gastos nuevos desde una hoja de cálculo publicada

### Tarjeta de crédito (`/tarjeta`)
- KPIs: total pendiente y próximo vencimiento
- Registro de cargos con soporte de pagos a plazos (cuotas)
- Estado automático: pendiente / pagado / vencido
- Marcar como pagado con fecha
- Plan de pago: calendario de vencimientos y recomendación de estrategia

### Inversiones (`/inversiones`)
- KPIs de cartera: invertido, valor actual, PnL absoluto y porcentual
- Gestión de fondos con búsqueda de nombre por ISIN (API Twelve Data + catálogo estático de 40+ fondos)
- Operaciones por fondo: compra, venta, valoración
- Distribución de cartera: gráfico de doble anillo (real vs objetivo)
- Sugerencia de cuánto invertir según ahorro del mes y deudas pendientes
- Calculadora de rebalanceo: dado un importe a invertir, reparte por fondo según asignación objetivo

### Presupuesto (`/presupuesto`)
- Límites mensuales por categoría con barras de progreso (verde / ámbar / rojo)
- Alertas visuales para categorías al límite o superadas
- Proyección de ahorro acumulado (6 meses, barras)
- Fondo de emergencia: importe actual, objetivo en meses de gastos, progreso
- Proyección R1 a R5: tabla y gráfico de área del ahorro acumulado a lo largo de la residencia, con inflación del 3% y pagas extras

### Ajustes (`/ajustes`)
- Año de residencia actual (R1-R5)
- Día de cobro de nómina
- Tema: claro / oscuro / sistema
- Tablas salariales BOCAM 2026 (solo visualización)
- Tasas de guardia por año y tipo (solo visualización)
- Gestión de categorías de gasto e ingreso (CRUD, colores, subcategorías)
- Integración Google Forms/Sheets: configurar ID de hoja
- Importación CSV bancario: Revolut, Sabadell, genérico
- Exportar/importar JSON de copia de seguridad completa

### Cloud sync (Supabase)
- Google OAuth con flujo PKCE
- Sincronización automática (debounce de 2 s tras cada cambio)
- Pull al iniciar sesión y al volver al tab tras 5+ minutos
- Sincronización manual desde el menú de cuenta
- Indicador visual de estado: sincronizado / sincronizando / error
- Sin Supabase configurado, la app funciona igual con localStorage únicamente

---

## Dominio MIR

El cálculo de neto usa los **tramos combinados IRPF estatal + autonómico Madrid**:

| Tramo bruto anual | Tipo |
|---|---|
| Hasta 12.450 € | 18 % |
| 12.450 – 17.707 € | 22,7 % |
| 17.707 – 33.007 € | 27,8 % |
| 33.007 – 53.407 € | 35,9 % |
| 53.407 – 60.000 € | 43 % |
| Más de 60.000 € | 47 % |

Seguridad Social: 6,35 % sobre el bruto. Se aplica reducción por rendimientos del trabajo.

**Guardias**: se pagan un mes después (guardias de marzo → nómina de abril). La app aplica este desfase automáticamente. Las guardias localizadas cobran el 50 % de la tarifa de presencia física. Los días especiales (1 ene, 6 ene, 24/25/31 dic) tienen tarifa propia definida en `src/constants/guard-rates.ts` para 2025-2027.

**Pagas extras**: junio y diciembre. El cálculo usa `estimateExtraPayNet()` por separado; nunca se multiplica el bruto mensual × 2 para estimar el neto.

---

## Arquitectura

### Estado
- **Sin librería externa**: React Context + `useReducer` para cada dominio de datos
- **7 reducers**: transacciones, guardias, tarjeta, inversiones (fondos + entradas), presupuestos, nóminas, ajustes
- **Persistencia**: `usePersistedReducer` — escribe en localStorage con debounce de 300 ms
- **Sync Supabase**: un blob JSONB por usuario en tabla `user_data`. El estado entero se sube/baja como un documento. RLS garantiza aislamiento por `auth.uid()`

### Routing
- `HashRouter` (URLs tipo `/#/gastos`) para compatibilidad con GitHub Pages sin redirecciones de servidor
- Base path: `/mir-finance/`
- El mes seleccionado se comparte entre páginas vía `Outlet context`

### PWA
- Service worker con estrategia network-first
- Cachea la app completa; excluye Google Sheets, Supabase y callbacks OAuth
- Instalable en Android, iOS y escritorio

---

## Estructura de carpetas

```
src/
├── components/
│   ├── dashboard/       # DashboardPage
│   ├── income/          # IncomePage (nómina + guardias + calendario)
│   ├── expenses/        # ExpensesPage
│   ├── credit-card/     # CreditCardPage
│   ├── investments/     # InvestmentsPage
│   ├── budget/          # BudgetPage
│   ├── settings/        # SettingsPage
│   ├── layout/          # Layout, Sidebar, Header, BottomNav, AccountMenu
│   └── ui/              # Card, Button, Modal, Input, Select, Badge, EmptyState
├── context/
│   ├── AppContext.tsx    # Contexto global + composición de reducers
│   ├── AuthContext.tsx   # Google OAuth + sesión Supabase
│   └── reducers/        # Un archivo por dominio
├── hooks/
│   ├── usePersistedReducer.ts
│   ├── useSync.ts
│   ├── useTheme.ts
│   └── useSelectedMonth.ts
├── lib/
│   ├── supabase.ts       # Cliente Supabase + isSupabaseConfigured()
│   ├── sync.ts           # pushToSupabase / pullFromSupabase
│   └── database.types.ts # Tipos generados por Supabase CLI
├── utils/
│   ├── net-calculator.ts # Cálculo neto IRPF + SS
│   ├── guard-calculator.ts
│   ├── csv-import.ts     # Revolut, Sabadell, genérico
│   ├── google-sheets.ts
│   ├── isin-lookup.ts
│   ├── export-import.ts
│   ├── formatters.ts
│   └── storage.ts
├── constants/
│   ├── salary-tables.ts  # BOCAM 2026
│   ├── guard-rates.ts    # Tarifas + días especiales 2025-2027
│   ├── categories.ts     # Categorías por defecto
│   └── investment-targets.ts
└── types/
    └── index.ts          # Tipos globales + barrel export
```

---

## Setup local

```bash
git clone https://github.com/xino00/mir-finance.git
cd mir-finance
npm install
npm run dev
```

La app funciona sin Supabase. Para activar auth y sync en la nube, crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Ver `.env.example` como referencia.

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check + build de producción |
| `npm run lint` | ESLint |
| `npm run preview` | Preview del build en local |
| `npm run db:push` | Aplica migraciones Supabase al proyecto remoto |
| `npm run db:types` | Regenera `src/lib/database.types.ts` desde el esquema Supabase |

---

## Deployment

El repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que:

1. Se dispara en cada push a `main`
2. Ejecuta `npm ci && npm run build` (con las vars de Supabase inyectadas desde Secrets)
3. Publica la carpeta `dist/` en GitHub Pages

La app usa `HashRouter` y `base: '/mir-finance/'` en `vite.config.ts`, por lo que no requiere configuración adicional de redirecciones en el servidor.

---

## Configuración Supabase

Esquema mínimo (ver `supabase/migrations/20260406000000_initial_schema.sql`):

```sql
create table public.user_data (
  user_id    uuid references auth.users(id) on delete cascade primary key,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
-- Políticas RLS: SELECT/INSERT/UPDATE/DELETE solo para auth.uid() = user_id
```

En el panel de Supabase, añadir `https://xino00.github.io/mir-finance/` como URL de redireccionamiento OAuth autorizada.

---

## Uso sin cuenta

Sin las variables de entorno de Supabase, toda la interfaz de autenticación y sync queda oculta. Los datos se guardan únicamente en `localStorage` del navegador con el prefijo `mir-finance-`. Se puede exportar/importar un JSON de respaldo desde Ajustes en cualquier momento.
