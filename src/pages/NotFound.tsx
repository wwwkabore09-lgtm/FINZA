import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Link to="/" className="inline-block">
        <Logo />
      </Link>
      <p className="mt-8 text-6xl font-bold text-emerald-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        La page que tu cherches n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
