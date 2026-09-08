import type { VercelRequest, VercelResponse } from '@vercel/node'

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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

    if (!plan || !amount || !subscriptionId || !returnUrl) {
      res.status(400).json({ error: 'Requête invalide' })
      return
    }

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
        customer_email: customerEmail ?? undefined,
        customer_name: customerName ?? undefined,
        return_url: returnUrl,
        metadata: { subscriptionId },
      }),
    })

    const rawText = await saspayResponse.text()
    let data: { id?: string; checkout_url?: string; detail?: string; message?: string }
    try {
      data = JSON.parse(rawText) as typeof data
    } catch {
      res.status(502).json({
        error: 'Réponse SasPay invalide',
        saspayStatus: saspayResponse.status,
        saspayBody: rawText.slice(0, 500),
      })
      return
    }

    if (!saspayResponse.ok || !data.checkout_url || !data.id) {
      res.status(502).json({
        error: data.detail ?? data.message ?? 'Erreur SasPay',
        saspayStatus: saspayResponse.status,
      })
      return
    }

    res.status(200).json({ checkoutUrl: data.checkout_url, sessionId: data.id })
  } catch (err) {
    res.status(500).json({
      error: 'Exception serveur',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
