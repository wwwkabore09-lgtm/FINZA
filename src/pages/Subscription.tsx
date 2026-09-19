import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'
import { getCountryIsoCode } from '../lib/countryCodes'
import { formatCurrency } from '../lib/format'
import { PLANS } from '../lib/plans'
import { supabase } from '../lib/supabase'
import type { Subscription } from '../types/finance'

export function Subscription() {
  const { user } = useAuth()
  const { householdId, loading: householdLoading } = useHousehold()
  const [searchParams, setSearchParams] = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payingPlan, setPayingPlan] = useState<string | null>(null)
  const [confirmPlan, setConfirmPlan] = useState<(typeof PLANS)[number] | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [debugLines, setDebugLines] = useState<string[]>([])

  useEffect(() => {
    if (!householdId) return
    let cancelled = false
    const returningFromPayment = searchParams.get('subscription') !== null

    async function checkSession(sessionId: string): Promise<'completed' | 'pending' | 'failed'> {
      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = (await response.json()) as { status?: string }
      if (data.status === 'completed') return 'completed'
      if (data.status === 'failed') return 'failed'
      return 'pending'
    }

    async function load() {
      if (returningFromPayment) setConfirming(true)

      try {
        // Re-check recent payments that never reached "active": the return
        // from SasPay can arrive before the payment is recorded, and users
        // may also close the tab before being redirected back.
        const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        const { data: unfinished } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('household_id', householdId as string)
          .in('status', ['pending', 'cancelled'])
          .not('saspay_session_id', 'is', null)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5)

        for (const row of (unfinished ?? []) as Subscription[]) {
          if (cancelled || !row.saspay_session_id) break

          let result = await checkSession(row.saspay_session_id)
          for (let attempt = 0; attempt < 4 && result === 'pending' && returningFromPayment; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 2500))
            if (cancelled) return
            result = await checkSession(row.saspay_session_id)
          }

          if (result === 'completed') {
            await supabase
              .from('subscriptions')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('id', row.id)
            break
          }
          if (result === 'failed' && row.status === 'pending') {
            await supabase
              .from('subscriptions')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', row.id)
          }
        }
      } catch {
        if (returningFromPayment && !cancelled) setError('Impossible de confirmer le paiement.')
      }

      if (cancelled) return

      const { data: active, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('household_id', householdId as string)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (fetchError) {
        setError("Impossible de charger l'abonnement.")
      } else {
        setSubscription((active as Subscription) ?? null)
      }

      if (searchParams.get('debug') === '1') {
        const { data: allRows } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('household_id', householdId as string)
          .order('created_at', { ascending: false })
          .limit(6)
        const lines: string[] = []
        for (const row of (allRows ?? []) as Subscription[]) {
          let detail = 'pas de session SasPay'
          if (row.saspay_session_id) {
            try {
              const r = await fetch('/api/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: row.saspay_session_id }),
              })
              detail = JSON.stringify(await r.json())
            } catch {
              detail = 'erreur réseau'
            }
          }
          lines.push(`${row.id.slice(0, 8)} | ${row.plan} | ${row.status} | ${row.created_at.slice(0, 16)} | ${detail}`)
        }
        setDebugLines(lines)
      }

      setConfirming(false)
      setLoading(false)
      if (returningFromPayment) {
        searchParams.delete('subscription')
        setSearchParams(searchParams, { replace: true })
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId])

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
      const country = getCountryIsoCode(user?.user_metadata?.country as string | undefined)
      const firstName = user?.user_metadata?.first_name as string | undefined
      const lastName = user?.user_metadata?.last_name as string | undefined

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.name,
          amount: plan.priceXof,
          subscriptionId: pending.id,
          returnUrl,
          country,
          customerEmail: user?.email,
          customerName: [firstName, lastName].filter(Boolean).join(' ') || user?.email,
        }),
      })
      const data = (await response.json()) as { checkoutUrl?: string; sessionId?: string; error?: string }
      if (!response.ok || !data.checkoutUrl || !data.sessionId) {
        throw new Error(data.error ?? 'Erreur SasPay')
      }

      await supabase
        .from('subscriptions')
        .update({ saspay_session_id: data.sessionId })
        .eq('id', pending.id)

      window.location.href = data.checkoutUrl
    } catch {
      setError('Impossible de démarrer le paiement. Réessaie.')
      setPayingPlan(null)
    }
  }

  async function handleCancel() {
    if (!subscription || !confirm('Annuler ton abonnement ? Tu repasseras au forfait Gratuit.')) {
      return
    }
    setCancelling(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', saspay_session_id: null, updated_at: new Date().toISOString() })
      .eq('id', subscription.id)
      .select('*')
      .single()

    if (updateError) {
      setError("Impossible d'annuler l'abonnement. Réessaie.")
    } else if (data) {
      setSubscription(data as Subscription)
    }
    setCancelling(false)
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

      {debugLines.length > 0 && (
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
          {debugLines.join('\n')}
        </pre>
      )}

      {subscription?.status === 'active' && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {cancelling ? 'Annulation...' : 'Annuler mon abonnement'}
        </button>
      )}

      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Paiement sécurisé via SasPay. Des frais de paiement s'ajoutent au prix du forfait : le
        montant total exact s'affiche sur le bouton « Payer » de la page de paiement.
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
              <p className="mt-1 text-xs text-slate-400">+ frais de paiement</p>
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
                onClick={() => setConfirmPlan(plan)}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isActivePlan
                  ? 'Forfait actif'
                  : payingPlan === plan.name
                    ? 'Redirection...'
                    : 'Payer'}
              </button>
            </div>
          )
        })}
      </div>

      {confirmPlan && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-payment-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="confirm-payment-title" className="text-base font-semibold text-slate-900">
              Confirmer le forfait {confirmPlan.name}
            </h2>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Prix du forfait</dt>
                <dd className="font-medium text-slate-900">{formatCurrency(confirmPlan.priceXof)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Frais de paiement</dt>
                <dd className="font-medium text-slate-900">selon l'opérateur</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-900">Total à payer</dt>
                <dd className="font-semibold text-slate-900">affiché sur la page SasPay</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Avec Orange Money, génère ton code OTP pour le montant inscrit sur le bouton{' '}
              <strong>« Payer »</strong> de la page SasPay (frais compris), même si la consigne en
              jaune indique le prix du forfait. Un montant différent fait refuser le paiement.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmPlan(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const plan = confirmPlan
                  setConfirmPlan(null)
                  handlePay(plan)
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Continuer vers SasPay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
