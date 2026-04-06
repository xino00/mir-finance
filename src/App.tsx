import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './components/dashboard/DashboardPage';
import IncomePage from './components/income/IncomePage';
import ExpensesPage from './components/expenses/ExpensesPage';
import CreditCardPage from './components/credit-card/CreditCardPage';
import InvestmentsPage from './components/investments/InvestmentsPage';
import BudgetPage from './components/budget/BudgetPage';
import SettingsPage from './components/settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="ingresos" element={<IncomePage />} />
        <Route path="gastos" element={<ExpensesPage />} />
        <Route path="tarjeta" element={<CreditCardPage />} />
        <Route path="inversiones" element={<InvestmentsPage />} />
        <Route path="presupuesto" element={<BudgetPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
