import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { translateAuthError } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (signUpError) throw signUpError
        if (data.session) {
          navigate('/dashboard')
        } else {
          setConfirmationSent(true)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        navigate('/dashboard')
      }
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link to="/" className="inline-block">
          <Logo />
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'signin'
            ? 'Accède à ton tableau de bord financier.'
            : 'Commence à consolider tes finances en une minute.'}
        </p>

        {confirmationSent ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Vérifie ta boîte mail pour confirmer ton inscription.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="first-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Prénom
                  </label>
                  <input
                    id="first-name"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Aïcha"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Nom
                  </label>
                  <input
                    id="last-name"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Traoré"
                  />
                </div>
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="toi@exemple.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting && <Spinner className="border-white/40 border-t-white" />}
              {submitting
                ? 'Patiente...'
                : mode === 'signin'
                  ? 'Se connecter'
                  : "S'inscrire"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'signin' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setConfirmationSent(false)
            }}
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            {mode === 'signin' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
