export type AccountType = 'mobile_money' | 'bank' | 'cash'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string
  amount: number
  description: string
  date: string
}

export interface Category {
  id: string
  name: string
  icon?: string
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  spent: number
  period: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
}
