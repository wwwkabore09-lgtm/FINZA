import { Lock, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'
import { useSubscriptionPlan } from '../hooks/useSubscriptionPlan'
import { ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../lib/accountTypes'
import { formatCurrency } from '../lib/format'
import { getMobileMoneyOperators } from '../lib/mobileMoneyOperators'
import { getPlanLimits } from '../lib/plans'
import { supabase } from '../lib/supabase'
import type { Account, AccountType } from '../types/finance'

const CUSTOM_OPERATOR = '__custom__'

export function Accounts() {
  const { user } = useAuth()
  const { householdId, loading: householdLoading } = useHousehold()
  const plan = useSubscriptionPlan()
  const { maxAccounts } = getPlanLimits(plan)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('mobile_money')
  const [balance, setBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [useCustomName, setUseCustomName] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<AccountType>('mobile_money')
  const [editBalance, setEditBalance] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const operators = getMobileMoneyOperators(user?.user_metadata?.country as string | undefined)

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
    if (maxAccounts !== null && accounts.length >= maxAccounts) {
      setError("Limite de comptes atteinte pour ton forfait. Passe à un forfait supérieur pour en ajouter davantage.")
      return
    }
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
      setUseCustomName(false)
    }
    setSubmitting(false)
  }

  function startEdit(account: Account) {
    setEditingId(account.id)
    setEditName(account.name)
    setEditType(account.type)
    setEditBalance(String(account.balance))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleEditSubmit(event: FormEvent, accountId: string) {
    event.preventDefault()
    setEditSubmitting(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('accounts')
      .update({ name: editName, type: editType, balance: Number(editBalance) || 0 })
      .eq('id', accountId)
      .select('*')
      .single()

    if (updateError) {
      setError('Impossible de modifier ce compte. Réessaie.')
    } else if (data) {
      setAccounts((current) => current.map((a) => (a.id === accountId ? (data as Account) : a)))
      setEditingId(null)
    }
    setEditSubmitting(false)
  }

  async function handleDelete(accountId: string) {
    if (!confirm('Supprimer ce compte ? Toutes ses transactions seront également supprimées.')) {
      return
    }
    const { error: deleteError } = await supabase.from('accounts').delete().eq('id', accountId)
    if (deleteError) {
      setError('Impossible de supprimer ce compte.')
      return
    }
    setAccounts((current) => current.filter((a) => a.id !== accountId))
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  const limitReached = maxAccounts !== null && accounts.length >= maxAccounts

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

                if (editingId === account.id) {
                  return (
                    <li key={account.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                      <form onSubmit={(event) => handleEditSubmit(event, account.id)} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <select
                            value={editType}
                            onChange={(event) => setEditType(event.target.value as AccountType)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <input
                            required
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Nom"
                          />
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(event) => setEditBalance(event.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Solde"
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        aria-label="Modifier"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(account.id)}
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

        {limitReached ? (
          <div className="h-fit rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Lock size={16} strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm text-slate-600">
              Tu as atteint la limite de {maxAccounts} comptes de ton forfait.
            </p>
            <Link
              to="/subscription"
              className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Voir les forfaits
            </Link>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Ajouter un compte</h2>

          <div className="mt-4">
            <label htmlFor="account-type" className="block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="account-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as AccountType)
                setName('')
                setUseCustomName(false)
              }}
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
            <label htmlFor="account-name" className="block text-sm font-medium text-slate-700">
              Nom
            </label>
            {type === 'mobile_money' && !useCustomName ? (
              <select
                id="account-name"
                required
                value={name}
                onChange={(event) => {
                  if (event.target.value === CUSTOM_OPERATOR) {
                    setUseCustomName(true)
                    setName('')
                  } else {
                    setName(event.target.value)
                  }
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="" disabled>
                  Choisis un opérateur
                </option>
                {operators.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
                <option value={CUSTOM_OPERATOR}>Autre (préciser)</option>
              </select>
            ) : (
              <input
                id="account-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder={type === 'mobile_money' ? "Nom de l'opérateur" : 'Compte courant'}
              />
            )}
            {type === 'mobile_money' && useCustomName && (
              <button
                type="button"
                onClick={() => {
                  setUseCustomName(false)
                  setName('')
                }}
                className="mt-1 text-xs font-medium text-emerald-600 hover:underline"
              >
                Choisir dans la liste
              </button>
            )}
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
        )}
      </div>
    </div>
  )
}
