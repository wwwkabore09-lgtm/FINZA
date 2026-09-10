import { useEffect, useState } from 'react'
import { getOrCreateHousehold } from '../lib/household'
import { useAuth } from './useAuth'

export function useHousehold() {
  const { user } = useAuth()
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    setLoading(true)
    getOrCreateHousehold(user.id)
      .then((id) => {
        if (!cancelled) setHouseholdId(id)
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger ton foyer. Réessaie dans un instant.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return { householdId, loading, error }
}
