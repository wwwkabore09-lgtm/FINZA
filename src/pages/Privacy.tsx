import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function Privacy() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/">
          <Logo />
        </Link>
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Connexion
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : 11 septembre 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Qui sommes-nous</h2>
            <p className="mt-2">
              Finza est une application de gestion financière personnelle et familiale, éditée
              pour un usage en Afrique francophone. Ce document explique quelles données nous
              collectons, pourquoi, et comment tu peux garder le contrôle dessus.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Données que nous collectons</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Informations de compte : email, prénom, nom, pays, mot de passe (stocké de façon chiffrée par notre fournisseur d'authentification, jamais en clair).</li>
              <li>Données financières que tu saisis toi-même : comptes (Mobile Money, banque, espèces), transactions, budgets, objectifs d'épargne, dettes.</li>
              <li>Données de paiement d'abonnement : gérées par notre partenaire de paiement (SasPay). Finza ne stocke jamais tes identifiants de paiement.</li>
              <li>Données techniques minimales nécessaires au fonctionnement du service (ex. horodatage de connexion).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Ce que nous ne faisons jamais</h2>
            <p className="mt-2">
              Finza ne se connecte jamais directement à tes comptes Mobile Money ou bancaires et
              n'a aucun accès à ton argent réel. Toutes les données financières affichées dans
              l'application proviennent de ce que tu saisis toi-même.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Pourquoi nous utilisons ces données</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Faire fonctionner l'application et t'afficher tes propres données.</li>
              <li>Générer des analyses et suggestions (ex. l'assistant IA) à partir de tes données financières pour t'aider à mieux gérer ton budget.</li>
              <li>T'envoyer des emails opérationnels (confirmation d'inscription, réinitialisation de mot de passe).</li>
              <li>Traiter les paiements d'abonnement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Qui a accès à tes données</h2>
            <p className="mt-2">
              Tes données financières sont visibles uniquement par toi et par les membres de ton
              foyer que tu ajoutes explicitement. Elles sont hébergées chez Supabase et protégées
              par des règles d'accès strictes au niveau de la base de données (Row Level
              Security), qui empêchent tout autre utilisateur d'y accéder. Nous ne vendons ni ne
              partageons tes données avec des tiers à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Sous-traitants techniques</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Supabase</strong> — hébergement de la base de données et authentification.</li>
              <li><strong>Vercel</strong> — hébergement de l'application.</li>
              <li><strong>Resend</strong> — envoi des emails transactionnels.</li>
              <li><strong>SasPay</strong> — traitement des paiements d'abonnement.</li>
              <li><strong>Google Gemini</strong> — génération des réponses de l'assistant IA, à partir des données que tu lui soumets via l'application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Combien de temps nous gardons tes données</h2>
            <p className="mt-2">
              Tes données sont conservées tant que ton compte existe. Si tu supprimes ton compte,
              l'ensemble de tes données financières (comptes, transactions, budgets, objectifs,
              dettes) est supprimé définitivement et de façon irréversible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Tes droits</h2>
            <p className="mt-2">
              Tu peux à tout moment modifier tes informations de profil, exporter tes transactions
              (forfaits Premium et Pro Max), ou supprimer définitivement ton compte et toutes tes
              données depuis la page Profil.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. Nous contacter</h2>
            <p className="mt-2">
              Pour toute question sur cette politique ou sur tes données, écris-nous à{' '}
              <a href="mailto:contact@finza.credit" className="font-medium text-emerald-600 hover:underline">
                contact@finza.credit
              </a>{' '}
              ou contacte-nous sur{' '}
              <a
                href="https://wa.me/22667155784"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-600 hover:underline"
              >
                WhatsApp
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Finza. Fait pour l'Afrique francophone.
      </footer>
    </div>
  )
}
