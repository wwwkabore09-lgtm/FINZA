// ISO 3166-1 alpha-2 codes for the countries offered at signup (src/lib/countries.ts),
// needed by the SasPay checkout API's "country" field.
const COUNTRY_ISO_CODES: Record<string, string> = {
  'Burkina Faso': 'BF',
  "Côte d'Ivoire": 'CI',
  Mali: 'ML',
  Sénégal: 'SN',
  Niger: 'NE',
  Togo: 'TG',
  Bénin: 'BJ',
  Guinée: 'GN',
  Cameroun: 'CM',
  'République démocratique du Congo': 'CD',
}

export function getCountryIsoCode(country: string | undefined): string {
  return COUNTRY_ISO_CODES[country ?? ''] ?? 'BF'
}
