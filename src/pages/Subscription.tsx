import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useHousehold } from '../hooks/useHousehold'
import { formatCurrency } from '../lib/format'
import { PLANS } from '../lib/plans'
import { supabase } from '../lib/supabase'
import type { Subscription } from '../types/finance'

export function Subscription() {
  const { householdId, loading: householdLoading } = useHousehold()
  const [searchParams, setSearchParams] = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingPlan, setPayingPlan] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    supabase
      .from('subscriptions')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError("Impossible de charger l'abonnement.")
        } else {
          setSubscription((data as Subscription) ?? null)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [householdId])

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription')
    if (!subscriptionId) return

    setConfirming(true)

    async function confirm() {
      const { data: row } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId as string)
        .single()

      const paydunyaToken = (row as Subscription | null)?.paydunya_token
      if (!paydunyaToken) {
        setConfirming(false)
        return
      }

      try {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: paydunyaToken }),
        })
        const data = (await response.json()) as { status?: string }
        const nextStatus = data.status === 'completed' ? 'active' : 'cancelled'

        const { data: updated, error: updateError } = await supabase
          .from('subscriptions')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', subscriptionId as string)
          .select('*')
          .single()
        if (!updateError && updated) {
          setSubscription(updated as Subscription)
        }
      } catch {
        setError('Impossible de confirmer le paiement.')
      } finally {
        setConfirming(false)
        searchParams.delete('subscription')
        setSearchParams(searchParams, { replace: true })
      }
    }

    confirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePay(plan: (typeof PLANS)[number]) {
    if (!householdId) return
    setPayingPlan(plan.name)
    setError(null)

    try {
      const { data: pending, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          household_id: householdId,
          plan: plan.name,
          amount: plan.priceXof,
          status: 'pending',
        })
        .select('*')
        .single()
      if (insertError || !pending) throw insertError

      const returnUrl = `${window.location.origin}/subscription?subscription=${pending.id}`
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name,
          amount: plan.priceXof,
          subscriptionId: pending.id,
          returnUrl,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; token?: string; error?: string }
      if (!response.ok || !data.checkoutUrl || !data.token) {
        throw new Error(data.error ?? 'Erreur PayDunya')
      }

      await supabase
        .from('subscriptions')
        .update({ paydunya_token: data.token })
        .eq('id', pending.id)

      window.location.href = data.checkoutUrl
    } catch {
      setError("Impossible de démarrer le paiement. Réessaie.")
      setPayingPlan(null)
    }
  }

  if (householdLoading || loading || confirming) {
    return <LoadingState label={confirming ? 'Vérification du paiement...' : 'Chargement...'} />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-500">
          {subscription?.status === 'active'
            ? `Forfait actif : ${subscription.plan}`
            : "Aucun forfait actif pour l'instant."}
        </p>
      </div>

      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Paiement en mode test PayDunya — aucun argent réel n'est débité.
      </p>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isActivePlan = subscription?.status === 'active' && subscription.plan === plan.name
          return (
            <div key={plan.name} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(plan.priceXof)}
                <span className="text-sm font-medium text-slate-400">/mois</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isActivePlan || payingPlan !== null}
                onClick={() => handlePay(plan)}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isActivePlan
                  ? 'Forfait actif'
                  : payingPlan === plan.name
                    ? 'Redirection...'
                    : 'Payer (test)'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
