export const PLANS = [
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
] as const
