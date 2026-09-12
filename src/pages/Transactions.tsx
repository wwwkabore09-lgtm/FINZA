import { Download, Lock, Pause, Pencil, Play, Repeat, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { useSubscriptionPlan } from '../hooks/useSubscriptionPlan'
import { formatCurrency } from '../lib/format'
import { getPlanLimits } from '../lib/plans'
import { supabase } from '../lib/supabase'
import type { Account, Category, RecurringFrequency, RecurringTransaction, Transaction } from '../types/finance'

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Chaque semaine',
  monthly: 'Chaque mois',
}

interface TransactionRow extends Transaction {
  accounts: { name: string } | null
  categories: { name: string } | null
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function exportTransactionsCsv(transactions: TransactionRow[]) {
  const headers = ['Date', 'Compte', 'Catégorie', 'Description', 'Montant (XOF)']
  const rows = transactions.map((t) => [
    t.date,
    t.accounts?.name ?? '',
    t.categories?.name ?? '',
    t.description ?? '',
    String(t.amount),
  ])
  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`﻿${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `finza-transactions-${todayString()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function Transactions() {
  const { householdId, loading: householdLoading } = useHousehold()
  const plan = useSubscriptionPlan()
  const { exportEnabled, budgetsEnabled } = getPlanLimits(plan)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [recurringRules, setRecurringRules] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recurAccountId, setRecurAccountId] = useState('')
  const [recurCategoryId, setRecurCategoryId] = useState('')
  const [recurKind, setRecurKind] = useState<'expense' | 'income'>('expense')
  const [recurAmount, setRecurAmount] = useState('')
  const [recurDescription, setRecurDescription] = useState('')
  const [recurFrequency, setRecurFrequency] = useState<RecurringFrequency>('monthly')
  const [recurStartDate, setRecurStartDate] = useState(todayString())
  const [recurSubmitting, setRecurSubmitting] = useState(false)

  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayString())
  const [submitting, setSubmitting] = useState(false)
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAccountId, setEditAccountId] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editKind, setEditKind] = useState<'expense' | 'income'>('expense')
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

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

      const { data: recurData } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('household_id', householdId as string)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setRecurringRules((recurData ?? []) as RecurringTransaction[])
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

  function startEdit(transaction: TransactionRow) {
    setEditingId(transaction.id)
    setEditAccountId(transaction.account_id)
    setEditCategoryId(transaction.category_id ?? '')
    setEditKind(transaction.amount < 0 ? 'expense' : 'income')
    setEditAmount(String(Math.abs(transaction.amount)))
    setEditDescription(transaction.description)
    setEditDate(transaction.date)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleEditSubmit(event: FormEvent, transactionId: string) {
    event.preventDefault()
    setEditSubmitting(true)
    setError(null)

    const signedAmount = editKind === 'expense' ? -Math.abs(Number(editAmount)) : Math.abs(Number(editAmount))

    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        account_id: editAccountId,
        category_id: editCategoryId || null,
        amount: signedAmount,
        description: editDescription,
        date: editDate,
      })
      .eq('id', transactionId)
      .select('*, accounts(name), categories(name)')
      .single()

    if (updateError) {
      setError('Impossible de modifier cette transaction. Réessaie.')
    } else if (data) {
      setTransactions((current) =>
        current.map((t) => (t.id === transactionId ? (data as unknown as TransactionRow) : t)),
      )
      setEditingId(null)
    }
    setEditSubmitting(false)
  }

  async function handleDelete(transactionId: string) {
    if (!confirm('Supprimer cette transaction ?')) return
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', transactionId)
    if (deleteError) {
      setError('Impossible de supprimer cette transaction.')
      return
    }
    setTransactions((current) => current.filter((t) => t.id !== transactionId))
  }

  async function handleAddRecurring(event: FormEvent) {
    event.preventDefault()
    if (!householdId || !recurAccountId) return
    setRecurSubmitting(true)
    setError(null)

    const signedAmount = recurKind === 'expense' ? -Math.abs(Number(recurAmount)) : Math.abs(Number(recurAmount))

    const { data, error: insertError } = await supabase
      .from('recurring_transactions')
      .insert({
        household_id: householdId,
        account_id: recurAccountId,
        category_id: recurCategoryId || null,
        amount: signedAmount,
        description: recurDescription,
        frequency: recurFrequency,
        next_run_date: recurStartDate,
      })
      .select('*')
      .single()

    if (insertError) {
      setError('Impossible de créer cette transaction récurrente. Réessaie.')
    } else if (data) {
      setRecurringRules((current) => [data as RecurringTransaction, ...current])
      setRecurAmount('')
      setRecurDescription('')
      setRecurStartDate(todayString())
    }
    setRecurSubmitting(false)
  }

  async function handleToggleRecurring(rule: RecurringTransaction) {
    const { data, error: updateError } = await supabase
      .from('recurring_transactions')
      .update({ active: !rule.active })
      .eq('id', rule.id)
      .select('*')
      .single()
    if (updateError) {
      setError('Impossible de mettre à jour cette règle.')
      return
    }
    if (data) {
      setRecurringRules((current) => current.map((r) => (r.id === rule.id ? (data as RecurringTransaction) : r)))
    }
  }

  async function handleDeleteRecurring(ruleId: string) {
    if (!confirm('Supprimer cette transaction récurrente ?')) return
    const { error: deleteError } = await supabase.from('recurring_transactions').delete().eq('id', ruleId)
    if (deleteError) {
      setError('Impossible de supprimer cette règle.')
      return
    }
    setRecurringRules((current) => current.filter((r) => r.id !== ruleId))
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Historique</h2>
            {exportEnabled ? (
              <button
                type="button"
                onClick={() => exportTransactionsCsv(transactions)}
                disabled={transactions.length === 0}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} strokeWidth={2} />
                Exporter (CSV)
              </button>
            ) : (
              <Link
                to="/subscription"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                <Lock size={12} strokeWidth={2} />
                Export (Premium)
              </Link>
            )}
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune transaction pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((transaction) => {
                if (editingId === transaction.id) {
                  return (
                    <li key={transaction.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                      <form onSubmit={(event) => handleEditSubmit(event, transaction.id)} className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditKind('expense')}
                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              editKind === 'expense'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            Dépense
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditKind('income')}
                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                              editKind === 'income'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            Revenu
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select
                            value={editAccountId}
                            onChange={(event) => setEditAccountId(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editCategoryId}
                            onChange={(event) => setEditCategoryId(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editAmount}
                            onChange={(event) => setEditAmount(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Montant"
                          />
                          <input
                            type="date"
                            value={editDate}
                            onChange={(event) => setEditDate(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <input
                            value={editDescription}
                            onChange={(event) => setEditDescription(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:col-span-2"
                            placeholder="Description"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editSubmitting}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {editSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </li>
                  )
                }

                return (
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
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          transaction.amount < 0
                            ? 'text-sm font-semibold text-red-600'
                            : 'text-sm font-semibold text-emerald-600'
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(transaction)}
                        aria-label="Modifier"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(transaction.id)}
                        aria-label="Supprimer"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                )
              })}
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Repeat size={18} strokeWidth={2} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Transactions récurrentes</h2>
        </div>

        {!budgetsEnabled ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 p-4">
            <p className="text-sm text-slate-500">
              Automatise ton salaire, ton loyer ou tes abonnements chaque mois.
            </p>
            <Link
              to="/subscription"
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              <Lock size={12} strokeWidth={2} />
              Standard+
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {recurringRules.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune transaction récurrente pour l'instant.</p>
              ) : (
                <ul className="space-y-3">
                  {recurringRules.map((rule) => {
                    const account = accounts.find((a) => a.id === rule.account_id)
                    const category = categories.find((c) => c.id === rule.category_id)
                    return (
                      <li
                        key={rule.id}
                        className={`flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 ${
                          rule.active ? '' : 'opacity-50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {rule.description || category?.name || 'Transaction récurrente'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {account?.name} · {FREQUENCY_LABELS[rule.frequency]} · Prochaine : {rule.next_run_date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              rule.amount < 0
                                ? 'text-sm font-semibold text-red-600'
                                : 'text-sm font-semibold text-emerald-600'
                            }
                          >
                            {formatCurrency(rule.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleRecurring(rule)}
                            aria-label={rule.active ? 'Mettre en pause' : 'Réactiver'}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            {rule.active ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecurring(rule.id)}
                            aria-label="Supprimer"
                            className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <form onSubmit={handleAddRecurring} className="h-fit space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecurKind('expense')}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    recurKind === 'expense'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  Dépense
                </button>
                <button
                  type="button"
                  onClick={() => setRecurKind('income')}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    recurKind === 'income'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  Revenu
                </button>
              </div>
              <select
                value={recurAccountId || accounts[0]?.id}
                onChange={(event) => setRecurAccountId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                value={recurCategoryId}
                onChange={(event) => setRecurCategoryId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Sans catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                required
                value={recurAmount}
                onChange={(event) => setRecurAmount(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Montant (XOF)"
              />
              <input
                value={recurDescription}
                onChange={(event) => setRecurDescription(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ex : Salaire, Loyer"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={recurFrequency}
                  onChange={(event) => setRecurFrequency(event.target.value as RecurringFrequency)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="weekly">Chaque semaine</option>
                  <option value="monthly">Chaque mois</option>
                </select>
                <input
                  type="date"
                  value={recurStartDate}
                  onChange={(event) => setRecurStartDate(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={recurSubmitting}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {recurSubmitting ? 'Ajout...' : 'Automatiser'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
