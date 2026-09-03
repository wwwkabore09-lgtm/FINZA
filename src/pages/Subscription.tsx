import { Check } from 'lucide-react'
import { formatCurrency } from '../lib/format'

const PLANS = [
  {
    name: 'Standard',
    priceXof: 1200,
    features: ['Budgets par catégorie', 'Suivi des dettes'],
  },
  {
    name: 'Premium',
    priceXof: 1800,
    features: ['Tout Standard', 'Objectifs illimités', 'Export de tes données'],
  },
  {
    name: 'Pro Max',
    priceXof: 3000,
    features: ['Tout Premium', 'Plusieurs foyers', 'Support prioritaire'],
  },
]

export function Subscription() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-500">Aucun forfait actif pour l'instant.</p>
      </div>

      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Les paiements ne sont pas encore disponibles. Ces formules sont présentées à titre
        indicatif — reviens bientôt.
      </p>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
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
              disabled
              className="mt-5 w-full cursor-not-allowed rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400"
            >
              Bientôt disponible
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
