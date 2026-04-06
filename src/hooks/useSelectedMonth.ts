import { useOutletContext } from 'react-router-dom';

interface MonthContext {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
}

export function useSelectedMonth(): MonthContext {
  return useOutletContext<MonthContext>();
}
