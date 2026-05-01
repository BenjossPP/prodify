'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '@/components/animations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap, ArrowRight, CheckCircle, Star, Clock, TrendingUp,
  Sparkles, Shield, Globe, ChevronDown
} from 'lucide-react'
import { MobileMenu } from '@/components/mobile-menu'

const tickerItems = [
  'Sac à dos imperméable 30L',
  'Montre connectée Sport Pro',
  'Chaussures de trail X500',
  'Casque audio Bluetooth',
  'Lampe LED bureau réglable',
  'Tapis de yoga antidérapant',
  'Carnet cuir artisanal',
  'Cafetière à capsules',
  'Sac à dos imperméable 30L',
  'Montre connectée Sport Pro',
  'Chaussures de trail X500',
  'Casque audio Bluetooth',
  'Lampe LED bureau réglable',
  'Tapis de yoga antidérapant',
  'Carnet cuir artisanal',
  'Cafetière à capsules',
]

const features = [
  {
    icon: Sparkles,
    title: 'Titre optimisé SEO',
    desc: 'Un titre accrocheur de 80 caractères, calibré pour convertir et ranker sur Google.',
  },
  {
    icon: TrendingUp,
    title: 'Description persuasive',
    desc: '150 à 200 mots rédigés pour convaincre vos visiteurs et booster votre référencement.',
  },
  {
    icon: CheckCircle,
    title: '5 bullet points clés',
    desc: 'Les arguments essentiels de votre produit, présentés de façon claire et percutante.',
  },
  {
    icon: Shield,
    title: 'Meta description',
    desc: '160 caractères parfaits pour apparaître en bonne position dans les résultats Google.',
  },
  {
    icon: Star,
    title: 'Tags & mots-clés',
    desc: '5 tags générés automatiquement pour optimiser la visibilité sur les marketplaces.',
  },
  {
    icon: Globe,
    title: 'Français & Anglais',
    desc: 'Générez vos fiches dans les deux langues pour toucher un marché international.',
  },
]

