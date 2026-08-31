import { useEffect, useState, type FormEvent } from 'react'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types/finance'

export function Goals() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    supabase
      .from('goals')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at')
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError('Impossible de charger tes objectifs.')
        } else {
          setGoals((data ?? []) as Goal[])
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
      .from('goals')
      .insert({
        household_id: householdId,
        name,
        target_amount: Number(targetAmount) || 0,
        current_amount: 0,
        deadline: deadline || null,
      })
      .select('*')
      .single()

    if (insertError) {
      setError("Impossible de créer cet objectif. Réessaie.")
    } else if (data) {
      setGoals((current) => [...current, data as Goal])
      setName('')
      setTargetAmount('')
      setDeadline('')
    }
    setSubmitting(false)
  }

  async function handleAddMoney(goal: Goal) {
    const raw = addAmounts[goal.id]
    const amountToAdd = Number(raw)
    if (!amountToAdd || amountToAdd <= 0) return

    const newAmount = goal.current_amount + amountToAdd
    const { data, error: updateError } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goal.id)
      .select('*')
      .single()

    if (updateError) {
      setError("Impossible de mettre à jour cet objectif.")
      return
    }
    if (data) {
      setGoals((current) => current.map((g) => (g.id === goal.id ? (data as Goal) : g)))
      setAddAmounts((current) => ({ ...current, [goal.id]: '' }))
    }
  }

  if (householdLoading || loading) {
    return <p className="text-sm text-slate-500">Chargement...</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Objectifs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Définis des objectifs d'épargne et suis ta progression.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {goals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Aucun objectif pour l'instant.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100),
              )
              return (
                <div key={goal.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{goal.name}</span>
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
                  {goal.deadline && (
                    <p className="mt-2 text-xs text-slate-500">Échéance : {goal.deadline}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Montant à ajouter"
                      value={addAmounts[goal.id] ?? ''}
                      onChange={(event) =>
                        setAddAmounts((current) => ({ ...current, [goal.id]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddMoney(goal)}
                      className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-sm font-semibold text-slate-900">Créer un objectif</h2>

          <div>
            <label htmlFor="goal-name" className="block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              id="goal-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Fonds d'urgence"
            />
          </div>

          <div>
            <label htmlFor="goal-target" className="block text-sm font-medium text-slate-700">
              Montant cible (XOF)
            </label>
            <input
              id="goal-target"
              type="number"
              required
              min="1"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="500000"
            />
          </div>

          <div>
            <label htmlFor="goal-deadline" className="block text-sm font-medium text-slate-700">
              Échéance (optionnel)
            </label>
            <input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
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
            {submitting ? 'Création...' : "Créer l'objectif"}
          </button>
        </form>
      </div>
    </div>
  )
}
