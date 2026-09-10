import { Check, Copy, Lock, Plus, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useHousehold } from '../hooks/useHousehold'
import { useSubscriptionPlan } from '../hooks/useSubscriptionPlan'
import { createHousehold, joinHouseholdByCode } from '../lib/household'

export function HouseholdSwitcher() {
  const { user } = useAuth()
  const { householdId, households, switchHousehold, refresh } = useHousehold()
  const plan = useSubscriptionPlan()
  const multiHouseholdEnabled = plan === 'Pro Max'

  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const current = households.find((h) => h.id === householdId)

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!user || !newName.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const id = await createHousehold(user.id, newName.trim())
      await refresh()
      switchHousehold(id)
      setNewName('')
    } catch {
      setError("Impossible de créer ce foyer. Réessaie.")
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault()
    if (!joinCode.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const id = await joinHouseholdByCode(joinCode.trim())
      await refresh()
      switchHousehold(id)
      setJoinCode('')
    } catch {
      setError("Code invalide ou expiré.")
    } finally {
      setBusy(false)
    }
  }

  async function handleCopyCode() {
    if (!current?.inviteCode) return
    try {
      await navigator.clipboard.writeText(current.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable, nothing to do
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Users size={16} strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Mes foyers</h2>
          <p className="text-xs text-slate-500">Foyer actif : {current?.name ?? '—'}</p>
        </div>
      </div>

      {households.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {households.map((household) => (
            <button
              key={household.id}
              type="button"
              onClick={() => switchHousehold(household.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                household.id === householdId
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {household.name}
            </button>
          ))}
        </div>
      )}

      {current?.inviteCode && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-xs text-slate-500">Code d'invitation</p>
            <p className="font-mono text-sm font-semibold text-slate-900">{current.inviteCode}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

      {multiHouseholdEnabled ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nom du nouveau foyer"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus size={14} strokeWidth={2} />
              Créer
            </button>
          </form>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Code d'invitation reçu"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Rejoindre
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-slate-200 p-3">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Lock size={12} strokeWidth={2} />
            Créer ou rejoindre un autre foyer nécessite le forfait Pro Max.
          </p>
          <Link
            to="/subscription"
            className="shrink-0 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            Voir les forfaits
          </Link>
        </div>
      )}
    </div>
  )
}
