import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const secretKey = process.env.SASPAY_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secretKey || !supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Configuration serveur manquante' })
    return
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' })
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

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }

  // Only a member of the subscription's household may start its payment.
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('id, household_id')
    .eq('id', subscriptionId)
    .maybeSingle()
  if (!subscription) {
    res.status(404).json({ error: 'Abonnement introuvable' })
    return
  }
  const { data: membership } = await admin
    .from('household_members')
    .select('user_id')
    .eq('household_id', subscription.household_id)
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (!membership) {
    res.status(403).json({ error: 'Accès refusé' })
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

    // Linked server-side (service role) so the payment can always be found again,
    // whatever the browser or RLS does.
    const { error: linkError } = await admin
      .from('subscriptions')
      .update({ saspay_session_id: sessionId })
      .eq('id', subscriptionId)
    if (linkError) {
      res.status(500).json({ error: 'Impossible de lier le paiement' })
      return
    }

    res.status(200).json({ checkoutUrl, sessionId })
  } catch {
    res.status(502).json({ error: 'Impossible de contacter SasPay' })
  }
}
