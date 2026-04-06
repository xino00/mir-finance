export type PaymentStatus = 'pendiente' | 'pagado' | 'vencido';

export interface CreditCardEntry {
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
