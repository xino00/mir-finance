// Catalog of common investment funds available on MyInvestor and Spanish platforms
// Used to auto-identify funds by ISIN

export interface FundInfo {
  isin: string;
  name: string;
  category: string;
  platform: string;
}

export const ISIN_CATALOG: FundInfo[] = [
  // --- Vanguard (MyInvestor) ---
  { isin: 'IE00B03HCZ61', name: 'Vanguard Global Stock Index Fund', category: 'Developed Markets', platform: 'MyInvestor' },
  { isin: 'IE00B03HD191', name: 'Vanguard European Stock Index Fund', category: 'Europe', platform: 'MyInvestor' },
  { isin: 'IE0007987690', name: 'Vanguard U.S. 500 Stock Index Fund', category: 'USA', platform: 'MyInvestor' },
  { isin: 'IE0031786142', name: 'Vanguard Emerging Markets Stock Index Fund', category: 'Emerging Markets', platform: 'MyInvestor' },
  { isin: 'IE0007472990', name: 'Vanguard Japan Stock Index Fund', category: 'Japan', platform: 'MyInvestor' },
  { isin: 'IE00B50MZ724', name: 'Vanguard Eurozone Stock Index Fund', category: 'Eurozone', platform: 'MyInvestor' },
  { isin: 'IE00B945VN12', name: 'Vanguard FTSE Developed World UCITS ETF', category: 'Developed Markets', platform: 'MyInvestor' },
  { isin: 'IE0009591803', name: 'Vanguard Global Bond Index Fund', category: 'Global Bonds', platform: 'MyInvestor' },
  { isin: 'IE00BGCZ0933', name: 'Vanguard ESG Developed World All Cap Equity Index Fund', category: 'ESG', platform: 'MyInvestor' },
  { isin: 'IE00B18GC888', name: 'Vanguard Euro Government Bond Index Fund', category: 'Euro Bonds', platform: 'MyInvestor' },
  { isin: 'IE00BKX55S42', name: 'Vanguard Global Small-Cap Index Fund', category: 'Small-Cap', platform: 'MyInvestor' },
  { isin: 'IE00BFPM9N11', name: 'Vanguard Global Stock Index Fund (Acc EUR Hedged)', category: 'Developed Hedged', platform: 'MyInvestor' },

  // --- iShares (MyInvestor / varios) ---
  { isin: 'IE00B4L5Y983', name: 'iShares Core MSCI World UCITS ETF', category: 'Developed Markets', platform: 'MyInvestor' },
  { isin: 'IE00BKM4GZ66', name: 'iShares Core EM IMI UCITS ETF', category: 'Emerging Markets', platform: 'MyInvestor' },
  { isin: 'IE00B5BMR087', name: 'iShares Core S&P 500 UCITS ETF', category: 'USA', platform: 'MyInvestor' },
  { isin: 'IE00B4L5YC18', name: 'iShares MSCI EM UCITS ETF', category: 'Emerging Markets', platform: 'MyInvestor' },
  { isin: 'IE00B0M62Q58', name: 'iShares MSCI World UCITS ETF', category: 'Developed Markets', platform: 'MyInvestor' },

  // --- Amundi / Lyxor (MyInvestor) ---
  { isin: 'LU0996182563', name: 'Amundi Index MSCI World AE-C', category: 'Developed Markets', platform: 'MyInvestor' },
  { isin: 'LU0996177134', name: 'Amundi Index S&P 500 AE-C', category: 'USA', platform: 'MyInvestor' },
  { isin: 'LU0996176684', name: 'Amundi Index MSCI Europe AE-C', category: 'Europe', platform: 'MyInvestor' },
  { isin: 'LU0996177571', name: 'Amundi Index MSCI Emerging Markets AE-C', category: 'Emerging Markets', platform: 'MyInvestor' },
  { isin: 'LU1437016972', name: 'Amundi Index MSCI Japan AE-C', category: 'Japan', platform: 'MyInvestor' },
  { isin: 'LU0389812693', name: 'Amundi MSCI Emerging Markets UCITS ETF', category: 'Emerging Markets', platform: 'MyInvestor' },

  // --- Fidelity (MyInvestor) ---
  { isin: 'IE00BYX5NX33', name: 'Fidelity MSCI World Index Fund P-ACC-EUR', category: 'Developed Markets', platform: 'MyInvestor' },
  { isin: 'IE00BYX5M476', name: 'Fidelity S&P 500 Index Fund P-ACC-EUR', category: 'USA', platform: 'MyInvestor' },

  // --- Cobas ---
  { isin: 'ES0119184002', name: 'Cobas Seleccion FI', category: 'Value Global', platform: 'MyInvestor' },
  { isin: 'ES0119199000', name: 'Cobas Internacional FI', category: 'Value Internacional', platform: 'MyInvestor' },
  { isin: 'ES0119184036', name: 'Cobas Grandes Companias FI', category: 'Value Large Cap', platform: 'MyInvestor' },
  { isin: 'ES0114638036', name: 'Cobas Iberia FI', category: 'Value Iberia', platform: 'MyInvestor' },

  // --- AzValor ---
  { isin: 'ES0112611001', name: 'AzValor Internacional FI', category: 'Value Internacional', platform: 'MyInvestor' },
  { isin: 'ES0112611019', name: 'AzValor Iberia FI', category: 'Value Iberia', platform: 'MyInvestor' },
  { isin: 'ES0112611035', name: 'AzValor Blue Chips FI', category: 'Value Large Cap', platform: 'MyInvestor' },

  // --- Baelo ---
  { isin: 'ES0113728002', name: 'Baelo Patrimonio FI', category: 'Mixto Global', platform: 'MyInvestor' },
  { isin: 'ES0113728036', name: 'Baelo Dividendo Creciente FI', category: 'Dividendo Global', platform: 'MyInvestor' },

  // --- Indexa Capital / Otros ---
  { isin: 'IE00BG47KH54', name: 'Vanguard Global Stock Index Institutional Plus', category: 'Developed Markets', platform: 'Indexa Capital' },
  { isin: 'LU0599946893', name: 'Pictet-Global Megatrend Selection', category: 'Megatrends', platform: 'MyInvestor' },

  // --- MyInvestor fondos propios ---
  { isin: 'ES0165242019', name: 'MyInvestor Cartera Permanente FI', category: 'Cartera Permanente', platform: 'MyInvestor' },
  { isin: 'ES0148396015', name: 'MyInvestor Value FI', category: 'Value Global', platform: 'MyInvestor' },
  { isin: 'ES0165242001', name: 'MyInvestor Indexado Global FI', category: 'Indexado Global', platform: 'MyInvestor' },

  // --- ETFs populares ---
  { isin: 'IE00BK5BQT80', name: 'Vanguard FTSE All-World UCITS ETF (Acc)', category: 'All-World', platform: 'Varios' },
  { isin: 'IE00B3RBWM25', name: 'Vanguard FTSE All-World UCITS ETF (Dist)', category: 'All-World', platform: 'Varios' },
  { isin: 'IE00BKX55T58', name: 'Vanguard S&P 500 UCITS ETF', category: 'USA', platform: 'Varios' },
  { isin: 'IE00BK5BQV03', name: 'Vanguard FTSE Developed World UCITS ETF (Acc)', category: 'Developed Markets', platform: 'Varios' },
  { isin: 'IE00B3VVMM84', name: 'Vanguard FTSE Emerging Markets UCITS ETF', category: 'Emerging Markets', platform: 'Varios' },
  { isin: 'IE00BF4RFH31', name: 'iShares Core MSCI World UCITS ETF (Acc)', category: 'Developed Markets', platform: 'Varios' },
];

/**
 * Look up fund info by ISIN (case-insensitive)
 */
export function lookupISIN(isin: string): FundInfo | undefined {
  const normalized = isin.trim().toUpperCase();
  if (normalized.length < 12) return undefined;
  return ISIN_CATALOG.find((f) => f.isin === normalized);
}
