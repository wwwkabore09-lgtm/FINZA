import { CreditCard } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { translateAuthError } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

export function Profile() {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState(
    (user?.user_metadata?.first_name as string | undefined) ?? '',
  )
  const [lastName, setLastName] = useState(
    (user?.user_metadata?.last_name as string | undefined) ?? '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    })

    if (updateError) {
      setError(translateAuthError(updateError))
    } else {
      setSaved(true)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-md space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profil</h1>
        <p className="mt-1 text-sm text-slate-500">Gère les informations de ton compte.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {user?.email}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-first-name" className="block text-sm font-medium text-slate-700">
              Prénom
            </label>
            <input
              id="profile-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="profile-last-name" className="block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              id="profile-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {saved && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Profil mis à jour.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      <Link
        to="/subscription"
        className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <CreditCard size={18} strokeWidth={2} className="text-slate-400" />
        Gérer mon abonnement
      </Link>
    </div>
  )
}
