import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, "d MMM yyyy", { locale: es });
}

export function formatMonth(monthStr: string): string {
  const date = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
  return format(date, "MMMM yyyy", { locale: es });
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function currentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
