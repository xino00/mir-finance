import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import { useState } from 'react';
import { currentMonth } from '../../utils/formatters';

export default function Layout() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-16 lg:pb-0">
        <Header selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <Outlet context={{ selectedMonth, setSelectedMonth }} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
