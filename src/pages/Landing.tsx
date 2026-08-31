import { Link } from 'react-router-dom'

const VALUE_PROPS = [
  {
    title: 'Une vue unique',
    description:
      'Mobile Money, comptes bancaires et espèces réunis dans un seul tableau de bord, en temps réel.',
  },
  {
    title: 'Des budgets clairs',
    description:
      'Suis tes dépenses par catégorie et sache toujours où en est ton budget du mois.',
  },
  {
    title: 'Des objectifs atteignables',
    description:
      "Définis des objectifs d'épargne pour ton foyer et visualise ta progression au fil du temps.",
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Finza</span>
        <nav className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Connexion
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Commencer
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Ton argent. Ta vision. Ton contrôle.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Finza est le Financial OS personnel et familial pensé pour l'Afrique
            francophone. Consolide Mobile Money, comptes bancaires et espèces
            dans une seule application.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="w-full rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-700 sm:w-auto"
            >
              Créer mon compte
            </Link>
            <Link
              to="/login"
              className="w-full rounded-lg border border-slate-300 px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-8 sm:grid-cols-3">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="rounded-2xl border border-slate-200 p-6 text-left"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {prop.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{prop.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Finza. Fait pour l'Afrique francophone.
      </footer>
    </div>
  )
}
