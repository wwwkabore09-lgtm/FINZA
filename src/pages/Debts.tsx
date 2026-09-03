import { useEffect, useState, type FormEvent } from 'react'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Debt, DebtDirection } from '../types/finance'

export function Debts() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [direction, setDirection] = useState<DebtDirection>('owed_by_me')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    supabase
      .from('debts')
      .select('*')
      .eq('household_id', householdId)
      .order('settled')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError('Impossible de charger tes dettes.')
        } else {
          setDebts((data ?? []) as Debt[])
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
      .from('debts')
      .insert({
        household_id: householdId,
        person_name: personName,
        direction,
        amount: Number(amount) || 0,
        description: description || null,
      })
      .select('*')
      .single()

    if (insertError) {
      setError("Impossible d'ajouter cette dette. Réessaie.")
    } else if (data) {
      setDebts((current) => [data as Debt, ...current])
      setPersonName('')
      setAmount('')
      setDescription('')
    }
    setSubmitting(false)
  }

  async function toggleSettled(debt: Debt) {
    const { data, error: updateError } = await supabase
      .from('debts')
      .update({ settled: !debt.settled })
      .eq('id', debt.id)
      .select('*')
      .single()

    if (updateError) {
      setError('Impossible de mettre à jour cette dette.')
      return
    }
    if (data) {
      setDebts((current) => current.map((d) => (d.id === debt.id ? (data as Debt) : d)))
    }
  }

  if (householdLoading || loading) {
    return <LoadingState />
  }

  const iOwe = debts.filter((d) => d.direction === 'owed_by_me' && !d.settled)
  const owedToMe = debts.filter((d) => d.direction === 'owed_to_me' && !d.settled)
  const settled = debts.filter((d) => d.settled)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dettes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Garde une trace de ce que tu dois et de ce qu'on te doit.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-red-700">Je dois</h2>
            {iOwe.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Rien à signaler.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {iOwe.map((debt) => (
                  <li
                    key={debt.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{debt.person_name}</p>
                      {debt.description && (
                        <p className="text-xs text-slate-500">{debt.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(debt.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSettled(debt)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Remboursé
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-emerald-700">On me doit</h2>
            {owedToMe.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Rien à signaler.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {owedToMe.map((debt) => (
                  <li
                    key={debt.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{debt.person_name}</p>
                      {debt.description && (
                        <p className="text-xs text-slate-500">{debt.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(debt.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSettled(debt)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Reçu
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {settled.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-500">Réglées</h2>
              <ul className="mt-3 space-y-2">
                {settled.map((debt) => (
                  <li
                    key={debt.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 opacity-60"
                  >
                    <span className="text-sm text-slate-600 line-through">
                      {debt.person_name}
                    </span>
                    <span className="text-sm text-slate-500">{formatCurrency(debt.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Ajouter une dette</h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('owed_by_me')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                direction === 'owed_by_me'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              Je dois
            </button>
            <button
              type="button"
              onClick={() => setDirection('owed_to_me')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                direction === 'owed_to_me'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              On me doit
            </button>
          </div>

          <div>
            <label htmlFor="debt-person" className="block text-sm font-medium text-slate-700">
              Nom de la personne
            </label>
            <input
              id="debt-person"
              required
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Aïcha"
            />
          </div>

          <div>
            <label htmlFor="debt-amount" className="block text-sm font-medium text-slate-700">
              Montant (XOF)
            </label>
            <input
              id="debt-amount"
              type="number"
              required
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="10000"
            />
          </div>

          <div>
            <label htmlFor="debt-description" className="block text-sm font-medium text-slate-700">
              Description (optionnel)
            </label>
            <input
              id="debt-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Prêt pour l'essence"
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
