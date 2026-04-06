# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MIR Finance is a personal finance web app for Spanish medical residents (MIR). It tracks income (salary + hospital guard shifts), expenses, credit card purchases, investments, budgets, and payslips. The UI is in Spanish and all routes use Spanish names.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — type-check with `tsc -b` then build with Vite
- `npm run lint` — run ESLint across the project
- `npm run preview` — preview the production build locally
- `npm run db:push` — push Supabase migrations to remote
- `npm run db:types` — regenerate `src/lib/database.types.ts` from Supabase schema

No test framework is configured.

## Architecture

**Stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, react-router-dom (HashRouter), Recharts for charts, date-fns for dates, lucide-react for icons, @supabase/supabase-js for auth + sync.

**State management:** Single `AppContext` (`src/context/AppContext.tsx`) provides all app state via `useAppContext()`. Each data domain has its own reducer in `src/context/reducers/`. State is persisted to localStorage automatically through `usePersistedReducer` (debounced 300ms writes). The context value is memoized with `useMemo` to avoid unnecessary re-renders.

**Data domains and their reducers:**
- Transactions (income/expenses) — `transactions.reducer.ts`
- Guard shifts (hospital shifts) — `guard-shifts.reducer.ts`
- Investment funds & entries — `investments.reducer.ts` (has both `SET_FUNDS` and `SET_ENTRIES` bulk-replace actions)
- Credit card entries — `credit-card.reducer.ts`
- Monthly budgets — `budgets.reducer.ts`
- Payslips — `payslips.reducer.ts`
- App settings (residency year, pay day, salary tables, categories, theme) — `settings.reducer.ts`

**Routing:** `src/App.tsx` defines routes under a shared `Layout`. Routes: `/` (dashboard), `/ingresos`, `/gastos`, `/tarjeta`, `/inversiones`, `/presupuesto`, `/ajustes`. Unknown routes redirect to `/`.

**Key patterns:**
- Types live in `src/types/` with barrel export via `index.ts`
- Constants (salary tables, guard rates, categories, investment targets) in `src/constants/`
- Utility functions in `src/utils/`: net salary calculator, formatters, CSV import, Google Sheets integration, export/import
- Reusable UI primitives (Card, Button, Modal, Input, Select, Badge, EmptyState) in `src/components/ui/`
- Each page is a single large component in `src/components/<domain>/`

**Supabase integration (optional):**
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. Without them, the app works identically using only localStorage.
- `src/lib/supabase.ts` — Supabase client + `isSupabaseConfigured()` guard
- `src/lib/sync.ts` — `pushToSupabase` / `pullFromSupabase` store the full `AppState` as a single JSONB row per user in the `user_data` table
- `src/context/AuthContext.tsx` — Google OAuth via `useAuth()` hook; wraps the app in `main.tsx`
- `src/hooks/useSync.ts` — pulls data on login, auto-pushes on state change (2s debounce)
- `src/components/layout/AccountMenu.tsx` — login/logout button + sync status in the header
- DB schema: `supabase/migrations/20260406000000_initial_schema.sql`

**Deployment:** Built for GitHub Pages with `base: '/mir-finance/'` in `vite.config.ts`. Uses HashRouter for SPA compatibility.

## Domain Context

- Residency years R1–R5 affect salary and guard rates; `settings.currentResidencyYear` drives calculations
- Guard shifts are typed by day (laborable/festivo/especial), duration (12h/17h/24h), and modality (presencia_fisica/localizada). Special dates are defined in `src/constants/guard-rates.ts` for 2025–2027.
- Net salary (`src/utils/net-calculator.ts`) uses 6-bracket combined Madrid IRPF rates, conditional work reduction, and marginal rate for guards. Extra pay months (June/December) use `estimateExtraPayNet()` separately — never pass `grossSalary * 2` to `estimateMonthlyNet`.
- Guards are paid one month later: April payslip includes March guard shifts. The income page uses `previousMonthKey` for this offset, and the prediction card uses `monthShiftGross` (current month) to predict next month's payslip.
- `settings.salaryTables` and `settings.guardRates` are user-configurable overrides of the BOCAM 2026 defaults.
