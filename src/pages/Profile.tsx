import { CreditCard, FileText, MessageCircle, Shield } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { translateAuthError } from '../lib/authErrors'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'

export function Profile() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [firstName, setFirstName] = useState(
    (user?.user_metadata?.first_name as string | undefined) ?? '',
  )
  const [lastName, setLastName] = useState(
    (user?.user_metadata?.last_name as string | undefined) ?? '',
  )
  const [country, setCountry] = useState(
    (user?.user_metadata?.country as string | undefined) ?? COUNTRIES[0],
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSaved(false)

    const { error: updateError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, country },
    })

    if (updateError) {
      setError(translateAuthError(updateError))
    } else {
      setSaved(true)
    }
    setSubmitting(false)
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setChangingPassword(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setPasswordError(translateAuthError(updateError))
    } else {
      setPasswordSaved(true)
      setNewPassword('')
    }
    setChangingPassword(false)
  }

  async function handleDeleteAccount() {
    if (!session?.access_token || confirmEmail !== user?.email) return
    setDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) throw new Error()
      await supabase.auth.signOut()
      navigate('/')
    } catch {
      setDeleteError('Impossible de supprimer ton compte. Réessaie dans un instant.')
      setDeleting(false)
    }
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

        <div>
          <label htmlFor="profile-country" className="block text-sm font-medium text-slate-700">
            Pays
          </label>
          <select
            id="profile-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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

      <form
        onSubmit={handleChangePassword}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-slate-900">Changer le mot de passe</h2>
        <div>
          <label htmlFor="new-profile-password" className="block text-sm font-medium text-slate-700">
            Nouveau mot de passe
          </label>
          <input
            id="new-profile-password"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="8 caractères minimum"
          />
        </div>

        {passwordError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{passwordError}</p>
        )}
        {passwordSaved && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Mot de passe mis à jour.
          </p>
        )}

        <button
          type="submit"
          disabled={changingPassword || newPassword.length === 0}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {changingPassword ? 'Enregistrement...' : 'Mettre à jour'}
        </button>
      </form>

      <a
        href="https://wa.me/22667525172"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <MessageCircle size={18} strokeWidth={2} className="text-slate-400" />
        Nous contacter sur WhatsApp
      </a>

      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Link
          to="/confidentialite"
          className="flex items-center gap-2.5 p-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Shield size={18} strokeWidth={2} className="text-slate-400" />
          Politique de confidentialité
        </Link>
        <Link
          to="/conditions"
          className="flex items-center gap-2.5 p-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FileText size={18} strokeWidth={2} className="text-slate-400" />
          Conditions générales d'utilisation
        </Link>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-red-900">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-red-700">
          Supprimer ton compte efface définitivement tes comptes, transactions, budgets,
          objectifs et dettes. Cette action est irréversible.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="confirm-email" className="block text-sm font-medium text-red-900">
                Tape ton email ({user?.email}) pour confirmer
              </label>
              <input
                id="confirm-email"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="toi@exemple.com"
              />
            </div>

            {deleteError && (
              <p className="rounded-lg bg-white p-3 text-sm text-red-700">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={confirmEmail !== user?.email || deleting}
                onClick={handleDeleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmEmail('')
                  setDeleteError(null)
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
