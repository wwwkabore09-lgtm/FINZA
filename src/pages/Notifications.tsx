import { AlertTriangle, Bell, CheckCircle2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Category, Debt, Goal } from '../types/finance'

interface NotificationItem {
  id: string
  kind: 'warning' | 'success' | 'info'
  title: string
  message: string
}

const ICONS = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Clock,
} as const

const STYLES = {
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-blue-50 text-blue-600',
} as const

function daysSince(dateString: string): number {
  const diffMs = Date.now() - new Date(dateString).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function Notifications() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function load() {
      setLoading(true)

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().slice(0, 10)

      const [categoriesRes, budgetsRes, transactionsRes, goalsRes, debtsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('household_id', householdId as string),
        supabase.from('budgets').select('*').eq('household_id', householdId as string),
        supabase
          .from('transactions')
          .select('amount, category_id, accounts!inner(household_id)')
          .eq('accounts.household_id', householdId as string)
          .gte('date', monthStartStr)
          .lt('amount', 0),
        supabase.from('goals').select('*').eq('household_id', householdId as string),
        supabase.from('debts').select('*').eq('household_id', householdId as string).eq('settled', false),
      ])

      if (cancelled) return

      const items: NotificationItem[] = []

      const categories = (categoriesRes.data ?? []) as Category[]
      const budgets = budgetsRes.data ?? []
      const spentByCategory = new Map<string, number>()
      for (const t of (transactionsRes.data ?? []) as { amount: number; category_id: string | null }[]) {
        if (!t.category_id) continue
        spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Math.abs(t.amount))
      }

      for (const budget of budgets) {
        if (budget.amount <= 0) continue
        const spent = spentByCategory.get(budget.category_id) ?? 0
        const category = categories.find((c) => c.id === budget.category_id)
        if (!category) continue
        const ratio = spent / budget.amount

        if (ratio >= 1) {
          items.push({
            id: `budget-over-${budget.id}`,
            kind: 'warning',
            title: `Budget ${category.name} dépassé`,
            message: `Tu as dépensé ${formatCurrency(spent)} sur un budget de ${formatCurrency(budget.amount)} ce mois-ci.`,
          })
        } else if (ratio >= 0.8) {
          items.push({
            id: `budget-near-${budget.id}`,
            kind: 'info',
            title: `Budget ${category.name} bientôt atteint`,
            message: `Tu as déjà utilisé ${Math.round(ratio * 100)}% de ce budget ce mois-ci.`,
          })
        }
      }

      const goals = (goalsRes.data ?? []) as Goal[]
      for (const goal of goals) {
        if (goal.target_amount <= 0) continue
        const ratio = goal.current_amount / goal.target_amount
        if (ratio >= 1) {
          items.push({
            id: `goal-done-${goal.id}`,
            kind: 'success',
            title: `Objectif "${goal.name}" atteint`,
            message: `Bravo, tu as atteint ${formatCurrency(goal.current_amount)} sur ${formatCurrency(goal.target_amount)}.`,
          })
        } else if (ratio >= 0.8) {
          items.push({
            id: `goal-near-${goal.id}`,
            kind: 'info',
            title: `Objectif "${goal.name}" presque atteint`,
            message: `Tu es à ${Math.round(ratio * 100)}% de ton objectif de ${formatCurrency(goal.target_amount)}.`,
          })
        }
        if (goal.deadline) {
          const daysLeft = Math.ceil(
            (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
          if (daysLeft >= 0 && daysLeft <= 14 && ratio < 1) {
            items.push({
              id: `goal-deadline-${goal.id}`,
              kind: 'warning',
              title: `Échéance proche pour "${goal.name}"`,
              message: `Il reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} et tu n'as atteint que ${Math.round(ratio * 100)}% de l'objectif.`,
            })
          }
        }
      }

      const debts = (debtsRes.data ?? []) as Debt[]
      for (const debt of debts) {
        const age = daysSince(debt.created_at)
        if (age >= 30) {
          items.push({
            id: `debt-old-${debt.id}`,
            kind: 'warning',
            title:
              debt.direction === 'owed_by_me'
                ? `Dette envers ${debt.person_name} non réglée`
                : `${debt.person_name} ne t'a toujours pas remboursé`,
            message: `${formatCurrency(debt.amount)} en attente depuis ${age} jours.`,
          })
        }
      }

      setNotifications(items)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [householdId])

  if (householdLoading || loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Budgets dépassés, objectifs atteints, dettes en attente : tout ce qui mérite ton attention.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Bell size={28} strokeWidth={1.5} className="text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Aucune notification pour l'instant.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((item) => {
            const Icon = ICONS[item.kind]
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${STYLES[item.kind]}`}>
                  <Icon size={17} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
