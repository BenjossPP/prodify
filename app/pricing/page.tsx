'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, CheckCircle, ArrowRight, X as XIcon } from 'lucide-react'
import { FadeIn, StaggerContainer, StaggerItem, AnimatedBadge, TextReveal } from '@/components/animations'
import { Navbar } from '@/components/navbar'

const plans = [
  {
    name: 'Gratuit',
    price: 0,
    desc: 'Pour tester ShopScribe',
    priceId: null,
    planKey: 'free',
    features: [
      '3 fiches produits',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
    ],
    cta: 'Commencer gratuitement',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    price: 9,
    desc: 'Pour démarrer',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    planKey: 'starter',
    features: [
      '25 fiches produits',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
      'Historique des générations',
    ],
    cta: 'Choisir Starter',
    href: null,
    highlight: false,
  },
  {
    name: 'Pro',
    price: 29,
    desc: 'Pour les vendeurs actifs',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    planKey: 'pro',
    features: [
      '100 fiches produits',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
      'Historique des générations',
      'Export CSV / JSON',
      'Upload CSV en masse',
    ],
    cta: 'Choisir Pro',
    href: null,
    highlight: true,
  },
  {
    name: 'Business',
    price: 59,
    desc: 'Pour les équipes & agences',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    planKey: 'business',
    features: [
      '500 fiches produits',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
      'Historique des générations',
      'Export CSV / JSON',
      'Upload CSV en masse',
      'Ton personnalisable',
      'Support prioritaire',
    ],
    cta: 'Choisir Business',
    href: null,
    highlight: false,
  },
]

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function handleCheckout(priceId: string, planKey: string) {
    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, plan: planKey }),
      })
      const data = await res.json()

      if (res.status === 401) {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = `/signup?plan=${planKey}`
        return
      }

      if (data.url) {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = data.url
      }
    } catch {
      alert('Erreur lors de la création du paiement. Réessayez.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-hidden noise bg-grid">
      {/* Orbes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="orb-2 absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/8 blur-[110px]" />
      </div>

      {/* Navbar */}
      <Navbar />

      <section className="px-4 sm:px-6 pt-32 sm:pt-40 pb-16 sm:pb-28 relative">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14 sm:mb-18"
          >
            <AnimatedBadge delay={0.1}>
              <Badge className="mb-5 bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs px-3 py-1 rounded-full">
                Tarifs
              </Badge>
            </AnimatedBadge>
            <h1 className="text-3xl sm:text-5xl font-heading font-semibold text-white mb-4 tracking-tight">
              <TextReveal text="Simple et transparent" delay={0.15} />
            </h1>
            <FadeIn delay={0.4} blur>
              <p className="text-white/42 text-base sm:text-lg max-w-md mx-auto">
                Commencez gratuitement. Passez au niveau supérieur quand vous êtes prêt.
              </p>
            </FadeIn>
          </motion.div>

          {/* Plans */}
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start" staggerDelay={0.1}>
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <motion.div
                  className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                    plan.highlight
                      ? 'pricing-highlight p-5 sm:p-7 lg:-mt-3 lg:mb-3'
                      : 'bg-white/[0.03] border-white/[0.065] p-5 sm:p-6'
                  }`}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                {/* Ligne lumineuse haut pour le plan highlight */}
                {plan.highlight && (
                  <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
                )}

                {plan.highlight && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium mb-4">
                    <Zap className="h-3 w-3 fill-purple-400 text-purple-400" />
                    Le plus populaire
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className={`text-sm mb-2 font-medium ${plan.highlight ? 'text-white/80' : 'text-white/45'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-heading font-semibold text-white">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-white/28 text-xs">paiement unique</span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-purple-400' : 'text-white/22'}`} />
                      <span className={`text-sm ${plan.highlight ? 'text-white/65' : 'text-white/52'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.href ? (
                  <Link href={plan.href}>
                    <Button className="w-full rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/85 border border-white/[0.08] transition-all duration-200">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.planKey)}
                      disabled={loadingPlan === plan.planKey}
                      className={`w-full rounded-xl gap-2 font-medium transition-all duration-200 ${
                        plan.highlight
                          ? 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/25'
                          : 'bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/85 border border-white/[0.08]'
                      }`}
                    >
                      {loadingPlan === plan.planKey ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          {plan.highlight && <ArrowRight className="h-3.5 w-3.5" />}
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Reassurance */}
          <FadeIn delay={0.5} blur>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-8 mt-12 sm:mt-14 text-white/28 text-sm">
            {['Sans abonnement', 'Paiement sécurisé par Stripe', 'Support par email'].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-white/18" />
                {t}
              </div>
            ))}
          </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <FadeIn blur>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white text-center mb-10">
              Comparer les plans
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="text-left px-5 py-4 text-white/40 font-medium w-[40%]">Fonctionnalité</th>
                    {['Gratuit', 'Starter', 'Pro', 'Business'].map((p, i) => (
                      <th key={p} className={`px-4 py-4 font-semibold text-center ${i === 2 ? 'text-purple-300' : 'text-white/70'}`}>
                        {i === 2 && <span className="block text-[10px] text-purple-400/80 font-normal mb-0.5">⚡ Populaire</span>}
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Fiches produits', values: ['3', '25', '100', '500'] },
                    { label: 'Langues disponibles', values: ['FR & EN', 'FR & EN', '6 langues', '6 langues'] },
                    { label: 'Titre SEO + Description', values: [true, true, true, true] },
                    { label: 'Bullet points + Meta + Tags', values: [true, true, true, true] },
                    { label: 'Historique des générations', values: [false, true, true, true] },
                    { label: 'Export CSV / JSON', values: [false, false, true, true] },
                    { label: 'Upload CSV en masse', values: [false, false, true, true] },
                    { label: 'Ton personnalisable', values: [false, false, false, true] },
                    { label: 'Support prioritaire', values: [false, false, false, true] },
                  ].map(({ label, values }) => (
                    <tr key={label} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-white/55">{label}</td>
                      {values.map((v, i) => (
                        <td key={i} className={`px-4 py-3.5 text-center ${i === 2 ? 'bg-purple-600/[0.04]' : ''}`}>
                          {typeof v === 'boolean' ? (
                            v
                              ? <CheckCircle className="h-4 w-4 text-purple-400 mx-auto" />
                              : <XIcon className="h-4 w-4 text-white/18 mx-auto" />
                          ) : (
                            <span className={`font-medium ${i === 2 ? 'text-purple-300' : 'text-white/70'}`}>{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ Pricing ──────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-white/[0.055]">
        <div className="max-w-2xl mx-auto">
          <FadeIn blur>
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white text-center mb-10">
              Questions sur les tarifs
            </h2>
          </FadeIn>
          <StaggerContainer className="flex flex-col gap-3" staggerDelay={0.07}>
            {[
              { q: 'Est-ce un abonnement mensuel ?', a: 'Non. Chaque plan est un paiement unique. Vous achetez un lot de générations et les utilisez à votre rythme, sans date d\'expiration ni renouvellement automatique.' },
              { q: 'Que se passe-t-il si j\'utilise toutes mes générations ?', a: 'Vous pouvez racheter un plan à tout moment depuis votre compte. Vos crédits ne s\'expirent jamais.' },
              { q: 'Puis-je changer de plan ?', a: 'Oui. Vous pouvez acheter un plan supérieur à tout moment. Les nouvelles générations s\'ajoutent à votre solde existant.' },
              { q: 'Le paiement est-il sécurisé ?', a: 'Oui. Les paiements sont traités par Stripe, le leader mondial des paiements en ligne. Nous ne stockons aucune donnée bancaire.' },
              { q: 'Y a-t-il un remboursement possible ?', a: 'Si vous n\'êtes pas satisfait, contactez notre support dans les 7 jours suivant l\'achat pour un remboursement complet.' },
            ].map(({ q, a }, i) => (
              <StaggerItem key={i}>
                <motion.div
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.065]"
                  whileHover={{ borderColor: 'rgba(139,92,246,0.25)', transition: { duration: 0.2 } }}
                >
                  <div className="font-medium text-white/90 text-sm mb-1.5">{q}</div>
                  <div className="text-white/45 text-sm leading-relaxed">{a}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  )
}
