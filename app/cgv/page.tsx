import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description: 'Conditions générales de vente de ShopScribe — paiement unique, accès au service, politique de remboursement.',
  robots: { index: false, follow: false },
}

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm transition-colors mb-10 inline-flex items-center gap-1.5">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-2 mt-6">Conditions Générales de Vente</h1>
        <p className="text-white/40 text-sm mb-12">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Objet</h2>
            <p className="text-sm">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre ShopScribe (<span className="text-white/80">[NOM OU SOCIÉTÉ]</span>, ci-après « le Vendeur ») et tout utilisateur effectuant un achat sur le site shopscribe-ai.com (ci-après « le Client »).
            </p>
            <p className="text-sm mt-3">
              ShopScribe est un service de génération de fiches produits par intelligence artificielle, accessible via une interface web à l&apos;adresse shopscribe-ai.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Offres et tarifs</h2>
            <p className="text-sm mb-3">ShopScribe propose les plans suivants, tous à <strong className="text-white/80">paiement unique</strong> (non récurrent) :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-2 pr-4 text-white/50 font-medium">Plan</th>
                    <th className="text-left py-2 pr-4 text-white/50 font-medium">Prix TTC</th>
                    <th className="text-left py-2 text-white/50 font-medium">Générations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr><td className="py-2.5 pr-4 text-white/70">Gratuit</td><td className="py-2.5 pr-4">0 €</td><td className="py-2.5">3</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Starter</td><td className="py-2.5 pr-4">9 €</td><td className="py-2.5">25</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Pro</td><td className="py-2.5 pr-4">29 €</td><td className="py-2.5">100</td></tr>
                  <tr><td className="py-2.5 pr-4 text-white/70">Business</td><td className="py-2.5 pr-4">59 €</td><td className="py-2.5">500</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-4">
              Les générations achetées sont permanentes et ne s&apos;expirent pas. Plusieurs plans peuvent être cumulés sur un même compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Commande et paiement</h2>
            <p className="text-sm">
              Le paiement est effectué en ligne de manière sécurisée via <strong className="text-white/80">Stripe</strong>. ShopScribe n&apos;a à aucun moment accès aux informations bancaires du Client. Le paiement vaut acceptation des présentes CGV.
            </p>
            <p className="text-sm mt-3">
              Une confirmation d&apos;achat est envoyée par email à l&apos;adresse fournie lors de l&apos;inscription. Les crédits sont activés immédiatement après validation du paiement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Accès au service</h2>
            <p className="text-sm">
              L&apos;accès au service nécessite la création d&apos;un compte. Le Client est responsable de la confidentialité de ses identifiants. ShopScribe se réserve le droit de suspendre ou supprimer un compte en cas d&apos;utilisation abusive ou frauduleuse.
            </p>
            <p className="text-sm mt-3">
              ShopScribe s&apos;engage à assurer une disponibilité du service de 99 % par mois, hors maintenance planifiée ou cas de force majeure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Droit de rétractation</h2>
            <p className="text-sm">
              Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contenus numériques fournis sur un support immatériel dont l&apos;exécution a commencé avec l&apos;accord préalable du consommateur.
            </p>
            <p className="text-sm mt-3">
              En utilisant le service immédiatement après l&apos;achat, le Client reconnaît renoncer expressément à son droit de rétractation. <span className="text-white/80">[POLITIQUE DE REMBOURSEMENT À COMPLÉTER — ex : remboursement dans les 48h si aucune génération n&apos;a été effectuée]</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Propriété des contenus générés</h2>
            <p className="text-sm">
              Les fiches produits générées par ShopScribe sont la propriété du Client. ShopScribe n&apos;en revendique aucun droit. Le Client est seul responsable de l&apos;utilisation qu&apos;il en fait, notamment en ce qui concerne la conformité aux exigences des plateformes tierces (Shopify, Amazon, Etsy, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Limitation de responsabilité</h2>
            <p className="text-sm">
              ShopScribe est un outil d&apos;assistance à la rédaction basé sur l&apos;IA. Les résultats peuvent varier selon les produits. ShopScribe ne garantit pas l&apos;exactitude factuelle des descriptions générées ni les résultats commerciaux ou SEO qui en découlent. Le Client doit relire et valider les contenus avant publication.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Droit applicable et juridiction</h2>
            <p className="text-sm">
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, les tribunaux compétents seront ceux du siège social du Vendeur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-sm">
              Pour toute question relative à une commande : <a href="mailto:support@shopscribe-ai.com" className="text-purple-400 hover:text-purple-300 transition-colors">support@shopscribe-ai.com</a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-xs text-white/25">
          <Link href="/mentions-legales" className="hover:text-white/50 transition-colors">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-white/50 transition-colors">Politique de confidentialité</Link>
          <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
        </div>
      </div>
    </div>
  )
}
