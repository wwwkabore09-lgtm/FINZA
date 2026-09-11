import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Spinner } from '../components/Spinner'
import { translateAuthError } from '../lib/authErrors'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState<string>(COUNTRIES[0])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (oauthError) setError(translateAuthError(oauthError))
  }

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
              country,
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

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setVerifying(true)

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      })
      if (verifyError) throw verifyError
      if (data.session) {
        navigate('/dashboard')
      } else {
        throw new Error('Session introuvable')
      }
    } catch (err) {
      setError(translateAuthError(err))
    } finally {
      setVerifying(false)
    }
  }

  async function handleResendCode() {
    setError(null)
    setResent(false)
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email })
    if (resendError) {
      setError(translateAuthError(resendError))
    } else {
      setResent(true)
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

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.61z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
            />
          </svg>
          Continuer avec Google
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">ou</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {confirmationSent ? (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              Un code à 6 chiffres a été envoyé à {email}. Saisis-le ci-dessous pour confirmer
              ton compte.
            </p>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-slate-700">
                  Code de confirmation
                </label>
                <input
                  id="otp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="000000"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}
              {resent && (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  Un nouveau code a été envoyé.
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || otpCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {verifying && <Spinner className="border-white/40 border-t-white" />}
                {verifying ? 'Vérification...' : 'Confirmer'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                className="w-full text-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Renvoyer le code
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                  />
                </div>
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                  Pays
                </label>
                <select
                  id="country"
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
              setOtpCode('')
              setResent(false)
            }}
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            {mode === 'signin' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>

        {mode === 'signup' && (
          <p className="mt-3 text-center text-xs text-slate-400">
            En créant un compte, tu acceptes les{' '}
            <Link to="/conditions" className="underline hover:text-slate-600">
              conditions d'utilisation
            </Link>{' '}
            et la{' '}
            <Link to="/confidentialite" className="underline hover:text-slate-600">
              politique de confidentialité
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}
