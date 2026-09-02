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

export function Dashboard() {
  const { householdId, loading: householdLoading, error: householdError } = useHousehold()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        let recentTransactions: TransactionRow[] = []
        let expensesThisMonth = 0

        if (accountIds.length > 0) {
          const monthStart = new Date()
          monthStart.setDate(1)
          const monthStartStr = monthStart.toISOString().slice(0, 10)

          const [recentRes, monthRes] = await Promise.all([
            supabase
              .from('transactions')
              .select('*, accounts(name)')
              .in('account_id', accountIds)
              .order('date', { ascending: false })
              .limit(5),
            supabase
              .from('transactions')
              .select('amount')
              .in('account_id', accountIds)
              .gte('date', monthStartStr)
              .lt('amount', 0),
          ])
          if (recentRes.error) throw recentRes.error
          if (monthRes.error) throw monthRes.error

          recentTransactions = (recentRes.data ?? []) as unknown as TransactionRow[]
          expensesThisMonth = ((monthRes.data ?? []) as { amount: number }[]).reduce(
            (sum, t) => sum + Math.abs(t.amount),
            0,
          )
        }

        if (!cancelled) {
          setAccounts(accountList)
          setGoals((goalsRes.data ?? []) as Goal[])
          setTransactions(recentTransactions)
          setMonthlyExpenses(expensesThisMonth)
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

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Solde total</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Dépenses du mois</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(monthlyExpenses)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Objectifs actifs</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{goals.length}</p>
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
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Comptes</h2>
              <Link to="/accounts" className="text-sm text-emerald-600 hover:text-emerald-700">
                Voir tout
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{account.name}</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
          </div>
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
