import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../lib/admin'
import { supabase } from '../lib/supabase'

interface AdminUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  country: string | null
  createdAt: string
  lastSignInAt: string | null
  householdId: string | null
}

interface AdminHousehold {
  id: string
  name: string
  createdAt: string
  memberCount: number
}

interface AdminStats {
  totals: {
    users: number
    households: number
    accounts: number
    transactions: number
    budgets: number
    goals: number
    debts: number
  }
  usersByCountry: { country: string; count: number }[]
  users: AdminUser[]
  households: AdminHousehold[]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR')
}

export function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdminEmail(user?.email)) {
      navigate('/dashboard', { replace: true })
      return
    }

    let cancelled = false

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        if (!cancelled) {
          setError('Session expirée. Reconnecte-toi.')
          setLoading(false)
        }
        return
      }

      try {
        const response = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = (await response.json()) as AdminStats & { error?: string }
        if (cancelled) return
        if (!response.ok) {
          setError(data.error ?? 'Erreur lors du chargement.')
        } else {
          setStats(data)
        }
      } catch {
        if (!cancelled) setError('Impossible de contacter le serveur.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, navigate])

  if (loading) return <LoadingState label="Chargement des données..." />
  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
  if (!stats) return null

  const totalCards: [string, number][] = [
    ['Utilisateurs', stats.totals.users],
    ['Foyers', stats.totals.households],
    ['Comptes', stats.totals.accounts],
    ['Transactions', stats.totals.transactions],
    ['Budgets', stats.totals.budgets],
    ['Objectifs', stats.totals.goals],
    ['Dettes', stats.totals.debts],
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d'ensemble de tous les utilisateurs et foyers Finza.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {totalCards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Répartition par pays</h2>
        {stats.usersByCountry.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune donnée pour l'instant.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.usersByCountry.map((row) => (
              <li key={row.country} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{row.country}</span>
                <span className="font-medium text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Utilisateurs ({stats.users.length})</h2>
        <table className="mt-3 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium uppercase text-slate-400">
              <th className="pb-2 pr-4">Nom</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Pays</th>
              <th className="pb-2 pr-4">Inscrit le</th>
              <th className="pb-2">Dernière connexion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 pr-4 text-slate-900">
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="py-2 pr-4 text-slate-600">{u.email ?? '—'}</td>
                <td className="py-2 pr-4 text-slate-600">{u.country ?? '—'}</td>
                <td className="py-2 pr-4 text-slate-600">{formatDate(u.createdAt)}</td>
                <td className="py-2 text-slate-600">{formatDate(u.lastSignInAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Foyers ({stats.households.length})</h2>
        <table className="mt-3 w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium uppercase text-slate-400">
              <th className="pb-2 pr-4">Nom</th>
              <th className="pb-2 pr-4">Membres</th>
              <th className="pb-2">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.households.map((household) => (
              <tr key={household.id}>
                <td className="py-2 pr-4 text-slate-900">{household.name}</td>
                <td className="py-2 pr-4 text-slate-600">{household.memberCount}</td>
                <td className="py-2 text-slate-600">{formatDate(household.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
