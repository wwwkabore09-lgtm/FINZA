import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Account, Goal, Transaction } from '../types/finance'

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'Orange Money', type: 'mobile_money', balance: 85000, currency: 'XOF' },
  { id: '2', name: 'Compte courant UBA', type: 'bank', balance: 240000, currency: 'XOF' },
  { id: '3', name: 'Espèces', type: 'cash', balance: 15000, currency: 'XOF' },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', accountId: '1', categoryId: 'food', amount: -3500, description: 'Marché', date: '2026-08-29' },
  { id: '2', accountId: '2', categoryId: 'salary', amount: 180000, description: 'Salaire', date: '2026-08-25' },
  { id: '3', accountId: '1', categoryId: 'transport', amount: -1000, description: 'Transport', date: '2026-08-28' },
]

const MOCK_GOALS: Goal[] = [
  { id: '1', name: "Fonds d'urgence", targetAmount: 500000, currentAmount: 180000 },
  { id: '2', name: 'Voyage', targetAmount: 300000, currentAmount: 60000 },
]

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const totalBalance = MOCK_ACCOUNTS.reduce((sum, account) => sum + account.balance, 0)
  const monthlyExpenses = MOCK_TRANSACTIONS.filter((t) => t.amount < 0).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-6 sm:flex">
        <span className="text-lg font-semibold text-slate-900">Finza</span>
        <nav className="mt-8 flex flex-col gap-1 text-sm font-medium text-slate-600">
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            Tableau de bord
          </span>
          <span className="rounded-lg px-3 py-2">Comptes</span>
          <span className="rounded-lg px-3 py-2">Transactions</span>
          <span className="rounded-lg px-3 py-2">Budgets</span>
          <span className="rounded-lg px-3 py-2">Objectifs</span>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Bonjour{user?.email ? `, ${user.email}` : ''}
          </h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Se déconnecter
          </button>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Solde total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {currency.format(totalBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Dépenses du mois</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {currency.format(monthlyExpenses)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Objectifs actifs</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {MOCK_GOALS.length}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Comptes</h2>
              <ul className="mt-4 space-y-3">
                {MOCK_ACCOUNTS.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">{account.name}</span>
                    <span className="font-medium text-slate-900">
                      {currency.format(account.balance)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Transactions récentes
              </h2>
              <ul className="mt-4 space-y-3">
                {MOCK_TRANSACTIONS.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">
                      {transaction.description}
                    </span>
                    <span
                      className={
                        transaction.amount < 0
                          ? 'font-medium text-red-600'
                          : 'font-medium text-emerald-600'
                      }
                    >
                      {currency.format(transaction.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Objectifs</h2>
            <div className="mt-4 space-y-4">
              {MOCK_GOALS.map((goal) => {
                const progress = Math.round(
                  (goal.currentAmount / goal.targetAmount) * 100,
                )
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{goal.name}</span>
                      <span className="text-slate-500">
                        {currency.format(goal.currentAmount)} /{' '}
                        {currency.format(goal.targetAmount)}
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
          </section>
        </main>
      </div>
    </div>
  )
}
