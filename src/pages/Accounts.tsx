import { useEffect, useState, type FormEvent } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../lib/accountTypes'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Account, AccountType } from '../types/finance'

export function Accounts() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('mobile_money')
  const [balance, setBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    supabase
      .from('accounts')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at')
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError('Impossible de charger tes comptes.')
        } else {
          setAccounts((data ?? []) as Account[])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [householdId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!householdId) return
    setSubmitting(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('accounts')
      .insert({
        household_id: householdId,
        name,
        type,
        balance: Number(balance) || 0,
        currency: 'XOF',
      })
      .select('*')
      .single()

    if (insertError) {
      setError("Impossible d'ajouter ce compte. Réessaie.")
    } else if (data) {
      setAccounts((current) => [...current, data as Account])
      setName('')
      setBalance('')
      setType('mobile_money')
    }
    setSubmitting(false)
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Comptes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Renseigne tes comptes Mobile Money, bancaires et tes espèces.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun compte pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {accounts.map((account) => {
                const Icon = ACCOUNT_TYPE_ICONS[account.type]
                return (
                  <li
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{account.name}</p>
                        <p className="text-xs text-slate-500">{ACCOUNT_TYPE_LABELS[account.type]}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(account.balance, account.currency)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Ajouter un compte</h2>

          <div className="mt-4">
            <label htmlFor="account-name" className="block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              id="account-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Orange Money"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="account-type" className="block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="account-type"
              value={type}
              onChange={(event) => setType(event.target.value as AccountType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label htmlFor="account-balance" className="block text-sm font-medium text-slate-700">
              Solde actuel (XOF)
            </label>
            <input
              id="account-balance"
              type="number"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="0"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  )
}