const avatars = ['JM', 'SA', 'LB', 'TP', 'MR']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden noise">

      {/* Orbes de fond */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="orb-2 absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[100px]" />
        <div className="orb-3 absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-pink-600/8 blur-[100px]" />
      </div>

      {/* Navbar */}
      <motion.nav
        className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Prodify</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Tarifs</Link>
            <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Fonctionnalités</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 text-sm">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/25">
                Essayer gratuitement
              </Button>
            </Link>
          </div>
          {/* Mobile: hamburger */}
          <MobileMenu />
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">

          {/* Badge shimmer */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 px-3 sm:px-4 py-2 rounded-full border border-purple-500/30 shimmer">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-xs sm:text-sm text-purple-300 font-medium">Propulsé par GPT-4o · Bilingue FR / EN</span>
            </div>
          </FadeIn>

          {/* Titre */}
          <FadeIn delay={0.2}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-semibold leading-[1.05] mb-4 sm:mb-6 tracking-tight">
              Vos fiches produits{' '}
              <span className="gradient-text">en 10 secondes</span>
            </h1>
          </FadeIn>

          {/* Sous-titre */}
          <FadeIn delay={0.3}>
            <p className="text-base sm:text-xl text-white/50 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Générez des titres accrocheurs, descriptions SEO, bullet points et méta-descriptions
              prêts à coller sur Shopify, Etsy ou Amazon.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="glow-btn bg-purple-600 hover:bg-purple-500 text-white w-full sm:w-auto px-8 h-12 rounded-xl gap-2 text-base font-medium"
                  >
                    Générer ma première fiche
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/5 w-full sm:w-auto px-8 h-12 rounded-xl text-base"
                >
                  Voir les tarifs
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-white/30 text-sm">3 générations gratuites · Aucune carte requise</p>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.5}>
            <div className="flex items-center justify-center gap-3 mt-8 sm:mt-10 flex-wrap">
              <div className="flex -space-x-2">
                {avatars.map((a) => (
                  <div key={a} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-semibold text-white">
                    {a}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-white/50 text-sm">+500 vendeurs l&apos;utilisent déjà</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </section>

      {/* Ticker */}
      <div className="relative py-4 border-y border-white/5">
        <div className="ticker-wrap">
          <div className="flex gap-8 ticker-inner whitespace-nowrap">
            {tickerItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/30 shrink-0">
                <Zap className="h-3 w-3 text-purple-500/60 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Clock, value: '10 sec', label: 'par fiche produit' },
              { icon: TrendingUp, value: '+40%', label: 'de taux de conversion' },
              { icon: Globe, value: 'FR & EN', label: 'bilingue nativement' },
            ].map(({ icon: Icon, value, label }) => (
              <StaggerItem key={label}>
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center hover:border-purple-500/30 transition-colors card-hover flex sm:block items-center gap-4">
                  <Icon className="h-5 w-5 text-purple-400 shrink-0 sm:mx-auto sm:mb-3" />
                  <div>
                    <div className="text-2xl sm:text-3xl font-heading font-semibold text-white mb-0.5 sm:mb-1">{value}</div>
                    <div className="text-white/40 text-sm">{label}</div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Before / After */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs px-3 py-1">
                Résultat concret
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                Avant vs Après
              </h2>
              <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto">
                Collez un nom de produit, obtenez une fiche complète et professionnelle.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Avant */}
            <ScaleIn delay={0.1}>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] h-full">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-white/40 font-medium">Avant Prodify</span>
                </div>
                <div className="space-y-3">
                  <div className="text-white/30 text-sm">Nom du produit :</div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] text-white/60 text-sm font-mono">
                    Sac à dos imperméable 30L
                  </div>
                  <div className="text-white/30 text-sm mt-4">Description :</div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] text-white/30 text-sm italic">
                    Sac à dos imperméable, grande capacité, idéal pour la randonnée.
                    Disponible en plusieurs couleurs.
                  </div>
                  <div className="pt-2 text-red-400/60 text-xs">❌ Peu de mots-clés · Pas de SEO · Faible conversion</div>
                </div>
              </div>
            </ScaleIn>

            {/* Après */}
            <ScaleIn delay={0.2}>
              <div className="p-6 rounded-2xl bg-purple-600/5 border border-purple-500/20 h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-purple-300 font-medium">Après Prodify</span>
                </div>
                <div className="space-y-3 relative">
                  <div className="text-white/40 text-xs font-medium uppercase tracking-wide">Titre SEO</div>
                  <div className="text-white text-sm font-semibold">
                    Sac à Dos Imperméable 30L — Randonnée & Voyage | Ultra-Léger, Résistant
                  </div>
                  <div className="text-white/40 text-xs font-medium uppercase tracking-wide mt-3">Description</div>
                  <div className="text-white/70 text-sm leading-relaxed">
                    Conçu pour les aventuriers exigeants, ce sac à dos imperméable 30L offre une capacité généreuse dans un format compact et ultra-léger...
                  </div>
                  <div className="text-white/40 text-xs font-medium uppercase tracking-wide mt-3">Points clés</div>
                  <ul className="space-y-1">
                    {['Imperméabilité certifiée IPX6', 'Sangle ergonomique lombaire', 'Matière recyclée et durable'].map(p => (
                      <li key={p} className="flex gap-2 text-white/60 text-xs">
                        <span className="text-purple-400">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 text-green-400/70 text-xs">✓ SEO optimisé · Conversion élevée · Prêt à publier</div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-14">
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs px-3 py-1">
                Fonctionnalités
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto">
                Une fiche complète générée en une seule fois. Rien à configurer.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] card-hover h-full">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                Tarifs simples
              </h2>
              <p className="text-white/40 text-base sm:text-lg">Commencez gratuitement, évoluez sans friction.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { name: 'Gratuit', price: '0€', desc: 'Pour tester', features: ['10 fiches / mois', 'FR & EN', 'Tous les champs'], highlight: false },
              { name: 'Pro', price: '19€', desc: '/mois', features: ['500 fiches / mois', 'Export CSV/JSON', 'Historique', 'Upload en masse'], highlight: true },
              { name: 'Business', price: '49€', desc: '/mois', features: ['Illimité', 'Accès API', 'Ton personnalisé', 'Support prioritaire'], highlight: false },
            ].map(({ name, price, desc, features, highlight }) => (
              <StaggerItem key={name}>
                <div className={`p-5 sm:p-6 rounded-2xl border h-full flex flex-col card-hover ${highlight ? 'bg-purple-600/10 border-purple-500/40 sm:col-span-2 md:col-span-1' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                  {highlight && (
                    <div className="text-xs text-purple-400 font-medium mb-3 uppercase tracking-wide">⚡ Le plus populaire</div>
                  )}
                  <div className="mb-4">
                    <div className="text-white/50 text-sm mb-1">{name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-heading font-semibold text-white">{price}</span>
                      <span className="text-white/30 text-sm">{desc}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                        <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${highlight ? 'text-purple-400' : 'text-white/30'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button className={`w-full rounded-xl ${highlight ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
                      Commencer
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-purple-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4 relative">
                Prêt à gagner du temps ?
              </h2>
              <p className="text-white/50 mb-8 text-base sm:text-lg relative max-w-lg mx-auto">
                Rejoignez les vendeurs qui génèrent leurs fiches en secondes, pas en heures.
              </p>
              <Link href="/signup" className="inline-block w-full sm:w-auto">
                <motion.div className="inline-block w-full sm:w-auto" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="glow-btn bg-purple-600 hover:bg-purple-500 text-white w-full sm:w-auto px-10 h-12 rounded-xl gap-2 text-base font-medium relative"
                  >
                    Commencer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <p className="mt-4 text-white/25 text-sm">Aucune carte requise · Annulation à tout moment</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-white/70 font-medium text-sm">Prodify</span>
          </div>
          <p className="text-white/20 text-xs">© 2025 Prodify. Tous droits réservés.</p>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/pricing" className="hover:text-white/70 transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-white/70 transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">S&apos;inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
