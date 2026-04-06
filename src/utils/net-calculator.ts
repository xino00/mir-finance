// Estimacion IRPF + SS para soltero sin hijos en Madrid (2026 aprox)
// AVISO: Es una aproximacion. El neto real puede variar.

const SS_RATE = 0.0635; // Contingencias comunes 4.70% + desempleo 1.55% + FP 0.10%

// Tramos IRPF 2025/2026 (estatal + autonomico Madrid)
// Estatal: 9.5%, 12%, 15%, 18.5%, 22.5%, 24.5%
// Madrid:  8.5%, 10.7%, 12.8%, 17.4%, 20.5%, 22.5%
// Sumados: 18%, 22.7%, 27.8%, 35.9%, 43%, 47%
const IRPF_BRACKETS = [
  { limit: 12450, rate: 0.18 },
  { limit: 17707, rate: 0.227 },
  { limit: 33007, rate: 0.278 },
  { limit: 53407, rate: 0.359 },
  { limit: 60000, rate: 0.43 },
  { limit: Infinity, rate: 0.47 },
];

// Minimo personal 5,550€ + reduccion rendimientos trabajo (aprox)
const PERSONAL_MINIMUM = 5550;

function getWorkReduction(netAnnual: number): number {
  if (netAnnual <= 13115) return 6498;
  if (netAnnual <= 16825) return 2000;
  return 0;
}

function calculateAnnualIRPF(grossAnnual: number): number {
  const workReduction = getWorkReduction(grossAnnual);
  const taxableBase = Math.max(0, grossAnnual - PERSONAL_MINIMUM - workReduction);
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

function getMarginalRate(grossAnnual: number): number {
  const workReduction = getWorkReduction(grossAnnual);
  const taxable = Math.max(0, grossAnnual - PERSONAL_MINIMUM - workReduction);
  for (const bracket of IRPF_BRACKETS) {
    if (taxable <= bracket.limit) return bracket.rate;
  }
  return IRPF_BRACKETS[IRPF_BRACKETS.length - 1].rate;
}

export function estimateExtraPayNet(grossSalary: number): number {
  // Extra pays (June/December) are taxed at the marginal IRPF rate + SS
  const grossAnnual = grossSalary * 14;
  const marginalRate = getMarginalRate(grossAnnual - grossAnnual * SS_RATE);
  return Math.round(grossSalary * (1 - marginalRate - SS_RATE) * 100) / 100;
}

export function estimatePayslipNet(grossSalary: number, grossGuards: number): number {
  // Nomina base: IRPF sobre salario anualizado
  const netSalary = estimateMonthlyNet(grossSalary);

  // Guardias: tributan al tipo marginal del residente
  const grossAnnual = grossSalary * 14;
  const marginalRate = getMarginalRate(grossAnnual - grossAnnual * SS_RATE);
  const netGuards = grossGuards * (1 - marginalRate - SS_RATE);

  return Math.round((netSalary + netGuards) * 100) / 100;
}
