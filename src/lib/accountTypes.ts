import { Banknote, Landmark, Smartphone } from 'lucide-react'
import type { AccountType } from '../types/finance'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  mobile_money: 'Mobile Money',
  bank: 'Banque',
  cash: 'Espèces',
}

export const ACCOUNT_TYPE_ICONS: Record<AccountType, typeof Smartphone> = {
  mobile_money: Smartphone,
  bank: Landmark,
  cash: Banknote,
}
