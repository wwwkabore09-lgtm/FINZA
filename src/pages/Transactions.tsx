import { useEffect, useState, type FormEvent } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Account, Category, Transaction } from '../types/finance'

interface TransactionRow extends Transaction {
  accounts: { name: string } | null
  categories: { name: string } | null
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function Transactions() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayString())
  const [submitting, setSubmitting] = useState(false)
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [accountsRes, categoriesRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('household_id', householdId as string).order('created_at'),
        supabase.from('categories').select('*').eq('household_id', householdId as string).order('name'),
      ])
      if (cancelled) return
      if (accountsRes.error || categoriesRes.error) {
        setError('Impossible de charger tes données.')
        setLoading(false)
        return
      }

      const accountList = (accountsRes.data ?? []) as Account[]
      const categoryList = (categoriesRes.data ?? []) as Category[]
      setAccounts(accountList)
      setCategories(categoryList)
      if (accountList.length > 0) setAccountId(accountList[0].id)
      if (categoryList.length > 0) setCategoryId(categoryList[0].id)

      const accountIds = accountList.map((a) => a.id)
      if (accountIds.length > 0) {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*, accounts(name), categories(name)')
          .in('account_id', accountIds)
          .order('date', { ascending: false })
        if (!cancelled) {
          if (txError) {
            setError('Impossible de charger tes transactions.')
          } else {
            setTransactions((txData ?? []) as unknown as TransactionRow[])
          }
        }
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [householdId])

  useEffect(() => {
    if (categoryTouched || description.trim().length < 3 || categories.length === 0) return

    const timeout = setTimeout(async () => {
      setSuggesting(true)
      try {
        const response = await fetch('/api/suggest-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            categories: categories.map((category) => category.name),
          }),
        })
        const data = (await response.json()) as { category?: string | null }
        const match = categories.find(
          (category) => category.name.toLowerCase() === data.category?.toLowerCase(),
        )
        if (match) setCategoryId(match.id)
      } catch {
        // La suggestion est un confort, pas un blocage : on ignore les erreurs.
      } finally {
        setSuggesting(false)
      }
    }, 600)

    return () => clearTimeout(timeout)
  }, [description, categoryTouched, categories])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!accountId) return
    setSubmitting(true)
    setError(null)

    const signedAmount = kind === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount))

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        category_id: categoryId || null,
        amount: signedAmount,
        description,
        date,
      })
      .select('*, accounts(name), categories(name)')
      .single()

    if (insertError) {
      setError("Impossible d'ajouter cette transaction. Réessaie.")
    } else if (data) {
      setTransactions((current) => [data as unknown as TransactionRow, ...current])
      setAmount('')
      setDescription('')
      setDate(todayString())
      setCategoryTouched(false)
    }
    setSubmitting(false)
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  if (accounts.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>
        <p className="mt-4 text-sm text-slate-600">
          Ajoute d'abord un compte avant de pouvoir enregistrer des transactions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enregistre tes dépenses et revenus pour suivre où va ton argent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune transaction pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {transaction.description || transaction.categories?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {transaction.accounts?.name} · {transaction.categories?.name ?? 'Sans catégorie'} ·{' '}
                      {transaction.date}
                    </p>
                  </div>
                  <span
                    className={
                      transaction.amount < 0
                        ? 'text-sm font-semibold text-red-600'
                        : 'text-sm font-semibold text-emerald-600'
                    }
                  >
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Ajouter une transaction</h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setKind('expense')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                kind === 'expense'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setKind('income')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                kind === 'income'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Revenu
            </button>
          </div>

          <div>
            <label htmlFor="tx-account" className="block text-sm font-medium text-slate-700">
              Compte
            </label>
            <select
              id="tx-account"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tx-category" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              Catégorie
              {suggesting && <span className="text-xs font-normal text-slate-400">Suggestion IA...</span>}
            </label>
            <select
              id="tx-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryTouched(true)
                setCategoryId(event.target.value)
              }}
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
            <label htmlFor="tx-amount" className="block text-sm font-medium text-slate-700">
              Montant (XOF)
            </label>
            <input
              id="tx-amount"
              type="number"
              required
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="1000"
            />
          </div>

          <div>
            <label htmlFor="tx-description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              id="tx-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Marché"
            />
          </div>

          <div>
            <label htmlFor="tx-date" className="block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  )
}
