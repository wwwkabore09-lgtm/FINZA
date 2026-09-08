import type { VercelRequest, VercelResponse } from '@vercel/node'

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const secretKey = process.env.SASPAY_SECRET_KEY
  if (!secretKey) {
    res.status(500).json({ error: 'Clé SasPay manquante' })
    return
  }

  const { plan, amount, subscriptionId, returnUrl, country, customerEmail, customerName } =
    req.body as {
      plan?: string
      amount?: number
      subscriptionId?: string
      returnUrl?: string
      country?: string
      customerEmail?: string
      customerName?: string
    }

  if (!plan || !amount || !subscriptionId || !returnUrl) {
    res.status(400).json({ error: 'Requête invalide' })
    return
  }

  try {
    const response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        currency: 'XOF',
        description: `Abonnement Finza - ${plan}`,
        country: country ?? 'BF',
        customer_email: customerEmail ?? undefined,
        customer_name: customerName ?? undefined,
        return_url: returnUrl,
        metadata: { subscriptionId },
      }),
    })

    const data = (await response.json()) as {
      id?: string
      checkout_url?: string
      detail?: string
      message?: string
    }

    if (!response.ok || !data.checkout_url || !data.id) {
      res.status(502).json({ error: data.detail ?? data.message ?? 'Erreur SasPay' })
      return
    }

    res.status(200).json({ checkoutUrl: data.checkout_url, sessionId: data.id })
  } catch {
    res.status(502).json({ error: 'Impossible de contacter SasPay' })
  }
}
