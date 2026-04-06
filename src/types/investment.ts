export interface InvestmentFund {
  id: string;
  fundName: string;
  isin: string;
  platform: string;
}

export interface InvestmentEntry {
  id: string;
  fundId: string;
  date: string;
  shares: number;
  investedAmount: number;
  currentValue: number;
  type: 'buy' | 'sell' | 'valuation';
  createdAt: string;
}

export interface PortfolioTarget {
  fundId: string;
  targetPercentage: number;
  label: string;
}
