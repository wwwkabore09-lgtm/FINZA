import type { VercelRequest, VercelResponse } from '@vercel/node'

const PAYDUNYA_BASE_URL = 'https://app.paydunya.com/api/v1'

interface CreatePaymentBody {
  plan: string
  amount: number
  subscriptionId: string
  returnUrl: string
}

function paydunyaHeaders() {
  return {
    'Content-Type': 'application/json',
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

  const { plan, amount, subscriptionId, returnUrl } = req.body as CreatePaymentBody
  if (!plan || !amount || !subscriptionId || !returnUrl) {
    res.status(400).json({ error: 'Champs manquants' })
    return
  }

  try {
    const response = await fetch(`${PAYDUNYA_BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: paydunyaHeaders(),
      body: JSON.stringify({
        invoice: {
          total_amount: amount,
          description: `Abonnement Finza - ${plan}`,
        },
        store: {
          name: 'Finza',
        },
        actions: {
          cancel_url: returnUrl,
          return_url: returnUrl,
        },
        custom_data: { subscription_id: subscriptionId },
      }),
    })

    const data = (await response.json()) as {
      response_code?: string
      response_text?: string
      token?: string
    }

    if (data.response_code !== '00' || !data.token) {
      res.status(400).json({ error: data.response_text ?? 'Erreur PayDunya' })
      return
    }

    res.status(200).json({
      checkoutUrl: `https://paydunya.com/checkout/invoice/${data.token}`,
      token: data.token,
    })
  } catch {
    res.status(500).json({ error: 'Impossible de contacter PayDunya' })
  }
}
