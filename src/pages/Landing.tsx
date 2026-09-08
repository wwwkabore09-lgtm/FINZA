import {
  Lock,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

const VALUE_PROPS = [
  {
    icon: Wallet,
    title: 'Une vue unique',
    description:
      'Mobile Money, comptes bancaires et espèces réunis dans un seul tableau de bord, en temps réel. Fini les allers-retours entre trois applications pour savoir combien il te reste.',
  },
  {
    icon: PiggyBank,
    title: 'Des budgets clairs',
    description:
      "Suis tes dépenses par catégorie et sache toujours où en est ton budget du mois, sans tableur ni calculs à la main.",
  },
  {
    icon: Target,
    title: 'Des objectifs atteignables',
    description:
      "Définis des objectifs d'épargne pour ton foyer et visualise ta progression au fil du temps, pas à pas.",
  },
  {
    icon: Users,
    title: 'Pensé pour le foyer',
    description:
      "Un compte 'foyer' partagé entre les membres de ta famille, avec des données visibles uniquement par les personnes que tu ajoutes.",
  },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Tu ajoutes tes comptes',
    description:
      "Mobile Money (Orange Money, Moov Money...), comptes bancaires et espèces : renseigne ce que tu as, où tu l'as.",
  },
  {
    step: '2',
    title: 'Tu suis tes mouvements',
    description:
      "Chaque dépense et chaque revenu est classé par catégorie automatiquement, pour que tu voies où part ton argent.",
  },
  {
    step: '3',
    title: 'Tu gardes le contrôle',
    description:
      "Budgets, objectifs d'épargne et vue d'ensemble : tu prends tes décisions financières avec des chiffres clairs, pas au feeling.",
  },
]

const PROBLEMS = [
  "Ton solde Orange Money, ton compte bancaire et l'argent que tu gardes en liquide ne se parlent jamais entre eux.",
  "Tu dois ouvrir trois applications différentes (ou faire trois appels) juste pour savoir combien tu as réellement.",
  "Impossible de savoir où part ton argent chaque mois sans tout recompter à la main.",
  "Épargner pour un objectif précis (voyage, urgence, projet) se perd dans le solde global du compte.",
]

const FAQ = [
  {
    question: 'Est-ce que Finza a accès à mon argent ?',
    answer:
      "Non. Finza ne déplace jamais ton argent et n'a aucun accès à tes comptes Mobile Money ou bancaires. Tu renseignes toi-même tes soldes et transactions pour garder une vue d'ensemble claire.",
  },
  {
    question: 'Mes données sont-elles visibles par d\'autres personnes ?',
    answer:
      "Non, sauf si tu les partages explicitement avec les membres de ton foyer. Chaque compte n'a accès qu'aux données des foyers dont il fait partie.",
  },
  {
    question: 'Est-ce que c\'est gratuit ?',
    answer:
      "Oui, Finza est entièrement gratuit : comptes, transactions, budgets, objectifs et suivi des dettes.",
  },
  {
    question: 'Quelles devises sont supportées ?',
    answer:
      "Finza est pensé d'abord pour le Franc CFA (XOF), avec un lancement au Burkina Faso. D'autres devises pourront suivre.",
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo />
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
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles size={14} strokeWidth={2} />
              Gratuit · Pensé pour l'Afrique francophone
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Ton argent. Ta vision. Ton contrôle.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Finza est le Financial OS personnel et familial pensé pour l'Afrique
              francophone. Consolide Mobile Money, comptes bancaires et espèces
              dans une seule application, et reprends le contrôle de tes finances.
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

            {/* Aperçu produit */}
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl shadow-slate-200/50">
              <p className="text-xs font-medium text-slate-400">Solde total</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">248 500 XOF</p>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Wallet size={14} strokeWidth={2} />
                    </span>
                    Orange Money
                  </span>
                  <span className="text-sm font-semibold text-slate-900">86 000 XOF</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Wallet size={14} strokeWidth={2} />
                    </span>
                    Compte bancaire
                  </span>
                  <span className="text-sm font-semibold text-slate-900">142 500 XOF</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Wallet size={14} strokeWidth={2} />
                    </span>
                    Espèces
                  </span>
                  <span className="text-sm font-semibold text-slate-900">20 000 XOF</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problème */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Gérer son argent aujourd'hui, c'est un casse-tête
              </h2>
              <p className="mt-4 text-slate-600">
                Entre Mobile Money, la banque et le liquide, ton argent est
                éparpillé. Résultat : tu ne sais jamais vraiment où tu en es.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-3xl gap-4">
              {PROBLEMS.map((problem) => (
                <div
                  key={problem}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <X size={12} strokeWidth={2.5} />
                  </span>
                  <p className="text-sm text-slate-700">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tout ce dont tu as besoin, au même endroit
            </h2>
            <p className="mt-4 text-slate-600">
              Finza rassemble tes finances en une vue simple, pensée pour être
              utilisée au quotidien, même depuis ton téléphone.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="rounded-2xl border border-slate-200 p-6 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <prop.icon size={20} strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Comment ça marche
              </h2>
              <p className="mt-4 text-slate-600">
                Trois étapes simples pour reprendre le contrôle de tes finances.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="text-center sm:text-left">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Confiance / sécurité */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Tes données t'appartiennent
              </h2>
              <p className="mt-4 text-slate-600">
                Finza n'a jamais accès à ton argent : nous ne nous connectons
                pas à tes comptes Mobile Money ou bancaires à ta place. Tu
                gardes la main sur ce que tu renseignes, et sur qui peut le
                voir dans ton foyer.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={18} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Accès par foyer
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Chaque foyer a ses propres données, isolées des autres
                    utilisateurs.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Lock size={18} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Authentification sécurisée
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Connexion protégée par email et mot de passe, gérée par
                    Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
              Questions fréquentes
            </h2>
            <div className="mt-10 space-y-4">
              {FAQ.map((item) => (
                <div
                  key={item.question}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Crée ton compte en une minute et commence à consolider tes
            finances dès aujourd'hui.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-block rounded-lg bg-emerald-600 px-8 py-3 text-base font-semibold text-white hover:bg-emerald-700"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Finza. Fait pour l'Afrique francophone.
      </footer>
    </div>
  )
}
