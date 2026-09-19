import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1'
const TERMINAL_FAILURES = ['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'REJECTED']
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const saspaySecretKey = process.env.SASPAY_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!saspaySecretKey || !supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Configuration serveur manquante' })
    return
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' })
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

  const { data: memberships } = await admin
    .from('household_members')
    .select('household_id')
    .eq('user_id', userData.user.id)
  const householdIds = (memberships ?? []).map((m) => m.household_id as string)
  if (householdIds.length === 0) {
    res.status(200).json({ activated: false, pending: false })
    return
  }

  const body = (req.body ?? {}) as { action?: string; subscriptionId?: string }
  if (body.action === 'cancel') {
    if (!body.subscriptionId) {
      res.status(400).json({ error: 'Requête invalide' })
      return
    }
    // Clearing the SasPay session id keeps a deliberate cancellation from
    // ever being re-activated by the payment re-check below.
    const { data: cancelled, error: cancelError } = await admin
      .from('subscriptions')
      .update({ status: 'cancelled', saspay_session_id: null, updated_at: new Date().toISOString() })
      .eq('id', body.subscriptionId)
      .in('household_id', householdIds)
      .select('id')
    if (cancelError || !cancelled || cancelled.length === 0) {
      res.status(500).json({ error: "Impossible d'annuler l'abonnement" })
      return
    }
    res.status(200).json({ cancelled: true })
    return
  }

  const since = new Date(Date.now() - THREE_DAYS_MS).toISOString()
  const { data: rows } = await admin
    .from('subscriptions')
    .select('id, status, saspay_session_id')
    .in('household_id', householdIds)
    .in('status', ['pending', 'cancelled'])
    .not('saspay_session_id', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5)

  let activated = false
  let pending = false

  for (const row of rows ?? []) {
    try {
      const sessionRes = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${row.saspay_session_id}/`, {
        headers: { Authorization: `Bearer ${saspaySecretKey}` },
      })
      const sessionData = (await sessionRes.json()) as {
        success?: boolean
        data?: { status?: string; paid_at?: string | null }
      }
      if (!sessionRes.ok || !sessionData.success) continue

      const rawStatus = String(sessionData.data?.status ?? '').toUpperCase()
      if (sessionData.data?.paid_at) {
        await admin
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', row.id)
        activated = true
        break
      }
      if (TERMINAL_FAILURES.includes(rawStatus)) {
        if (row.status === 'pending') {
          await admin
            .from('subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', row.id)
        }
      } else if (row.status === 'pending') {
        pending = true
      }
    } catch {
      pending = true
    }
  }

  res.status(200).json({ activated, pending })
}
