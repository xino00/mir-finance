import type { AppState } from '../types';
import { format } from 'date-fns';

const CURRENT_VERSION = 1;

export function exportData(state: AppState): void {
  const data = { ...state, version: CURRENT_VERSION };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mir-finance-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as AppState;
        if (!data.version || !data.transactions || !data.settings) {
          reject(new Error('Formato de archivo invalido'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Error al leer el archivo JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
