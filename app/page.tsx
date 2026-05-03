'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FadeIn, StaggerContainer, StaggerItem, ScaleIn,
  SlideIn, TextReveal, AnimatedBadge, GlowPulse, CountUp
} from '@/components/animations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, CheckCircle, Star, Clock, TrendingUp,
  Sparkles, Shield, Globe, ChevronDown, Tag, Zap, Plus, Minus
} from 'lucide-react'
import { Navbar } from '@/components/navbar'

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
    title: '6 langues disponibles',
    desc: 'Générez vos fiches en 6 langues pour toucher un marché international.',
  },
]

const avatars = ['JM', 'SA', 'LB', 'TP', 'MR']

const faqItems = [
  {
    q: 'Comment fonctionne ShopScribe ?',
    a: 'Vous saisissez le nom de votre produit, quelques mots-clés et choisissez le ton et la langue. ShopScribe génère en quelques secondes un titre SEO, une description complète, 5 bullet points, une méta-description et des tags prêts à l\'emploi.',
  },
  {
    q: 'Les paiements sont-ils récurrents ?',
    a: 'Non. Tous nos plans sont des paiements uniques (one-time payment). Vous achetez un crédit de générations et l\'utilisez à votre rythme, sans abonnement ni frais cachés.',
  },
  {
    q: 'Que se passe-t-il quand j\'épuise mes générations ?',
    a: 'Vous pouvez racheter un plan à tout moment. Vos nouvelles générations s\'ajoutent à votre compte. Il n\'y a pas de date d\'expiration.',
  },
  {
    q: 'Sur quelles plateformes puis-je utiliser les fiches générées ?',
    a: 'Les fiches sont compatibles avec toutes les plateformes e-commerce : Shopify, WooCommerce, Etsy, Amazon, Cdiscount, PrestaShop, etc. Il suffit de copier-coller.',
  },
  {
    q: 'Quelles langues sont disponibles ?',
    a: 'ShopScribe supporte 6 langues nativement : français, anglais, espagnol, allemand, italien et néerlandais. La qualité est identique dans chaque langue.',
  },
  {
    q: 'Est-ce que je peux générer en masse ?',
    a: 'Oui, les plans Pro et Business incluent un upload CSV pour générer plusieurs fiches en une seule opération. Idéal pour les catalogues de plusieurs dizaines ou centaines de produits.',
  },
]

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {faqItems.map(({ q, a }, i) => (
        <motion.div
          key={i}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.065] overflow-hidden transition-colors duration-200"
          animate={{ borderColor: open === i ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.065)' }}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
          >
            <span className="font-medium text-white/90 text-sm sm:text-base">{q}</span>
            <span className="shrink-0 text-white/35">
              {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="px-5 pb-4 sm:px-6 sm:pb-5 text-white/48 text-sm leading-relaxed">
                  {a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-hidden noise bg-grid">

      {/* Orbes de fond */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute top-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full bg-purple-600/12 blur-[130px]" />
        <div className="orb-2 absolute top-[25%] right-[-12%] w-[550px] h-[550px] rounded-full bg-indigo-500/10 blur-[110px]" />
        <div className="orb-3 absolute bottom-[-8%] left-[25%] w-[450px] h-[450px] rounded-full bg-pink-600/8 blur-[110px]" />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-36 sm:pt-44 pb-16 sm:pb-24 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">

          {/* Badge — bounce spring */}
          <AnimatedBadge delay={0.1}>
            <div className="inline-flex items-center gap-2 mb-7 sm:mb-9 px-4 py-2 rounded-full border border-purple-500/25 shimmer">
              <Sparkles className="h-3.5 w-3.5 text-purple-300 shrink-0" />
              <span className="text-xs sm:text-sm text-purple-200/90 font-medium">Propulsé par l&apos;intelligence artificielle · 6 langues disponibles</span>
            </div>
          </AnimatedBadge>

          {/* Titre — chaque mot apparaît en cascade avec blur */}
          <div className="mb-5 sm:mb-7">
            <h1 className="text-4xl sm:text-6xl md:text-[4.5rem] font-heading font-semibold leading-[1.05] tracking-tight">
              <TextReveal text="Vos fiches produits" delay={0.15} />
              {' '}
              <motion.span
                className="gradient-text"
                style={{ display: 'inline-block' }}
                initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                en 10 secondes
              </motion.span>
            </h1>
          </div>

          {/* Sous-titre */}
          <FadeIn delay={0.55} blur>
            <p className="text-base sm:text-xl text-white/55 mb-9 sm:mb-11 max-w-2xl mx-auto leading-relaxed px-2">
              Générez des titres accrocheurs, descriptions SEO, bullet points et méta-descriptions
              prêts à coller sur Shopify, Etsy ou Amazon.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.65} direction="up" blur>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="glow-btn bg-purple-600 hover:bg-purple-500 text-white w-full sm:w-auto px-8 h-13 rounded-xl gap-2 text-base font-medium transition-colors duration-200"
                  >
                    Générer ma première fiche
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white/55 hover:text-white/90 hover:bg-white/[0.06] w-full sm:w-auto px-8 h-13 rounded-xl text-base border border-white/[0.07] hover:border-white/10 transition-all duration-200"
                  >
                    Voir les tarifs
                  </Button>
                </motion.div>
              </Link>
            </div>
            <motion.p
              className="mt-5 text-white/28 text-sm tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              3 générations gratuites · Aucune carte requise
            </motion.p>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.8} direction="up" blur>
            <div className="flex items-center justify-center gap-3 mt-10 sm:mt-12 flex-wrap">
              <div className="flex -space-x-2.5">
                {avatars.map((a, i) => (
                  <motion.div
                    key={a}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-[#080810] flex items-center justify-center text-[10px] font-semibold text-white shadow-sm"
                    initial={{ opacity: 0, scale: 0, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.85 + i * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
                  >
                    {a}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + i * 0.06, type: 'spring', stiffness: 400 }}
                    >
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </motion.span>
                  ))}
                </div>
                <span className="text-white/45 text-sm">+500 vendeurs l&apos;utilisent déjà</span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/18"
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────────── */}
      <div className="relative py-4 border-y border-white/[0.045]">
        <div className="ticker-wrap">
          <div className="flex gap-8 ticker-inner whitespace-nowrap">
            {tickerItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/28 shrink-0">
                <Zap className="h-3 w-3 text-purple-500/50 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-22 section-alt">
        <div className="max-w-4xl mx-auto">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" staggerDelay={0.15}>
            {[
              { icon: Clock, value: 10, suffix: ' sec', label: 'par fiche produit', color: 'text-purple-400', prefix: '' },
              { icon: TrendingUp, value: 40, suffix: '%', label: 'de taux de conversion', color: 'text-indigo-400', prefix: '+' },
              { icon: Globe, value: 6, suffix: ' langues', label: '6 langues nativement', color: 'text-pink-400', prefix: '' },
            ].map(({ icon: Icon, value, suffix, prefix, label, color }) => (
              <StaggerItem key={label}>
                <motion.div
                  className="p-6 sm:p-7 rounded-2xl bg-white/[0.035] border border-white/[0.07] text-center hover:border-purple-500/30 transition-all duration-300 card-hover flex sm:block items-center gap-4"
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <div className="w-10 h-10 rounded-xl icon-glow border flex items-center justify-center shrink-0 sm:mx-auto sm:mb-4">
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-1">
                      <CountUp value={value} suffix={suffix} prefix={prefix} duration={1.2} />
                    </div>
                    <div className="text-white/42 text-sm">{label}</div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <FadeIn blur>
            <div className="text-center mb-12 sm:mb-16">
              <AnimatedBadge>
                <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs px-3 py-1 rounded-full">
                  Résultat concret
                </Badge>
              </AnimatedBadge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                <TextReveal text="Avant vs Après" />
              </h2>
              <p className="text-white/42 text-base sm:text-lg max-w-xl mx-auto">
                Collez un nom de produit, obtenez une fiche complète et professionnelle.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Avant — slide depuis la gauche */}
            <SlideIn from="left" delay={0.1}>
              <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.025] border border-white/[0.06] h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <span className="text-sm text-white/38 font-medium">Avant ShopScribe</span>
                </div>
                <div className="space-y-3">
                  <div className="text-white/32 text-xs uppercase tracking-wide font-medium">Nom du produit</div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/55 text-sm font-mono">
                    Sac à dos imperméable 30L
                  </div>
                  <div className="text-white/32 text-xs uppercase tracking-wide font-medium mt-5">Description</div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/28 text-sm italic leading-relaxed">
                    Sac à dos imperméable, grande capacité, idéal pour la randonnée.
                    Disponible en plusieurs couleurs.
                  </div>
                  <div className="pt-3 flex items-center gap-2 text-red-400/55 text-xs">
                    <span>✗</span>
                    <span>Peu de mots-clés · Pas de SEO · Faible conversion</span>
                  </div>
                </div>
              </div>
            </SlideIn>

            {/* Après — slide depuis la droite avec GlowPulse */}
            <SlideIn from="right" delay={0.2}>
              <GlowPulse delay={0.5}>
                <div className="p-6 sm:p-7 rounded-2xl border h-full relative overflow-hidden pricing-highlight">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 via-transparent to-indigo-600/5 pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                  <div className="flex items-center gap-2 mb-6 relative">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-purple-200/90 font-medium">Après ShopScribe</span>
                  </div>
                  <div className="space-y-3 relative">
                    <div className="text-white/38 text-xs font-medium uppercase tracking-wide">Titre SEO</div>
                    <div className="text-white text-sm font-semibold leading-snug">
                      Sac à Dos Imperméable 30L — Randonnée & Voyage | Ultra-Léger, Résistant
                    </div>
                    <div className="text-white/38 text-xs font-medium uppercase tracking-wide mt-4">Description</div>
                    <div className="text-white/65 text-sm leading-relaxed">
                      Conçu pour les aventuriers exigeants, ce sac à dos imperméable 30L offre une capacité généreuse dans un format compact et ultra-léger...
                    </div>
                    <div className="text-white/38 text-xs font-medium uppercase tracking-wide mt-4">Points clés</div>
                    <ul className="space-y-1.5">
                      {['Imperméabilité certifiée IPX6', 'Sangle ergonomique lombaire', 'Matière recyclée et durable'].map((p, i) => (
                        <motion.li
                          key={p}
                          className="flex gap-2 text-white/60 text-xs items-center"
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                        >
                          <span className="text-purple-400 text-base leading-none">✓</span> {p}
                        </motion.li>
                      ))}
                    </ul>
                    <div className="pt-3 flex items-center gap-2 text-green-400/65 text-xs">
                      <span>✓</span>
                      <span>SEO optimisé · Conversion élevée · Prêt à publier</span>
                    </div>
                  </div>
                </div>
              </GlowPulse>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 section-alt">
        <div className="max-w-6xl mx-auto">
          <FadeIn blur>
            <div className="text-center mb-12 sm:mb-16">
              <AnimatedBadge>
                <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs px-3 py-1 rounded-full">
                  Fonctionnalités
                </Badge>
              </AnimatedBadge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                <TextReveal text="Tout ce dont vous avez besoin" />
              </h2>
              <p className="text-white/42 text-base sm:text-lg max-w-xl mx-auto">
                Une fiche complète générée en une seule fois. Rien à configurer.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" staggerDelay={0.08}>
            {features.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <motion.div
                  className="p-6 sm:p-7 rounded-2xl bg-white/[0.03] border border-white/[0.065] h-full group transition-all duration-300"
                  whileHover={{
                    y: -6,
                    borderColor: 'rgba(139,92,246,0.35)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    transition: { duration: 0.2 },
                  }}
                >
                  <motion.div
                    className="w-11 h-11 rounded-xl icon-glow border flex items-center justify-center mb-5"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Icon className="h-5 w-5 text-purple-400" />
                  </motion.div>
                  <h3 className="font-semibold text-white mb-2.5 text-[15px]">{title}</h3>
                  <p className="text-white/42 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <FadeIn blur>
            <div className="text-center mb-10 sm:mb-16">
              <AnimatedBadge>
                <Badge className="mb-4 bg-yellow-500/10 text-yellow-300 border-yellow-500/20 text-xs px-3 py-1 rounded-full">
                  Ils nous font confiance
                </Badge>
              </AnimatedBadge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                <TextReveal text="Ce que disent nos vendeurs" />
              </h2>
            </div>
          </FadeIn>

          {/* Mobile : scroll horizontal snappable — Desktop : grille 3 colonnes */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none pb-4 sm:pb-0 scrollbar-none">
              {[
                {
                  name: 'Julie M.',
                  role: 'Etsy · bijoux faits main',
                  avatar: 'JM',
                  text: 'Honnêtement j\'étais sceptique au début. Mais j\'ai testé sur 3 produits et c\'était vraiment bien. Maintenant j\'écris plus une seule fiche moi-même. Je retouche un mot par-ci par-là, c\'est tout.',
                  stars: 5,
                },
                {
                  name: 'Thomas P.',
                  role: 'Shopify · accessoires tech',
                  avatar: 'TP',
                  text: 'J\'avais 140 refs à migrer sur un nouveau shop. Avec le CSV j\'ai tout passé en une soirée. Y\'a eu 2-3 fiches un peu génériques que j\'ai refaites, mais le reste était utilisable direct.',
                  stars: 4,
                },
                {
                  name: 'Sarah A.',
                  role: 'Amazon FBA · prêt-à-porter',
                  avatar: 'SA',
                  text: 'Les bullet points pour Amazon sont vraiment bien structurés. Je pensais devoir tout reformater mais non. Mes rankings ont bougé positivement sur quelques produits, difficile d\'isoler la cause exacte mais bon.',
                  stars: 5,
                },
                {
                  name: 'Lucas B.',
                  role: 'Agence web · e-commerce',
                  avatar: 'LB',
                  text: 'On l\'a intégré dans notre process client. Ça remplace pas le copywriter pour les gros comptes, mais pour les petites boutiques c\'est parfait. Le gain de temps est réel, on facture plus vite.',
                  stars: 4,
                },
                {
                  name: 'Marie R.',
                  role: 'WooCommerce · cosmétiques bio',
                  avatar: 'MR',
                  text: 'Ce qui m\'a convaincue c\'est la cohérence du ton. J\'avais paramétré mon profil de marque et ça s\'est senti dans les textes. Quelques ajustements sur le vocabulaire mais globalement très bon.',
                  stars: 5,
                },
                {
                  name: 'Nicolas F.',
                  role: 'Vente multi-canaux · Europe',
                  avatar: 'NF',
                  text: 'Je vends en FR, ES et DE. L\'espagnol est vraiment propre. L\'allemand... disons que c\'est correct, j\'ai un partenaire là-bas qui valide. Dans l\'ensemble ça m\'évite de payer 3 traducteurs.',
                  stars: 5,
                },
              ].map(({ name, role, avatar, text, stars }) => (
                <motion.div
                  key={name}
                  className="snap-start shrink-0 w-[78vw] xs:w-[72vw] sm:w-auto p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065] flex flex-col gap-4 transition-all duration-300"
                  whileHover={{ y: -4, borderColor: 'rgba(139,92,246,0.3)', transition: { duration: 0.2 } }}
                >
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-white/10 text-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <div className="text-white/85 text-sm font-medium">{name}</div>
                      <div className="text-white/35 text-xs">{role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Indicateur de scroll — mobile only */}
            <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`rounded-full bg-white/20 transition-all ${i === 0 ? 'w-4 h-1.5' : 'w-1.5 h-1.5'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <FadeIn blur>
            <div className="text-center mb-12 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-4">
                <TextReveal text="Tarifs simples" />
              </h2>
              <p className="text-white/42 text-base sm:text-lg">Commencez gratuitement, évoluez sans friction.</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" staggerDelay={0.1}>
            {[
              { name: 'Gratuit', price: '0€', desc: '', features: ['3 fiches', 'FR & EN', 'Tous les champs'], highlight: false },
              { name: 'Starter', price: '9€', desc: 'paiement unique', features: ['25 fiches', 'FR & EN', 'Tous les champs', 'Historique'], highlight: false },
              { name: 'Pro', price: '29€', desc: 'paiement unique', features: ['100 fiches', 'Export CSV/JSON', 'Historique', 'Upload en masse'], highlight: true },
              { name: 'Business', price: '59€', desc: 'paiement unique', features: ['500 fiches', 'Ton personnalisé', 'Upload en masse', 'Support prioritaire'], highlight: false },
            ].map(({ name, price, desc, features, highlight }) => (
              <StaggerItem key={name}>
                <motion.div
                  className={`p-5 sm:p-6 rounded-2xl border h-full flex flex-col relative overflow-hidden transition-all duration-300 ${highlight ? 'pricing-highlight' : 'bg-white/[0.03] border-white/[0.065]'}`}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  {highlight && (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
                      <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium mb-4">
                        <Zap className="h-3 w-3 fill-purple-400 text-purple-400" />
                        Le plus populaire
                      </div>
                    </>
                  )}
                  <div className="mb-5">
                    <div className={`text-sm mb-1.5 font-medium ${highlight ? 'text-white/80' : 'text-white/45'}`}>{name}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-heading font-semibold text-white">{price}</span>
                      <span className="text-white/28 text-xs">{desc}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {features.map((f, i) => (
                      <motion.li
                        key={f}
                        className="flex items-center gap-2 text-sm text-white/52"
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                      >
                        <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${highlight ? 'text-purple-400' : 'text-white/25'}`} />
                        {f}
                      </motion.li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button className={`w-full rounded-xl font-medium transition-all duration-200 ${highlight ? 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/25' : 'bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/85 border border-white/[0.08]'}`}>
                      Commencer
                      {highlight && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                    </Button>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn delay={0.4}>
            <p className="text-center mt-8 text-white/28 text-sm">
              <Link href="/pricing" className="hover:text-white/55 transition-colors underline underline-offset-4 decoration-white/15">
                Voir le détail des plans →
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 section-alt">
        <div className="max-w-3xl mx-auto">
          <FadeIn blur>
            <div className="text-center mb-10 sm:mb-12">
              <AnimatedBadge>
                <Badge className="mb-4 bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs px-3 py-1 rounded-full">
                  FAQ
                </Badge>
              </AnimatedBadge>
              <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-white">
                <TextReveal text="Questions fréquentes" />
              </h2>
            </div>
          </FadeIn>

          <FaqAccordion />
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-16 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <ScaleIn>
            <div className="relative p-10 sm:p-14 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-indigo-600/12 to-pink-600/8 rounded-3xl" />
              <div className="absolute inset-0 border border-purple-500/25 rounded-3xl" />
              <div className="absolute inset-[1px] border border-white/[0.04] rounded-3xl" />
              <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
              <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-purple-600/15 blur-[80px] pointer-events-none" />

              <div className="relative">
                <AnimatedBadge delay={0.1}>
                  <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Prêt en 10 secondes
                  </div>
                </AnimatedBadge>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-semibold text-white mb-5">
                  <TextReveal text="Prêt à gagner du temps ?" delay={0.1} />
                </h2>

                <FadeIn delay={0.3} blur>
                  <p className="text-white/52 mb-9 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                    Rejoignez les vendeurs qui génèrent leurs fiches en secondes, pas en heures.
                  </p>
                </FadeIn>

                <FadeIn delay={0.4}>
                  <Link href="/signup" className="inline-block w-full sm:w-auto">
                    <motion.div className="inline-block w-full sm:w-auto" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        size="lg"
                        className="glow-btn bg-purple-600 hover:bg-purple-500 text-white w-full sm:w-auto px-10 h-13 rounded-xl gap-2 text-base font-medium transition-colors duration-200"
                      >
                        Commencer gratuitement
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.span>
                      </Button>
                    </motion.div>
                  </Link>
                  <p className="mt-5 text-white/25 text-sm">Aucune carte requise · Annulation à tout moment</p>
                </FadeIn>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.055] px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Tag className="h-3 w-3 text-white" />
            </div>
            <span className="text-white/65 font-medium text-sm tracking-tight">ShopScribe</span>
          </div>
          <p className="text-white/22 text-xs">© {new Date().getFullYear()} ShopScribe. Tous droits réservés.</p>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/pricing" className="hover:text-white/65 transition-colors">Tarifs</Link>
            <Link href="/login" className="hover:text-white/65 transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-white/65 transition-colors">S&apos;inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
