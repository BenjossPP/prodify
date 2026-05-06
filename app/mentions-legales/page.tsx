import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de ShopScribe — éditeur, hébergeur, propriété intellectuelle.',
  robots: { index: false, follow: false },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm transition-colors mb-10 inline-flex items-center gap-1.5">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-2 mt-6">Mentions légales</h1>
        <p className="text-white/40 text-sm mb-12">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Éditeur du site</h2>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-white/40">Raison sociale :</span> <span className="text-white/80">[NOM OU SOCIÉTÉ]</span></p>
              <p><span className="text-white/40">Statut :</span> <span className="text-white/80">[EI / SASU / SARL / etc.]</span></p>
              <p><span className="text-white/40">SIRET :</span> <span className="text-white/80">[NUMÉRO SIRET]</span></p>
              <p><span className="text-white/40">Adresse :</span> <span className="text-white/80">[ADRESSE COMPLÈTE]</span></p>
              <p><span className="text-white/40">Email :</span> <a href="mailto:support@shopscribe-ai.com" className="text-purple-400 hover:text-purple-300 transition-colors">support@shopscribe-ai.com</a></p>
              <p><span className="text-white/40">Directeur de la publication :</span> <span className="text-white/80">[NOM DU RESPONSABLE]</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Hébergement</h2>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-white/40">Hébergeur :</span> <span className="text-white/80">Vercel Inc.</span></p>
              <p><span className="text-white/40">Adresse :</span> <span className="text-white/80">340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</span></p>
              <p><span className="text-white/40">Site :</span> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">vercel.com</a></p>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <p><span className="text-white/40">Base de données :</span> <span className="text-white/80">Supabase Inc. — 970 Toa Payoh North #07-04, Singapore 318992</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Propriété intellectuelle</h2>
            <p className="text-sm">
              L&apos;ensemble du contenu de ce site (textes, images, logos, éléments graphiques) est la propriété exclusive de ShopScribe, sauf mention contraire. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est strictement interdite.
            </p>
            <p className="text-sm mt-3">
              Les fiches produits générées par le service appartiennent à l&apos;utilisateur qui les a générées. ShopScribe se réserve le droit d&apos;utiliser les données agrégées et anonymisées à des fins d&apos;amélioration du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Responsabilité</h2>
            <p className="text-sm">
              ShopScribe met tout en œuvre pour assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, ShopScribe ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des contenus générés par l&apos;intelligence artificielle. L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait des fiches générées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Droit applicable</h2>
            <p className="text-sm">
              Le présent site et ses mentions légales sont soumis au droit français. En cas de litige, les tribunaux compétents seront ceux du ressort du siège social de l&apos;éditeur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies</h2>
            <p className="text-sm">
              Ce site utilise des cookies à des fins d&apos;analyse d&apos;audience (PostHog) et d&apos;authentification (Supabase). Pour plus d&apos;informations, consultez notre{' '}
              <Link href="/confidentialite" className="text-purple-400 hover:text-purple-300 transition-colors">politique de confidentialité</Link>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-xs text-white/25">
          <Link href="/cgv" className="hover:text-white/50 transition-colors">Conditions générales de vente</Link>
          <Link href="/confidentialite" className="hover:text-white/50 transition-colors">Politique de confidentialité</Link>
          <Link href="/" className="hover:text-white/50 transition-colors">Accueil</Link>
        </div>
      </div>
    </div>
  )
}
