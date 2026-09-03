import { useEffect, useState } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { getCategoryIcon } from '../lib/categoryIcons'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/finance'

interface CategoryBudget {
  category: Category
  budgetId: string | null
  amount: number
  spent: number
}

export function Budgets() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [rows, setRows] = useState<CategoryBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)

      const [categoriesRes, budgetsRes, transactionsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('household_id', householdId).order('name'),
        supabase.from('budgets').select('*').eq('household_id', householdId),
        supabase
          .from('transactions')
          .select('amount, category_id, accounts!inner(household_id)')
          .eq('accounts.household_id', householdId)
          .gte('date', monthStartStr)
          .lt('amount', 0),
      ])

      if (cancelled) return
      if (categoriesRes.error || budgetsRes.error || transactionsRes.error) {
        setError('Impossible de charger tes budgets.')
        setLoading(false)
        return
      }

      const categories = (categoriesRes.data ?? []) as Category[]
      const budgets = budgetsRes.data ?? []
      const spentByCategory = new Map<string, number>()
      for (const t of (transactionsRes.data ?? []) as { amount: number; category_id: string | null }[]) {
        if (!t.category_id) continue
        spentByCategory.set(
          t.category_id,
          (spentByCategory.get(t.category_id) ?? 0) + Math.abs(t.amount),
        )
      }

      const merged: CategoryBudget[] = categories.map((category) => {
        const budget = budgets.find((b) => b.category_id === category.id)
        return {
          category,
          budgetId: budget?.id ?? null,
          amount: budget?.amount ?? 0,
          spent: spentByCategory.get(category.id) ?? 0,
        }
      })

      setRows(merged)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [householdId])

  function startEditing(row: CategoryBudget) {
    setEditingId(row.category.id)
    setEditValue(row.amount > 0 ? String(row.amount) : '')
  }

  async function saveEdit(row: CategoryBudget) {
    if (!householdId) return
    setSavingId(row.category.id)
    setError(null)

    const amount = Number(editValue) || 0
    const { data, error: upsertError } = await supabase
      .from('budgets')
      .upsert(
        { household_id: householdId, category_id: row.category.id, amount, period: 'Mensuel' },
        { onConflict: 'household_id,category_id' },
      )
      .select('*')
      .single()

    if (upsertError) {
      setError('Impossible de mettre à jour ce budget.')
    } else if (data) {
      setRows((current) =>
        current.map((r) =>
          r.category.id === row.category.id ? { ...r, budgetId: data.id, amount: data.amount } : r,
        ),
      )
      setEditingId(null)
    }
    setSavingId(null)
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  const totalBudget = rows.reduce((sum, row) => sum + row.amount, 0)
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Budgets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fixe un budget mensuel par catégorie et suis ce que tu as déjà dépensé.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Budget mensuel</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {formatCurrency(totalSpent)}{' '}
          <span className="text-base font-medium text-slate-400">
            / {formatCurrency(totalBudget)}
          </span>
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Catégories
        </h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.map((row) => {
            const Icon = getCategoryIcon(row.category.name)
            const isEditing = editingId === row.category.id
            const overBudget = row.amount > 0 && row.spent > row.amount

            return (
              <li key={row.category.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{row.category.name}</p>
                    <p className={`text-xs ${overBudget ? 'text-red-600' : 'text-slate-500'}`}>
                      {formatCurrency(row.spent)} / {formatCurrency(row.amount)}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(row)}
                      disabled={savingId === row.category.id}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
                    >
                      {savingId === row.category.id ? '...' : 'Sauver'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(row)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Modifier
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
