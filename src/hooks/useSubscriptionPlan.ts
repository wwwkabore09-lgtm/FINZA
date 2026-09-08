import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHousehold } from './useHousehold'

export function useSubscriptionPlan(): string {
  const { householdId } = useHousehold()
  const [plan, setPlan] = useState('Gratuit')

  useEffect(() => {
    if (!householdId) return
    let cancelled = false

    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setPlan((data?.plan as string | undefined) ?? 'Gratuit')
      })

    return () => {
      cancelled = true
    }
  }, [householdId])

  return plan
}
