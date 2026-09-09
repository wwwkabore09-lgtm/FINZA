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

  const { sessionId } = req.body as { sessionId?: string }
  if (!sessionId) {
    res.status(400).json({ error: 'Requête invalide' })
    return
  }

  try {
    const response = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${sessionId}/`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secretKey}` },
    })

    const rawText = await response.text()
    res.status(200).json({ debug: rawText.slice(0, 800), httpStatus: response.status })
    return
  } catch {
    res.status(502).json({ error: 'Impossible de contacter SasPay' })
  }
}
