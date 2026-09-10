export const PLANS = [
  {
    name: 'Standard',
    priceXof: 1200,
    features: ['Budgets par catégorie', 'Suivi des dettes'],
  },
  {
    name: 'Premium',
    priceXof: 1800,
    features: ['Tout Standard', 'Objectifs illimités', 'Export de tes données'],
  },
  {
    name: 'Pro Max',
    priceXof: 3000,
    features: ['Tout Premium', 'Plusieurs foyers', 'Support prioritaire'],
  },
] as const

export interface PlanLimits {
  maxAccounts: number | null
  budgetsEnabled: boolean
  debtsEnabled: boolean
  maxGoals: number | null
}

// null = illimité. Le plan Gratuit reste utilisable (comptes, transactions,
// 1 objectif) mais budgets/dettes et les objectifs multiples sont réservés
// aux forfaits payants, pour que payer débloque vraiment quelque chose.
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  Gratuit: { maxAccounts: 2, budgetsEnabled: false, debtsEnabled: false, maxGoals: 1 },
  Standard: { maxAccounts: null, budgetsEnabled: true, debtsEnabled: true, maxGoals: 1 },
  Premium: { maxAccounts: null, budgetsEnabled: true, debtsEnabled: true, maxGoals: null },
  'Pro Max': { maxAccounts: null, budgetsEnabled: true, debtsEnabled: true, maxGoals: null },
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.Gratuit
}
