import {
  ArrowDownRight,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Account, Goal, Transaction } from '../types/finance'

interface TransactionRow extends Transaction {
  accounts: { name: string } | null
}

interface CategoryExpenseRow {
  amount: number
  categories: { name: string } | null
}

function aggregateByCategory(rows: CategoryExpenseRow[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const row of rows) {
    if (row.amount >= 0) continue
    const name = row.categories?.name ?? 'Autre'
    totals[name] = (totals[name] ?? 0) + Math.abs(row.amount)
  }
  return totals
}

export function Dashboard() {
  const { householdId, loading: householdLoading, error: householdError } = useHousehold()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [previousMonthExpenses, setPreviousMonthExpenses] = useState(0)
  const [balancePercentChange, setBalancePercentChange] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [updatedAt] = useState(() => new Date())

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [accountsRes, goalsRes] = await Promise.all([
          supabase
            .from('accounts')
            .select('*')
            .eq('household_id', householdId as string)
            .order('created_at'),
          supabase
            .from('goals')
            .select('*')
            .eq('household_id', householdId as string)
            .order('created_at'),
        ])
        if (accountsRes.error) throw accountsRes.error
        if (goalsRes.error) throw goalsRes.error

        const accountList = (accountsRes.data ?? []) as Account[]
        const accountIds = accountList.map((account) => account.id)
        const totalBalance = accountList.reduce((sum, account) => sum + account.balance, 0)

        let recentTransactions: TransactionRow[] = []
        let expensesThisMonth = 0
        let expensesLastMonth = 0
        let balanceChangePercent: number | null = null
        let currentMonthByCategory: Record<string, number> = {}
        let previousMonthByCategory: Record<string, number> = {}

        if (accountIds.length > 0) {
          const monthStart = new Date()
          monthStart.setDate(1)
          const monthStartStr = monthStart.toISOString().slice(0, 10)

          const prevMonthStart = new Date(monthStart)
          prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
          const prevMonthStartStr = prevMonthStart.toISOString().slice(0, 10)

          const [recentRes, currentMonthRes, prevMonthRes] = await Promise.all([
            supabase
              .from('transactions')
              .select('*, accounts(name)')
              .in('account_id', accountIds)
              .order('date', { ascending: false })
              .limit(5),
            supabase
              .from('transactions')
              .select('amount, categories(name)')
              .in('account_id', accountIds)
              .gte('date', monthStartStr),
            supabase
              .from('transactions')
              .select('amount, categories(name)')
              .in('account_id', accountIds)
              .gte('date', prevMonthStartStr)
              .lt('date', monthStartStr),
          ])
          if (recentRes.error) throw recentRes.error
          if (currentMonthRes.error) throw currentMonthRes.error
          if (prevMonthRes.error) throw prevMonthRes.error

          recentTransactions = (recentRes.data ?? []) as unknown as TransactionRow[]
          const currentRows = (currentMonthRes.data ?? []) as unknown as CategoryExpenseRow[]
          const prevRows = (prevMonthRes.data ?? []) as unknown as CategoryExpenseRow[]

          expensesThisMonth = currentRows
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
          expensesLastMonth = prevRows
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
          currentMonthByCategory = aggregateByCategory(currentRows)
          previousMonthByCategory = aggregateByCategory(prevRows)

          const netChangeThisMonth = currentRows.reduce((sum, t) => sum + t.amount, 0)
          const startOfMonthBalance = totalBalance - netChangeThisMonth
          if (startOfMonthBalance !== 0) {
            balanceChangePercent = (netChangeThisMonth / Math.abs(startOfMonthBalance)) * 100
          }
        }

        if (!cancelled) {
          setAccounts(accountList)
          setGoals((goalsRes.data ?? []) as Goal[])
          setTransactions(recentTransactions)
          setMonthlyExpenses(expensesThisMonth)
          setPreviousMonthExpenses(expensesLastMonth)
          setBalancePercentChange(balanceChangePercent)
        }

        if (!cancelled && Object.keys(currentMonthByCategory).length > 0) {
          fetch('/api/dashboard-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentMonth: currentMonthByCategory,
              previousMonth: previousMonthByCategory,
            }),
          })
            .then((res) => res.json())
            .then((data: { insight?: string | null }) => {
              if (!cancelled) setInsight(data.insight ?? null)
            })
            .catch(() => {
              if (!cancelled) setInsight(null)
            })
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger tes données. Réessaie dans un instant.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [householdId])

  if (householdLoading || loading) {
    return <LoadingState />
  }

  if (householdError || error) {
    return (
      <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {householdError ?? error}
      </p>
    )
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const expensePercentChange =
    previousMonthExpenses > 0
      ? ((monthlyExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
      : null
  const goalsOnTrack = goals.filter(
    (goal) => goal.target_amount > 0 && goal.current_amount / goal.target_amount >= 0.5,
  ).length

  return (
    <div className="space-y-6">
      {insight && (
        <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Sparkles size={16} strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Observation de Finza
            </p>
            <p className="mt-0.5 text-sm text-emerald-900">{insight}</p>
          </div>
        </section>
      )}

      {/* Solde total */}
      <section className="relative overflow-hidden rounded-2xl bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-600/20">
        <div className="flex items-start justify-between">
          <p className="text-sm text-emerald-100">Solde total</p>
          <button
            type="button"
            onClick={() => setBalanceHidden((current) => !current)}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white hover:bg-white/25"
          >
            {balanceHidden ? <Eye size={14} strokeWidth={2} /> : <EyeOff size={14} strokeWidth={2} />}
            {balanceHidden ? 'Afficher' : 'Masquer'}
          </button>
        </div>
        <p className="mt-2 text-3xl font-bold sm:text-4xl">
          {balanceHidden ? '•••••••' : formatCurrency(totalBalance)}
        </p>
        {balancePercentChange !== null && !balanceHidden && (
          <p
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${
              balancePercentChange >= 0 ? 'text-emerald-100' : 'text-rose-100'
            }`}
          >
            {balancePercentChange >= 0 ? (
              <TrendingUp size={16} strokeWidth={2} />
            ) : (
              <TrendingDown size={16} strokeWidth={2} />
            )}
            {balancePercentChange >= 0 ? '+' : ''}
            {balancePercentChange.toFixed(1)}% ce mois-ci
          </p>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs text-emerald-100">
          <span>
            Mis à jour aujourd'hui à{' '}
            {updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 font-medium">XOF</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ArrowDownRight size={18} strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm text-slate-500">Dépenses du mois</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(monthlyExpenses)}</p>
          {expensePercentChange !== null && (
            <p className={`mt-1 text-xs font-medium ${expensePercentChange > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {expensePercentChange > 0 ? '+' : ''}
              {expensePercentChange.toFixed(1)}% vs mois dernier
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Target size={18} strokeWidth={2} />
          </span>
          <p className="mt-3 text-sm text-slate-500">Objectifs actifs</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{goals.length}</p>
          {goals.length > 0 && (
            <p className="mt-1 text-xs font-medium text-slate-500">{goalsOnTrack} en bonne voie</p>
          )}
        </div>
      </section>

      {accounts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            Tu n'as pas encore de compte. Ajoute ton premier compte (Mobile
            Money, banque ou espèces) pour commencer à suivre tes finances.
          </p>
          <Link
            to="/accounts"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Ajouter un compte
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Transactions récentes</h2>
            <Link to="/transactions" className="text-sm text-emerald-600 hover:text-emerald-700">
              Voir tout
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucune transaction pour l'instant.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {transaction.description || transaction.accounts?.name}
                  </span>
                  <span
                    className={
                      transaction.amount < 0
                        ? 'font-medium text-red-600'
                        : 'font-medium text-emerald-600'
                    }
                  >
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Objectifs</h2>
          <Link to="/goals" className="text-sm text-emerald-600 hover:text-emerald-700">
            Voir tout
          </Link>
        </div>
        {goals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Aucun objectif pour l'instant.{' '}
            <Link to="/goals" className="text-emerald-600 hover:text-emerald-700">
              Crée ton premier objectif d'épargne.
            </Link>
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100),
              )
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{goal.name}</span>
                    <span className="text-slate-500">
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
