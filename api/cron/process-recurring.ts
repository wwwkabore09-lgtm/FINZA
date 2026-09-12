import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextDate(dateStr: string, frequency: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  if (frequency === 'weekly') {
    date.setUTCDate(date.getUTCDate() + 7)
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1)
  }
  return date.toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).end()
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Configuration serveur manquante' })
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const today = todayString()
  const { data: dueRules, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('active', true)
    .lte('next_run_date', today)

  if (fetchError) {
    res.status(500).json({ error: 'Impossible de charger les règles récurrentes', detail: fetchError })
    return
  }

  let processed = 0

  for (const rule of dueRules ?? []) {
    let runDate = rule.next_run_date as string
    let iterations = 0

    while (runDate <= today && iterations < 12) {
      const { error: insertError } = await supabase.from('transactions').insert({
        account_id: rule.account_id,
        category_id: rule.category_id,
        amount: rule.amount,
        description: rule.description,
        date: runDate,
      })
      if (!insertError) processed += 1

      runDate = nextDate(runDate, rule.frequency)
      iterations += 1
    }

    await supabase
      .from('recurring_transactions')
      .update({ next_run_date: runDate })
      .eq('id', rule.id)
  }

  res.status(200).json({ processed })
}
