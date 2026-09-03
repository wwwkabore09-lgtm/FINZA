import type { VercelRequest, VercelResponse } from '@vercel/node'

const PAYDUNYA_BASE_URL = 'https://app.paydunya.com/api/v1'

function paydunyaHeaders() {
  return {
    'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY ?? '',
    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY ?? '',
    'PAYDUNYA-PUBLIC-KEY': process.env.PAYDUNYA_PUBLIC_KEY ?? '',
    'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN ?? '',
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { token } = req.body as { token?: string }
  if (!token) {
    res.status(400).json({ error: 'Token manquant' })
    return
  }

  try {
    const response = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: paydunyaHeaders(),
    })
    const data = (await response.json()) as { status?: string }
    res.status(200).json({ status: data.status ?? 'unknown' })
  } catch {
    res.status(500).json({ error: 'Impossible de vérifier le paiement' })
  }
}
