const DEFAULT_OPERATORS = ['Orange Money', 'MTN Mobile Money', 'Moov Money', 'Wave']

export const MOBILE_MONEY_OPERATORS: Record<string, string[]> = {
  'Burkina Faso': ['Orange Money', 'Moov Money'],
  "Côte d'Ivoire": ['Orange Money', 'MTN Mobile Money', 'Moov Money', 'Wave'],
  Mali: ['Orange Money', 'Moov Money'],
  Sénégal: ['Orange Money', 'Wave', 'Free Money'],
  Niger: ['Orange Money', 'Moov Money', 'Airtel Money'],
  Togo: ['Togocom T-Money', 'Moov Money Flooz'],
  Bénin: ['MTN Mobile Money', 'Moov Money Flooz'],
  Guinée: ['Orange Money', 'MTN Mobile Money'],
  Cameroun: ['Orange Money', 'MTN Mobile Money'],
  'République démocratique du Congo': ['Airtel Money', 'Orange Money', 'M-Pesa'],
  Autre: DEFAULT_OPERATORS,
}

export function getMobileMoneyOperators(country: string | undefined): string[] {
  return MOBILE_MONEY_OPERATORS[country ?? ''] ?? DEFAULT_OPERATORS
}
