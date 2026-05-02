'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, CheckCircle, ArrowRight, LayoutDashboard, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setSessionLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session)
      setSessionLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

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
            <span className="text-lg font-semibold tracking-tight">ShopScribe</span>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            {sessionLoading ? (
              <div className="w-48 h-9 rounded-xl bg-white/[0.04] animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 text-sm gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord
                  </Button>
                </Link>
                <Link href="/account">
                  <Button className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 rounded-xl gap-2">
                    <User className="h-4 w-4" />
                    Mon compte
                  </Button>
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="sm:hidden flex items-center gap-2">
            {!sessionLoading && isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs px-3">
                  Tableau de bord
                </Button>
              </Link>
            ) : !sessionLoading ? (
              <Link href="/signup">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs px-3">
                  Essayer
                </Button>
              </Link>
            ) : null}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative flex flex-col p-5 sm:p-6 rounded-2xl border card-hover ${
                  plan.highlight
                    ? 'bg-purple-600/10 border-purple-500/40'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
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
                    {plan.price > 0 && <span className="text-white/30 text-sm">paiement unique</span>}
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
            {['Sans abonnement', 'Paiement sécurisé par Stripe', 'Support par email'].map(t => (
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
