import { useCallback, useEffect, useState } from 'react'
import { getOrCreateHousehold, listUserHouseholds, type HouseholdSummary } from '../lib/household'
import { useAuth } from './useAuth'

function storageKey(userId: string): string {
  return `finza_current_household_${userId}`
}

export function useHousehold() {
  const { user } = useAuth()
  const [householdId, setHouseholdIdState] = useState<string | null>(null)
  const [households, setHouseholds] = useState<HouseholdSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let list = await listUserHouseholds(user.id)
      if (list.length === 0) {
        await getOrCreateHousehold(user.id)
        list = await listUserHouseholds(user.id)
      }
      setHouseholds(list)

      const stored = localStorage.getItem(storageKey(user.id))
      const stillValid = list.find((h) => h.id === stored)
      const next = stillValid?.id ?? list[0]?.id ?? null
      setHouseholdIdState(next)
      if (next) localStorage.setItem(storageKey(user.id), next)
    } catch {
      setError("Impossible de charger ton foyer. Réessaie dans un instant.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  function switchHousehold(id: string) {
    if (!user) return
    setHouseholdIdState(id)
    localStorage.setItem(storageKey(user.id), id)
  }

  return { householdId, households, loading, error, switchHousehold, refresh: load }
}
