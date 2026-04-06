import { lookupISIN as lookupStatic } from '../constants/isin-catalog';

export interface ISINResult {
  name: string;
  type: string; // 'Mutual Fund' | 'ETF' | 'Common Stock' | etc.
  currency: string;
  exchange: string;
}

/**
 * Look up fund info by ISIN using Twelve Data API (free, CORS-friendly).
 * Falls back to static catalog if API fails.
 */
export async function lookupISINOnline(isin: string): Promise<ISINResult | null> {
  const normalized = isin.trim().toUpperCase();
  if (normalized.length < 12) return null;

  // Try Twelve Data API first
  try {
    const res = await fetch(
      `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(normalized)}`,
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        // Prefer EUR-denominated result if available
        const eurResult = json.data.find(
          (d: { currency: string }) => d.currency === 'EUR',
        );
        const best = eurResult || json.data[0];
        return {
          name: best.instrument_name,
          type: best.instrument_type,
          currency: best.currency,
          exchange: best.exchange,
        };
      }
    }
  } catch {
    // API failed, fall through to static catalog
  }

  // Fallback: static catalog
  const staticResult = lookupStatic(normalized);
  if (staticResult) {
    return {
      name: staticResult.name,
      type: 'Fund',
      currency: 'EUR',
      exchange: staticResult.platform,
    };
  }

  return null;
}
