export type AccountType = 'mobile_money' | 'bank' | 'cash'

export interface Household {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface Account {
  id: string
  household_id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  created_at: string
}

export interface Category {
  id: string
  household_id: string
  name: string
  icon: string | null
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  category_id: string | null
  amount: number
  description: string
  date: string
  created_at: string
}

export interface Budget {
  id: string
  household_id: string
  category_id: string
  amount: number
  period: string
  created_at: string
}

export interface Goal {
  id: string
  household_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  created_at: string
}
