// Fetch and parse data from a published Google Sheet (via Google Visualization API)
// The Sheet must be "Published to the web" (File → Share → Publish to web)

export interface SheetRow {
  timestamp: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

/**
 * Fetches rows from a published Google Sheet.
 * The Sheet columns must be: Marca temporal | Importe | Categoría | Descripción | Fecha
 */
export async function fetchGoogleSheet(sheetId: string): Promise<SheetRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('No se pudo acceder a la hoja. Verifica que esta publicada en la web.');
  }

  const text = await res.text();

  // Response is wrapped: google.visualization.Query.setResponse({...});
  // Extract the JSON object
  const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?\s*$/s);
  if (!match) {
    throw new Error('Formato de respuesta inesperado. Verifica el ID de la hoja.');
  }

  const data = JSON.parse(match[1]);

  if (data.status === 'error') {
    throw new Error(data.errors?.[0]?.detailed_message ?? 'Error al leer la hoja');
  }

  const table = data.table;
  if (!table?.rows?.length) return [];

  const rows: SheetRow[] = [];

  for (const row of table.rows) {
    const cells = row.c;
    if (!cells || !cells[1]) continue; // Skip empty rows

    // Column 0: Timestamp (auto from Google Forms) - formatted as "Date(y,m,d,h,min,s)"
    // Column 1: Importe (number)
    // Column 2: Categoría (string)
    // Column 3: Descripción (string)
    // Column 4: Fecha (date or string)

    const timestamp = parseGvizValue(cells[0]);
    const amount = cells[1]?.v != null ? Number(cells[1].v) : 0;
    const category = cells[2]?.v ?? '';
    const description = cells[3]?.v ?? '';
    const dateVal = parseGvizDate(cells[4]) || parseGvizDate(cells[0]) || new Date().toISOString().slice(0, 10);

    if (amount > 0) {
      rows.push({
        timestamp: String(timestamp),
        amount,
        category,
        description,
        date: dateVal,
      });
    }
  }

  return rows;
}

function parseGvizValue(cell: { v?: string; f?: string } | null): string {
  if (!cell) return '';
  return cell.f ?? String(cell.v ?? '');
}

function parseGvizDate(cell: { v?: string; f?: string } | null): string | null {
  if (!cell || cell.v == null) return null;

  const v = String(cell.v);

  // Google Viz dates come as "Date(2026,3,6,12,30,0)" (month is 0-indexed)
  const dateMatch = v.match(/Date\((\d+),(\d+),(\d+)/);
  if (dateMatch) {
    const y = dateMatch[1];
    const m = String(Number(dateMatch[2]) + 1).padStart(2, '0');
    const d = dateMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Already a date string like "2026-04-06"
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    return v.slice(0, 10);
  }

  // Try formatted value
  if (cell.f && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(cell.f)) {
    const parts = cell.f.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  return null;
}
