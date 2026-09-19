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

  const body = (req.body ?? {}) as {
    plan?: string
    amount?: number
    subscriptionId?: string
    returnUrl?: string
    country?: string
    customerEmail?: string
    customerName?: string
  }
  const { plan, amount, subscriptionId, returnUrl, country, customerEmail, customerName } = body

  if (!plan || !amount || !subscriptionId || !returnUrl || !customerEmail || !customerName) {
    res.status(400).json({ error: 'Requête invalide' })
    return
  }

  try {
    const saspayResponse = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount).toFixed(2),
        currency: 'XOF',
        description: `Abonnement Finza - ${plan}`,
        country: country ?? 'BF',
        customer_email: customerEmail,
        customer_name: customerName,
        return_url: returnUrl,
        metadata: { subscriptionId },
      }),
    })

    const rawText = await saspayResponse.text()
    const parsed = JSON.parse(rawText) as {
      success?: boolean
      data?: { id?: string; checkout_url?: string }
      error?: unknown
    }

    const sessionId = parsed.data?.id
    const checkoutUrl = parsed.data?.checkout_url

    if (!saspayResponse.ok || !parsed.success || !checkoutUrl || !sessionId) {
      res.status(502).json({ error: 'Erreur SasPay' })
      return
    }

    res.status(200).json({ checkoutUrl, sessionId })
  } catch {
    res.status(502).json({ error: 'Impossible de contacter SasPay' })
  }
}
