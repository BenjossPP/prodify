'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Crown, Sparkles, ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PLAN_GENERATIONS, PLAN_LABELS } from '@/lib/plans'

const PLAN_COLORS: Record<string, string> = {
  starter: 'from-blue-500 to-blue-700',
  pro: 'from-purple-500 to-purple-700',
  business: 'from-amber-500 to-amber-700',
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planFromUrl = searchParams.get('plan') || 'pro'

  const [verified, setVerified] = useState<boolean | null>(null)
  const [plan, setPlan] = useState(planFromUrl)
  const [tick, setTick] = useState(0)

  // Vérification en Supabase que le plan correspond bien
  useEffect(() => {
    async function verify() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (!profile || profile.plan === 'free') {
        // Pas encore mis à jour (webhook peut prendre quelques secondes) — on attend 3s et on réessaie
        await new Promise(r => setTimeout(r, 3000))
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()
        if (!retryProfile || retryProfile.plan === 'free') {
          router.replace('/pricing')
          return
        }
        setPlan(retryProfile.plan)
        setVerified(true)
      } else {
        setPlan(profile.plan)
        setVerified(true)
      }
    }
    verify()
  }, [router])

  // Compteur animé
  useEffect(() => {
    if (!verified) return
    const target = PLAN_GENERATIONS[plan] || 100
    const step = Math.ceil(target / 40)
    const interval = setInterval(() => {
      setTick(prev => {
        if (prev + step >= target) {
          clearInterval(interval)
          return target
        }
        return prev + step
      })
    }, 30)
    return () => clearInterval(interval)
  }, [plan, verified])

  if (verified === null) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin mb-4" />
        <p className="text-white/40 text-sm">Vérification du paiement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12 opacity-60 hover:opacity-100 transition-opacity ">
          <img src="/logo shopscribe.png" alt="ShopScribe" className="h-6 w-auto" />
        </Link>

        {/* Checkmark animé */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <Check className="h-9 w-9 text-green-400" strokeWidth={2.5} />
        </motion.div>

        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-semibold text-white mb-2">Paiement confirmé !</h1>
          <p className="text-white/40 text-sm">Bienvenue dans le plan {PLAN_LABELS[plan] || 'Pro'}.</p>
        </motion.div>

        {/* Card plan */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_COLORS[plan] || PLAN_COLORS.pro} flex items-center justify-center shadow-lg`}>
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Plan {PLAN_LABELS[plan] || 'Pro'} activé</p>
              <p className="text-xs text-white/40">Accès immédiat à toutes les fonctionnalités</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
            <span className="text-sm text-white/50">Générations disponibles</span>
            <span className="text-2xl font-bold text-white tabular-nums">
              {tick}
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-3 text-left">
            {[
              plan !== 'free' && 'Génération en masse (CSV)',
              plan !== 'free' && 'Profil de marque',
              'Historique complet',
              'Score SEO en temps réel',
            ].filter(Boolean).map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="text-xs text-white/60">{feature as string}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 gap-2 font-medium text-sm"
          >
            Aller au tableau de bord <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-white/25 mt-3">
            Un email de confirmation vous a été envoyé.
          </p>
        </motion.div>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
