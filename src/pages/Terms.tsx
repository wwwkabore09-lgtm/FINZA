import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'

export function Terms() {
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
        <h1 className="text-2xl font-bold text-slate-900">Conditions générales d'utilisation</h1>
        <p className="mt-2 text-sm text-slate-500">Dernière mise à jour : 11 septembre 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. Objet</h2>
            <p className="mt-2">
              Les présentes conditions régissent l'utilisation de Finza, une application de
              gestion financière personnelle et familiale. En créant un compte, tu acceptes ces
              conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. Nature du service</h2>
            <p className="mt-2">
              Finza est un outil de suivi et de visualisation de finances personnelles. Ce n'est
              ni une banque, ni un établissement de paiement, ni un service Mobile Money. Finza
              n'a accès à aucun de tes comptes bancaires ou Mobile Money et ne déplace jamais ton
              argent : tu renseignes toi-même tes soldes et mouvements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. Compte utilisateur</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Tu dois fournir des informations exactes lors de l'inscription.</li>
              <li>Tu es responsable de la confidentialité de ton mot de passe et de toute activité effectuée depuis ton compte.</li>
              <li>Tu dois avoir au moins 18 ans, ou l'autorisation d'un représentant légal, pour créer un compte.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. Forfaits et paiements</h2>
            <p className="mt-2">
              Finza propose un forfait gratuit avec des fonctionnalités limitées, ainsi que des
              forfaits payants (Standard, Premium, Pro Max) débloquant des fonctionnalités
              supplémentaires. Les paiements sont traités par notre partenaire SasPay. Les
              montants et fonctionnalités de chaque forfait sont affichés sur la page Abonnement
              avant tout paiement. Les abonnements peuvent être annulés à tout moment depuis
              l'application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. Assistant IA</h2>
            <p className="mt-2">
              Finza propose un assistant conversationnel basé sur l'intelligence artificielle qui
              analyse tes données financières pour répondre à tes questions et te donner des
              suggestions. Ces réponses sont générées automatiquement et fournies à titre
              informatif uniquement : elles ne constituent pas un conseil financier, comptable ou
              juridique professionnel. Tu restes seul responsable de tes décisions financières.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. Exactitude des données</h2>
            <p className="mt-2">
              Finza affiche les informations que tu saisis. Nous ne pouvons garantir l'exactitude
              de tes soldes ou analyses si les données saisies sont incomplètes ou erronées. Il
              t'appartient de vérifier et de maintenir tes données à jour.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. Résiliation</h2>
            <p className="mt-2">
              Tu peux supprimer ton compte à tout moment depuis la page Profil. Cette action est
              définitive et entraîne la suppression irréversible de toutes tes données. Nous
              pouvons suspendre ou résilier un compte en cas d'usage frauduleux ou de violation
              des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. Limitation de responsabilité</h2>
            <p className="mt-2">
              Finza est fourni "en l'état". Nous mettons en œuvre des moyens raisonnables pour
              assurer la disponibilité et la sécurité du service, sans garantir une disponibilité
              ininterrompue. Finza ne peut être tenu responsable des décisions financières prises
              sur la base des informations affichées dans l'application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. Modifications</h2>
            <p className="mt-2">
              Ces conditions peuvent évoluer. Toute modification substantielle te sera signalée
              via l'application ou par email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
            <p className="mt-2">
              Pour toute question, écris-nous à{' '}
              <a href="mailto:contact@finza.credit" className="font-medium text-emerald-600 hover:underline">
                contact@finza.credit
              </a>{' '}
              ou contacte-nous sur{' '}
              <a
                href="https://wa.me/22667525172"
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
