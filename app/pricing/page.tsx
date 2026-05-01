'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, CheckCircle, ArrowRight } from 'lucide-react'

const plans = [
  {
    name: 'Gratuit',
    price: 0,
    desc: 'Pour tester Prodify',
    priceId: null,
    planKey: 'free',
    features: [
      '10 fiches produits / mois',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
    ],
    cta: 'Commencer gratuitement',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 19,
    desc: 'Pour les vendeurs actifs',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    planKey: 'pro',
    features: [
      '500 fiches produits / mois',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
      'Historique des générations',
      'Export CSV / JSON',
      'Upload CSV en masse',
    ],
    cta: 'Passer au Pro',
    href: null,
    highlight: true,
  },
  {
    name: 'Business',
    price: 49,
    desc: 'Pour les équipes & agences',
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
    planKey: 'business',
    features: [
      'Générations illimitées',
      'Français & Anglais',
      'Titre + Description + Bullets',
      'Meta description + Tags',
      'Historique des générations',
      'Export CSV / JSON',
      'Upload CSV en masse',
      'Ton personnalisable',
      'Accès API',
      'Support prioritaire',
    ],
    cta: 'Passer au Business',
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
        window.location.href = `/signup?plan=${planKey}`
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Erreur lors de la création du paiement. Réessayez.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Orbes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[120px]" />
        <div className="orb-2 absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Prodify</span>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 text-sm">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 rounded-xl">
                Essayer gratuitement
              </Button>
            </Link>
          </div>
          <div className="sm:hidden flex items-center gap-2">
            <Link href="/signup">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs px-3">
                Essayer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-4 sm:px-6 pt-32 sm:pt-36 pb-16 sm:pb-24 relative">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs px-3 py-1">
              Tarifs
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-heading font-semibold text-white mb-4 tracking-tight">
              Simple et transparent
            </h1>
            <p className="text-white/40 text-base sm:text-lg max-w-md mx-auto">
              Commencez gratuitement. Passez au niveau supérieur quand vous êtes prêt.
            </p>
          </motion.div>

          {/* Plans */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex flex-col p-5 sm:p-6 rounded-2xl border card-hover ${
                  plan.highlight
                    ? 'bg-purple-600/10 border-purple-500/40 sm:col-span-2 md:col-span-1'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      ⚡ Le plus populaire
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="text-white/50 text-sm mb-2">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-heading font-semibold text-white">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                    </span>
                    {plan.price > 0 && <span className="text-white/30 text-sm">/mois</span>}
                  </div>
                  <p className="text-white/30 text-xs">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-purple-400' : 'text-white/25'}`} />
                      <span className="text-white/60 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.href ? (
                  <Link href={plan.href}>
                    <Button className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/[0.06]">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.planKey)}
                      disabled={loadingPlan === plan.planKey}
                      className={`w-full rounded-xl gap-2 ${
                        plan.highlight
                          ? 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/20'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/[0.06]'
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
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Reassurance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mt-10 sm:mt-12 text-white/25 text-sm"
          >
            {['Annulation à tout moment', 'Paiement sécurisé par Stripe', 'Support par email'].map(t => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-white/20" />
                {t}
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
