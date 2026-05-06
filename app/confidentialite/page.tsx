import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de ShopScribe — données collectées, utilisation, droits RGPD.',
  robots: { index: false, follow: false },
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm transition-colors mb-10 inline-flex items-center gap-1.5">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-2 mt-6">Politique de confidentialité</h1>
        <p className="text-white/40 text-sm mb-12">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Responsable du traitement</h2>
            <p className="text-sm">
              Le responsable du traitement des données personnelles collectées sur shopscribe-ai.com est <span className="text-white/80">[NOM OU SOCIÉTÉ]</span>, joignable à l&apos;adresse : <a href="mailto:support@shopscribe-ai.com" className="text-purple-400 hover:text-purple-300 transition-colors">support@shopscribe-ai.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Données collectées</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-white/80 mb-1">Données de compte</p>
                <p>Lors de l&apos;inscription : adresse email, prénom, nom, mot de passe (haché — jamais stocké en clair). Ces données sont nécessaires à l&apos;exécution du contrat.</p>
              </div>
              <div>
                <p className="font-medium text-white/80 mb-1">Données de paiement</p>
                <p>Les paiements sont traités par <strong className="text-white/80">Stripe</strong>. ShopScribe ne stocke aucune donnée bancaire. Seul un identifiant client Stripe est conservé pour la gestion des achats.</p>
              </div>
              <div>
                <p className="font-medium text-white/80 mb-1">Données de génération</p>
                <p>Les fiches produits générées (nom du produit, mots-clés, résultats) sont stockées dans votre historique. Vous pouvez les supprimer à tout moment depuis le tableau de bord.</p>
              </div>
              <div>
                <p className="font-medium text-white/80 mb-1">Données d&apos;analyse</p>
                <p>ShopScribe utilise <strong className="text-white/80">PostHog</strong> (hébergé en Europe) pour analyser l&apos;utilisation du service de manière agrégée et anonymisée. Aucun profil individuel n&apos;est construit à des fins publicitaires.</p>
              </div>
              <div>
                <p className="font-medium text-white/80 mb-1">Cookies techniques</p>
                <p>Des cookies de session sont utilisés par <strong className="text-white/80">Supabase</strong> pour maintenir votre connexion. Ces cookies sont strictement nécessaires au fonctionnement du service.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Finalités du traitement</h2>
            <ul className="text-sm space-y-2 list-none">
              {[
                'Création et gestion de votre compte utilisateur',
                'Traitement des paiements et activation des crédits',
                'Envoi d\'emails transactionnels (bienvenue, confirmation d\'achat)',
                'Amélioration du service par analyse agrégée d\'usage',
                'Prévention de la fraude et sécurité du service',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-purple-400 mt-0.5 shrink-0">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Sous-traitants et transferts</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-2 pr-4 text-white/50 font-medium">Sous-traitant</th>
                    <th className="text-left py-2 pr-4 text-white/50 font-medium">Rôle</th>
                    <th className="text-left py-2 text-white/50 font-medium">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr><td className="py-2.5 pr-4 text-white/70">Supabase</td><td className="py-2.5 pr-4">Base de données, authentification</td><td className="py-2.5">Europe (AWS)</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Vercel</td><td className="py-2.5 pr-4">Hébergement, CDN</td><td className="py-2.5">États-Unis / Europe</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Stripe</td><td className="py-2.5 pr-4">Paiement</td><td className="py-2.5">États-Unis (SCCs)</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">OpenAI</td><td className="py-2.5 pr-4">Génération IA</td><td className="py-2.5">États-Unis (SCCs)</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Resend</td><td className="py-2.5 pr-4">Emails transactionnels</td><td className="py-2.5">États-Unis (SCCs)</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">PostHog</td><td className="py-2.5 pr-4">Analyse d&apos;usage</td><td className="py-2.5">Europe (EU Cloud)</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-3 text-white/50">SCCs = Clauses contractuelles types approuvées par la Commission européenne.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Durée de conservation</h2>
            <ul className="text-sm space-y-2">
              <li><span className="text-white/50">Données de compte :</span> conservées jusqu&apos;à la suppression du compte + 3 ans (obligations légales)</li>
              <li><span className="text-white/50">Historique de générations :</span> conservé jusqu&apos;à la suppression par l&apos;utilisateur ou du compte</li>
              <li><span className="text-white/50">Données de paiement (Stripe) :</span> 10 ans (obligations comptables)</li>
              <li><span className="text-white/50">Logs techniques :</span> 30 jours maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Vos droits (RGPD)</h2>
            <p className="text-sm mb-3">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="text-sm space-y-1.5">
              {[
                'Droit d\'accès à vos données personnelles',
                'Droit de rectification des données inexactes',
                'Droit à l\'effacement (« droit à l\'oubli »)',
                'Droit à la limitation du traitement',
                'Droit à la portabilité de vos données',
                'Droit d\'opposition au traitement',
              ].map((right, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-purple-400 mt-0.5 shrink-0">✦</span>
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm mt-4">
              Pour exercer ces droits, contactez-nous à <a href="mailto:support@shopscribe-ai.com" className="text-purple-400 hover:text-purple-300 transition-colors">support@shopscribe-ai.com</a>. Vous pouvez également supprimer votre compte directement depuis <Link href="/account" className="text-purple-400 hover:text-purple-300 transition-colors">Mon compte</Link>.
            </p>
            <p className="text-sm mt-3">
              En cas de litige non résolu, vous pouvez saisir la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Sécurité</h2>
            <p className="text-sm">
              ShopScribe met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement en transit (HTTPS/TLS), authentification sécurisée via Supabase Auth, accès restreint aux données de production, mots de passe hachés (bcrypt).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Modifications</h2>
            <p className="text-sm">
              Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par email. La version en vigueur est toujours accessible à cette adresse.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-xs text-white/25">
          <Link href="/mentions-legales" className="hover:text-white/50 transition-colors">Mentions légales</Link>
          <Link href="/cgv" className="hover:text-white/50 transition-colors">CGV</Link>
          <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
        </div>
      </div>
    </div>
  )
}
