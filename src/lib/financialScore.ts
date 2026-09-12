function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export interface FinancialScoreInputs {
  savingsRate: number
  budgetAdherence: number | null
  goalProgress: number | null
  debtHealth: number | null
}

export interface FinancialScoreBreakdown {
  label: string
  value: number
}

export interface FinancialScoreResult {
  score: number
  breakdown: FinancialScoreBreakdown[]
}

export function computeFinancialScore({
  savingsRate,
  budgetAdherence,
  goalProgress,
  debtHealth,
}: FinancialScoreInputs): FinancialScoreResult {
  const components: { label: string; weight: number; value: number }[] = [
    { label: 'Épargne', weight: 35, value: clamp01(savingsRate) },
  ]
  if (budgetAdherence !== null) {
    components.push({ label: 'Budgets respectés', weight: 30, value: clamp01(budgetAdherence) })
  }
  if (goalProgress !== null) {
    components.push({ label: "Progression des objectifs", weight: 20, value: clamp01(goalProgress) })
  }
  if (debtHealth !== null) {
    components.push({ label: 'Santé des dettes', weight: 15, value: clamp01(debtHealth) })
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)
  const weighted = components.reduce((sum, c) => sum + c.weight * c.value, 0)
  const score = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0

  return {
    score,
    breakdown: components.map((c) => ({ label: c.label, value: Math.round(c.value * 100) })),
  }
}
