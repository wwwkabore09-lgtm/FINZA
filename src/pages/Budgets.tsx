import { useEffect, useState, type FormEvent } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Budget, Category } from '../types/finance'

interface BudgetWithSpent extends Budget {
  spent: number
  categoryName: string
}

export function Budgets() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [budgetsRes, categoriesRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*, categories(name)')
          .eq('household_id', householdId as string)
          .order('created_at'),
        supabase.from('categories').select('*').eq('household_id', householdId as string).order('name'),
      ])
      if (cancelled) return
      if (budgetsRes.error || categoriesRes.error) {
        setError('Impossible de charger tes budgets.')
        setLoading(false)
        return
      }

      const categoryList = (categoriesRes.data ?? []) as Category[]
      setCategories(categoryList)
      if (categoryList.length > 0) setCategoryId(categoryList[0].id)

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)

      const rawBudgets = (budgetsRes.data ?? []) as (Budget & { categories: { name: string } | null })[]

      const withSpent = await Promise.all(
        rawBudgets.map(async (budget) => {
          const { data: txData } = await supabase
            .from('transactions')
            .select('amount, accounts!inner(household_id)')
            .eq('category_id', budget.category_id)
            .eq('accounts.household_id', householdId as string)
            .gte('date', monthStartStr)
            .lt('amount', 0)

          const spent = ((txData ?? []) as { amount: number }[]).reduce(
            (sum, t) => sum + Math.abs(t.amount),
            0,
          )

          return { ...budget, spent, categoryName: budget.categories?.name ?? '' }
        }),
      )

      if (!cancelled) {
        setBudgets(withSpent)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [householdId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!householdId || !categoryId) return
    setSubmitting(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('budgets')
      .insert({
        household_id: householdId,
        category_id: categoryId,
        amount: Number(amount) || 0,
        period: 'Mensuel',
      })
      .select('*, categories(name)')
      .single()

    if (insertError) {
      setError('Impossible de créer ce budget. Réessaie.')
    } else if (data) {
      const created = data as Budget & { categories: { name: string } | null }
      setBudgets((current) => [
        ...current,
        { ...created, spent: 0, categoryName: created.categories?.name ?? '' },
      ])
      setAmount('')
    }
    setSubmitting(false)
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Budgets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fixe un budget mensuel par catégorie et suis ce que tu as déjà dépensé.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {budgets.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Aucun budget pour l'instant.</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const progress = Math.min(100, Math.round((budget.spent / budget.amount) * 100))
              const overBudget = budget.spent > budget.amount
              return (
                <div key={budget.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{budget.categoryName}</span>
                    <span className={overBudget ? 'text-red-600' : 'text-slate-500'}>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${overBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Créer un budget</h2>

          <div>
            <label htmlFor="budget-category" className="block text-sm font-medium text-slate-700">
              Catégorie
            </label>
            <select
              id="budget-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget-amount" className="block text-sm font-medium text-slate-700">
              Montant mensuel (XOF)
            </label>
            <input
              id="budget-amount"
              type="number"
              required
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="50000"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Création...' : 'Créer le budget'}
          </button>
        </form>
      </div>
    </div>
  )
}
