// Estimacion IRPF + SS para soltero sin hijos en Madrid (2026 aprox)
// AVISO: Es una aproximacion. El neto real puede variar.

const SS_RATE = 0.0635; // Contingencias comunes 4.70% + desempleo 1.55% + FP 0.10%

// Tramos IRPF 2025/2026 (estatal + autonomico Madrid)
// Estatal: 9.5%, 12%, 15%, 18.5%, 22.5%, 24.5%
// Madrid:  8.5%, 10.7%, 12.8%, 17.4%, 20.5%, 22.5%
// Sumados: 18%, 22.7%, 27.8%, 35.9%, 43%, 47%
const IRPF_BRACKETS = [
  { limit: 12450, rate: 0.19 },
  { limit: 20200, rate: 0.24 },
  { limit: 35200, rate: 0.30 },
  { limit: 60000, rate: 0.37 },
  { limit: Infinity, rate: 0.45 },
];

// Minimo personal 5,550€ + reduccion rendimientos trabajo (aprox)
const PERSONAL_MINIMUM = 5550;
const WORK_REDUCTION = 2000; // Simplificado para rentas < 16,825€

function calculateAnnualIRPF(grossAnnual: number): number {
  const taxableBase = Math.max(0, grossAnnual - PERSONAL_MINIMUM - WORK_REDUCTION);
  let tax = 0;
  let remaining = taxableBase;
  let prevLimit = 0;

  for (const bracket of IRPF_BRACKETS) {
    const bracketSize = bracket.limit - prevLimit;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    prevLimit = bracket.limit;
    if (remaining <= 0) break;
  }

  return tax;
}

export function estimateMonthlyNet(grossMonthly: number, paymentsPerYear = 14): number {
  const grossAnnual = grossMonthly * paymentsPerYear;

  // Seguridad Social mensual
  const ssMontly = grossMonthly * SS_RATE;

  // IRPF anual sobre bruto - SS
  const annualIRPF = calculateAnnualIRPF(grossAnnual - grossAnnual * SS_RATE);

  // IRPF mensual (repartido en 12 meses, las extras no llevan IRPF igual)
  const irpfMonthly = annualIRPF / 12;

  return Math.round((grossMonthly - ssMontly - irpfMonthly) * 100) / 100;
}

export function estimatePayslipNet(grossSalary: number, grossGuards: number): number {
  // Nomina base: IRPF sobre salario anualizado
  const netSalary = estimateMonthlyNet(grossSalary);

  // Guardias: retencion aproximada similar pero sobre complemento
  // Las guardias tributan al tipo marginal, aprox 24-30% para MIR
  const guardsRetention = 0.24;
  const netGuards = grossGuards * (1 - guardsRetention - SS_RATE);

  return Math.round((netSalary + netGuards) * 100) / 100;
}
