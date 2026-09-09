import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'

// Vercel auto-parses JSON bodies by default, but signature verification
// needs the exact raw bytes SasPay signed - re-serializing the parsed
// object would break the HMAC comparison.
export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
  }
  return Buffer.concat(chunks).toString('utf8')
}

const SASPAY_BASE_URL = 'https://api.saspay.me/api/v1'
const FIVE_MINUTES_SECONDS = 300

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const webhookSecret = process.env.SASPAY_WEBHOOK_SECRET
  const saspaySecretKey = process.env.SASPAY_SECRET_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!webhookSecret || !saspaySecretKey || !supabaseUrl || !serviceRoleKey) {
    res.status(500).end()
    return
  }

  const rawBody = await getRawBody(req)
  const signature = req.headers['x-webhook-signature']
  const timestamp = req.headers['x-webhook-timestamp']
  const eventType = req.headers['x-webhook-event']

  if (typeof signature !== 'string' || typeof timestamp !== 'string') {
    res.status(400).end()
    return
  }

  const timestampSeconds = Number(timestamp)
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > FIVE_MINUTES_SECONDS
  ) {
    res.status(400).end()
    return
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)

  if (!isValid) {
    res.status(401).end()
    return
  }

  const relevantEvents = ['transaction.success', 'transaction.failed', 'transaction.cancelled']
  if (typeof eventType !== 'string' || !relevantEvents.includes(eventType)) {
    res.status(200).end()
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: pendingSubs } = await supabase
    .from('subscriptions')
    .select('id, saspay_session_id')
    .eq('status', 'pending')
    .not('saspay_session_id', 'is', null)

  for (const sub of pendingSubs ?? []) {
    try {
      const sessionRes = await fetch(`${SASPAY_BASE_URL}/checkout-sessions/${sub.saspay_session_id}/`, {
        headers: { Authorization: `Bearer ${saspaySecretKey}` },
      })
      const sessionData = (await sessionRes.json()) as {
        success?: boolean
        data?: { status?: string; paid_at?: string | null }
      }

      if (sessionData.data?.paid_at) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', sub.id)
      } else if (sessionData.data?.status && sessionData.data.status !== 'PENDING') {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', sub.id)
      }
    } catch {
      // Best effort: the return_url confirm flow or the next webhook retry can still catch it.
    }
  }

  res.status(200).end()
}
