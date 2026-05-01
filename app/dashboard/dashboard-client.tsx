'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Copy, Check, LogOut, History, Sparkles,
  Crown, ArrowRight, FileText, Tag, AlignLeft, Hash
} from 'lucide-react'
import Link from 'next/link'

interface Profile { plan: string; generations_used: number }
interface Generation { id: string; product_name: string; created_at: string; result: ProductSheet }
interface ProductSheet {
  title: string
  description: string
  bulletPoints: string[]
  metaDescription: string
  tags: string[]
}

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 500, business: -1 }
const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', pro: 'Pro', business: 'Business' }

export default function DashboardClient({
  user, profile, history,
}: {
  user: { email: string }
  profile: Profile
  history: Generation[]
}) {
  const [productName, setProductName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [category, setCategory] = useState('Général')
  const [tone, setTone] = useState('professionnel')
  const [language, setLanguage] = useState('fr')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProductSheet | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const limit = PLAN_LIMITS[profile.plan]
  const used = profile.generations_used
  const remaining = limit === -1 ? '∞' : Math.max(0, limit - used)
  const pct = limit === -1 ? 0 : Math.min(100, (used / limit) * 100)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, keywords, category, tone, language }),
    })
    const data = await res.json()

    if (!res.ok) setError(data.error || 'Erreur lors de la génération')
    else { setResult(data.data); router.refresh() }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyAll() {
    if (!result) return
    copy(
      `TITRE:\n${result.title}\n\nDESCRIPTION:\n${result.description}\n\nPOINTS CLÉS:\n${result.bulletPoints.map(b => `• ${b}`).join('\n')}\n\nMETA DESCRIPTION:\n${result.metaDescription}\n\nTAGS:\n${result.tags.join(', ')}`,
      'all'
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Orbes subtiles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/80">Prodify</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              className={`text-xs px-2 sm:px-3 py-1 rounded-full border-0 font-medium ${
                profile.plan === 'free'
                  ? 'bg-white/5 text-white/50'
                  : 'bg-purple-600/20 text-purple-300'
              }`}
            >
              {profile.plan !== 'free' && <Crown className="h-3 w-3 mr-1" />}
              {PLAN_LABELS[profile.plan]}
            </Badge>
            <span className="text-white/30 text-xs hidden sm:block truncate max-w-[160px]">{user.email}</span>
            <button onClick={handleLogout} className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
        {/* Quota */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-white/60">
                {limit === -1
                  ? 'Générations illimitées'
                  : `${used} / ${limit} générations utilisées ce mois`}
              </span>
              <span className="text-xs sm:text-sm font-medium text-white">
                {remaining === '∞' ? '∞ restantes' : `${remaining} restantes`}
              </span>
            </div>
            {limit !== -1 && (
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
          {profile.plan === 'free' && (
            <Link href="/pricing" className="shrink-0 w-full sm:w-auto">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs gap-1.5 px-3 w-full sm:w-auto">
                <Crown className="h-3 w-3" /> Passer Pro
              </Button>
            </Link>
          )}
        </motion.div>

        <Tabs defaultValue="generate">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-6 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="generate" className="flex-1 sm:flex-none rounded-lg text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-4">
              <Sparkles className="h-3.5 w-3.5 mr-2" /> Générer
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none rounded-lg text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-4">
              <History className="h-3.5 w-3.5 mr-2" /> Historique
            </TabsTrigger>
          </TabsList>

          {/* Onglet Générer */}
          <TabsContent value="generate">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Formulaire */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              >
                <h2 className="text-base font-semibold text-white mb-5">Votre produit</h2>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Nom du produit *</Label>
                    <Input
                      placeholder="ex: Sac à dos imperméable 30L"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Mots-clés *</Label>
                    <Input
                      placeholder="ex: randonnée, étanche, léger, voyage"
                      value={keywords}
                      onChange={e => setKeywords(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Catégorie</Label>
                      <Select value={category} onValueChange={v => setCategory(v ?? 'Général')}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13131a] border-white/[0.08] rounded-xl">
                          {['Général', 'Mode', 'Électronique', 'Sport', 'Maison', 'Beauté', 'Alimentation', 'Bijoux'].map(c => (
                            <SelectItem key={c} value={c} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Langue</Label>
                      <Select value={language} onValueChange={v => setLanguage((v ?? 'fr') as 'fr' | 'en')}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13131a] border-white/[0.08] rounded-xl">
                          <SelectItem value="fr" className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">🇫🇷 Français</SelectItem>
                          <SelectItem value="en" className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">🇬🇧 English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Ton</Label>
                    <Select value={tone} onValueChange={v => setTone(v ?? 'professionnel')}>
                      <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#13131a] border-white/[0.08] rounded-xl">
                        {[
                          { value: 'professionnel', label: 'Professionnel' },
                          { value: 'casual', label: 'Décontracté' },
                          { value: 'luxueux', label: 'Luxueux' },
                          { value: 'technique', label: 'Technique' },
                          { value: 'fun', label: 'Fun & Dynamique' },
                        ].map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-11 gap-2 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Générer la fiche produit
                          <ArrowRight className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>

              {/* Résultat */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-base font-semibold text-white">Résultat</h2>
                        <button
                          onClick={copyAll}
                          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10"
                        >
                          {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                          Tout copier
                        </button>
                      </div>

                      {/* Titre */}
                      <ResultCard id="title" label="Titre SEO" icon={FileText} content={result.title} copied={copied} onCopy={copy} />

                      {/* Meta */}
                      <ResultCard id="meta" label="Meta description" icon={Hash} content={result.metaDescription} copied={copied} onCopy={copy} />

                      {/* Description */}
                      <ResultCard id="desc" label="Description" icon={AlignLeft} content={result.description} copied={copied} onCopy={copy} multiline />

                      {/* Bullets */}
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
                              <CheckCircleIcon className="h-3 w-3 text-purple-400" />
                            </div>
                            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Points clés</span>
                          </div>
                          <CopyButton id="bullets" copied={copied} onCopy={() => copy(result.bulletPoints.map(b => `• ${b}`).join('\n'), 'bullets')} />
                        </div>
                        <ul className="space-y-2">
                          {result.bulletPoints.map((bp, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              className="flex gap-2 text-sm text-white/70"
                            >
                              <span className="text-purple-400 mt-0.5 shrink-0">›</span> {bp}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* Tags */}
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
                            <Tag className="h-3 w-3 text-purple-400" />
                          </div>
                          <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center text-white/20 py-24">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="h-7 w-7 text-white/10" />
                        </div>
                        <p className="text-sm">Votre fiche produit apparaîtra ici</p>
                        <p className="text-xs mt-1 text-white/10">Remplissez le formulaire et cliquez sur Générer</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              {history.length === 0 ? (
                <div className="text-center text-white/20 py-16">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune génération pour le moment</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((gen, i) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white/80 text-sm font-medium truncate">{gen.product_name}</p>
                        {gen.result?.title && (
                          <p className="text-white/30 text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">{gen.result.title}</p>
                        )}
                      </div>
                      <span className="text-white/25 text-xs shrink-0">
                        {new Date(gen.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopyButton({ id, copied, onCopy }: { id: string; copied: string | null; onCopy: () => void }) {
  return (
    <button onClick={onCopy} className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-md hover:bg-white/[0.04]">
      {copied === id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function ResultCard({
  id, label, icon: Icon, content, copied, onCopy, multiline = false,
}: {
  id: string
  label: string
  icon: React.ElementType
  content: string
  copied: string | null
  onCopy: (text: string, id: string) => void
  multiline?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
            <Icon className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
        </div>
        <CopyButton id={id} copied={copied} onCopy={() => onCopy(content, id)} />
      </div>
      <p className={`text-white/80 text-sm ${multiline ? 'leading-relaxed' : ''}`}>{content}</p>
    </motion.div>
  )
}
