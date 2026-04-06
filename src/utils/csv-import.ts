// CSV import utilities for Revolut and Sabadell bank statements

export interface CsvTransaction {
  date: string; // YYYY-MM-DD
  amount: number; // positive = expense amount
  description: string;
  type: 'income' | 'expense';
  source: 'revolut' | 'sabadell' | 'unknown';
}

/**
 * Auto-detect bank format and parse CSV content
 */
export function parseBankCsv(content: string): CsvTransaction[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) throw new Error('El archivo CSV esta vacio o no tiene datos.');

  const header = lines[0].toLowerCase();

  if (header.includes('product') && header.includes('completed date')) {
    return parseRevolutCsv(lines);
  }

  if (header.includes('fecha') && (header.includes('concepto') || header.includes('importe'))) {
    return parseSabadellCsv(lines);
  }

  // Try generic: look for date, amount, description patterns
  return parseGenericCsv(lines);
}

/**
 * Revolut CSV format:
 * Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
 */
function parseRevolutCsv(lines: string[]): CsvTransaction[] {
  const results: CsvTransaction[] = [];
  const headers = parseCsvLine(lines[0]);

  const descIdx = headers.findIndex((h) => h.toLowerCase() === 'description');
  const amountIdx = headers.findIndex((h) => h.toLowerCase() === 'amount');
  const dateIdx = headers.findIndex((h) => h.toLowerCase().includes('completed date'));
  const stateIdx = headers.findIndex((h) => h.toLowerCase() === 'state');

  if (amountIdx === -1 || dateIdx === -1) {
    throw new Error('No se reconocen las columnas del CSV de Revolut.');
  }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);

    // Skip non-completed transactions
    if (stateIdx >= 0 && cols[stateIdx]?.toLowerCase() !== 'completed') continue;

    const rawAmount = parseFloat(cols[amountIdx]?.replace(',', '.') ?? '0');
    if (rawAmount === 0) continue;

    const rawDate = cols[dateIdx] ?? '';
    const date = parseDate(rawDate);
    if (!date) continue;

    results.push({
      date,
      amount: Math.abs(rawAmount),
      description: cols[descIdx] ?? '',
      type: rawAmount < 0 ? 'expense' : 'income',
      source: 'revolut',
    });
  }

  return results;
}

/**
 * Sabadell CSV format (common):
 * Fecha;Fecha valor;Concepto;Importe;Saldo
 * or: Fecha,Concepto,Importe,Divisa,Saldo
 */
function parseSabadellCsv(lines: string[]): CsvTransaction[] {
  const results: CsvTransaction[] = [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  const dateIdx = headers.findIndex((h) => h === 'fecha');
  const descIdx = headers.findIndex((h) => h === 'concepto' || h === 'descripcion');
  const amountIdx = headers.findIndex((h) => h === 'importe' || h === 'cantidad');

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('No se reconocen las columnas del CSV de Sabadell.');
  }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/"/g, ''));

    const rawAmount = parseFloat(cols[amountIdx]?.replace('.', '').replace(',', '.') ?? '0');
    if (rawAmount === 0) continue;

    const date = parseDate(cols[dateIdx] ?? '');
    if (!date) continue;

    results.push({
      date,
      amount: Math.abs(rawAmount),
      description: cols[descIdx] ?? '',
      type: rawAmount < 0 ? 'expense' : 'income',
      source: 'sabadell',
    });
  }

  return results;
}

/**
 * Generic CSV fallback
 */
function parseGenericCsv(lines: string[]): CsvTransaction[] {
  const results: CsvTransaction[] = [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  // Try to find date, amount, description columns
  const dateIdx = headers.findIndex((h) => h.includes('fecha') || h.includes('date'));
  const amountIdx = headers.findIndex((h) => h.includes('importe') || h.includes('amount') || h.includes('cantidad'));
  const descIdx = headers.findIndex((h) => h.includes('concepto') || h.includes('description') || h.includes('descripcion'));

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('No se pudo detectar el formato del CSV. Se esperan columnas: Fecha, Importe, Concepto/Descripcion.');
  }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/"/g, ''));

    const rawAmount = parseFloat(cols[amountIdx]?.replace('.', '').replace(',', '.') ?? '0');
    if (rawAmount === 0) continue;

    const date = parseDate(cols[dateIdx] ?? '');
    if (!date) continue;

    results.push({
      date,
      amount: Math.abs(rawAmount),
      description: cols[descIdx] ?? '',
      type: rawAmount < 0 ? 'expense' : 'income',
      source: 'unknown',
    });
  }

  return results;
}

/**
 * Parse various date formats to YYYY-MM-DD
 */
function parseDate(raw: string): string | null {
  const s = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  // YYYY/MM/DD or YYYY.MM.DD (slash/dot separators)
  const mdy = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (mdy) return `${mdy[1]}-${mdy[2].padStart(2, '0')}-${mdy[3].padStart(2, '0')}`;

  return null;
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === ',' || ch === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
