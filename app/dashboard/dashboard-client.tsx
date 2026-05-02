'use client'

import Papa from 'papaparse'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Copy, Check, LogOut, History, Sparkles,
  Crown, ArrowRight, FileText, Tag, AlignLeft, Hash,
  Upload, BarChart2, Layers, Building2, X, Download,
  ChevronLeft, ChevronRight, Save, RefreshCw, AlertCircle,
  Pencil, BookmarkPlus, Bookmark, Columns, ChevronDown, ChevronUp,
  Info, HelpCircle, ImagePlus, Monitor, Smartphone, Eye, ShoppingCart,
  Star
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  plan: string
  generations_used: number
  brand_profile: BrandProfile | null
  is_new?: boolean
}

interface BrandProfile {
  description?: string
  keywords?: string[]
  avoidWords?: string[]
  exampleText?: string
}

interface Generation {
  id: string
  product_name: string
  created_at: string
  result: ProductSheet
}

interface ProductSheet {
  title: string
  description: string
  bulletPoints: string[]
  metaDescription: string
  tags: string[]
}

interface BulkRow {
  productName: string
  keywords: string
  category?: string
  tone?: string
  language?: string
}

interface BulkResult extends ProductSheet {
  productName: string
  error: string | null
}

interface SavedTemplate {
  id: string
  name: string
  category: string
  tone: string
  language: string
  keywords: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = { free: 3, starter: 25, pro: 100, business: 500 }
const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business' }

const CATEGORIES = ['Général', 'Mode', 'Électronique', 'Sport', 'Maison', 'Beauté', 'Alimentation', 'Bijoux']
const TONES = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'luxueux', label: 'Luxueux' },
  { value: 'technique', label: 'Technique' },
  { value: 'fun', label: 'Fun & Dynamique' },
]

const LANGUAGES = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'it', label: '🇮🇹 Italiano' },
  { value: 'nl', label: '🇳🇱 Nederlands' },
]

const ONBOARDING_STEPS = [
  {
    title: 'Bienvenue sur ShopScribe ! 👋',
    description: 'Créez des fiches produits qui convertissent en quelques secondes. Laissez-nous vous guider en 3 étapes.',
    tip: null,
  },
  {
    title: 'Étape 1 — Définissez votre marque',
    description: 'Rendez-vous dans l\'onglet "Ma Marque" pour configurer votre identité. L\'IA s\'adaptera automatiquement à votre style pour chaque génération.',
    tip: 'Plus vous décrivez précisément votre marque, plus les fiches seront personnalisées.',
  },
  {
    title: 'Étape 2 — Générez votre première fiche',
    description: 'Dans l\'onglet "Générer", entrez un nom de produit et des mots-clés. Vous obtenez un titre SEO, une description, des bullet points et des tags en 10 secondes.',
    tip: 'Activez "3 variantes A/B" pour comparer différentes approches rédactionnelles.',
  },
  {
    title: 'Étape 3 — Exportez et publiez',
    description: 'Copiez chaque champ individuellement ou tout d\'un coup avec "Tout copier". Collez directement dans Shopify, Etsy ou Amazon.',
    tip: 'Utilisez la génération en masse pour traiter tout un catalogue depuis un fichier CSV.',
  },
]

// ─── SEO Score ─────────────────────────────────────────────────────────────────

interface SEOCriteria {
  label: string
  passed: boolean
  points: number
  suggestion: string
}

function calculateSEOScore(result: ProductSheet, keywords: string): { score: number; criteria: SEOCriteria[] } {
  const keywordList = keywords.toLowerCase().split(',').map(k => k.trim()).filter(Boolean)
  const primaryKeyword = keywordList[0] || ''

  const titleHasPrimary = primaryKeyword ? result.title.toLowerCase().includes(primaryKeyword) : false
  const titleLength = result.title.length
  const titleLengthOk = titleLength >= 40 && titleLength <= 80
  const metaLength = result.metaDescription.length
  const metaLengthOk = metaLength >= 100 && metaLength <= 160
  const descHasPrimary = primaryKeyword ? result.description.toLowerCase().includes(primaryKeyword) : false
  const tagsHaveKeywords = keywordList.filter(k => result.tags.some(t => t.toLowerCase().includes(k))).length >= Math.min(2, keywordList.length)
  const wordCount = result.description.split(/\s+/).length
  const descLong = wordCount >= 100

  const criteria: SEOCriteria[] = [
    {
      label: 'Mot-clé principal dans le titre',
      passed: titleHasPrimary,
      points: 20,
      suggestion: primaryKeyword
        ? `Intégrez "${primaryKeyword}" naturellement dans le titre`
        : 'Ajoutez un mot-clé principal dans le formulaire',
    },
    {
      label: `Titre entre 40–80 caractères (${titleLength})`,
      passed: titleLengthOk,
      points: 15,
      suggestion: titleLength < 40
        ? `Titre trop court (${titleLength} car.) — ajoutez ${40 - titleLength} caractères min.`
        : `Titre trop long (${titleLength} car.) — raccourcissez de ${titleLength - 80} caractères`,
    },
    {
      label: `Meta entre 100–160 caractères (${metaLength})`,
      passed: metaLengthOk,
      points: 15,
      suggestion: metaLength < 100
        ? `Meta trop courte (${metaLength} car.) — développez avec un bénéfice produit`
        : `Meta trop longue (${metaLength} car.) — Google tronquera à 160 caractères`,
    },
    {
      label: 'Mot-clé principal dans la description',
      passed: descHasPrimary,
      points: 15,
      suggestion: primaryKeyword
        ? `Mentionnez "${primaryKeyword}" dans les 2 premières phrases`
        : 'Ajoutez un mot-clé principal dans le formulaire',
    },
    {
      label: 'Mots-clés représentés dans les tags',
      passed: tagsHaveKeywords,
      points: 20,
      suggestion: 'Éditez les tags pour y inclure vos mots-clés principaux',
    },
    {
      label: `Description suffisamment longue (${wordCount} mots)`,
      passed: descLong,
      points: 15,
      suggestion: `Ajoutez ${100 - wordCount} mots supplémentaires — décrivez l'usage, les matériaux ou les bénéfices`,
    },
  ]

  const score = criteria.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0)
  return { score, criteria }
}

function SEOScorePanel({ result, keywords }: { result: ProductSheet; keywords: string }) {
  const { score, criteria } = calculateSEOScore(result, keywords)
  const [expanded, setExpanded] = useState(false)
  const color = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bgColor = score >= 75 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'
  const barColor = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const failedCriteria = criteria.filter(c => !c.passed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl border ${bgColor}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-white/50" />
          <span className="text-xs font-medium uppercase tracking-wide text-white/50">Score SEO</span>
        </div>
        <span className={`text-2xl font-bold ${color}`}>{score}<span className="text-sm font-normal text-white/30">/100</span></span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Critères */}
      <div className="space-y-1.5">
        {criteria.map((c, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs">
              <span className={c.passed ? 'text-green-400' : 'text-white/20'}>
                {c.passed ? '✓' : '○'}
              </span>
              <span className={c.passed ? 'text-white/60' : 'text-white/25'}>{c.label}</span>
              <span className={`ml-auto ${c.passed ? 'text-white/40' : 'text-white/15'}`}>+{c.points}</span>
            </div>
            {/* Suggestion actionnable si le critère est raté */}
            {!c.passed && (
              <div className="flex items-start gap-1.5 ml-4 mt-0.5">
                <Info className="h-3 w-3 text-amber-400/60 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/70 leading-snug">{c.suggestion}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Résumé si score parfait */}
      {score === 100 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-400/80">
          <Check className="h-3.5 w-3.5" />
          Tous les critères SEO sont satisfaits — excellent !
        </div>
      )}
    </motion.div>
  )
}

// ─── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder || 'Tapez et appuyez sur Entrée'}
          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0"
        />
        <Button type="button" onClick={add} size="sm" variant="outline" className="border-white/10 text-white/50 hover:text-white rounded-xl shrink-0">
          +
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs">
              {tag}
              <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="text-purple-400/60 hover:text-purple-300 ml-0.5">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ id, copied, onCopy }: { id: string; copied: string | null; onCopy: () => void }) {
  return (
    <button onClick={onCopy} className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-md hover:bg-white/[0.04]">
      {copied === id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Editable Result Card ──────────────────────────────────────────────────────

function EditableResultCard({
  id, label, icon: Icon, content, onContentChange, copied, onCopy, multiline = false,
}: {
  id: string
  label: string
  icon: React.ElementType
  content: string
  onContentChange: (v: string) => void
  copied: string | null
  onCopy: (text: string, id: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)

  // sync if content changes externally (new generation)
  useEffect(() => {
    setDraft(content)
    setEditing(false)
  }, [content])

  function commit() {
    onContentChange(draft)
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.065] group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
            <Icon className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {!editing && (
            <button
              onClick={() => { setDraft(content); setEditing(true) }}
              className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-md hover:bg-white/[0.04] opacity-0 group-hover:opacity-100"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <CopyButton id={id} copied={copied} onCopy={() => onCopy(content, id)} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              rows={multiline ? 5 : 2}
              className="w-full bg-white/[0.04] border border-purple-500/40 text-white text-sm rounded-xl p-2 resize-none focus:outline-none focus:border-purple-500/70"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={commit}
                className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
              >
                <Check className="h-3 w-3" /> Valider
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors"
              >
                <X className="h-3 w-3" /> Annuler
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.p key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-white/80 text-sm ${multiline ? 'leading-relaxed' : ''}`}>
            {content}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Editable Product Sheet ────────────────────────────────────────────────────

function EditableProductSheetDisplay({ result, onResultChange, suffix, copied, onCopy }: {
  result: ProductSheet
  onResultChange: (r: ProductSheet) => void
  suffix?: string
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  const s = suffix || ''
  const [editingBullets, setEditingBullets] = useState(false)
  const [bulletDraft, setBulletDraft] = useState(result.bulletPoints.join('\n'))
  const [editingTags, setEditingTags] = useState(false)
  const [tagDraft, setTagDraft] = useState(result.tags.join(', '))

  useEffect(() => {
    setBulletDraft(result.bulletPoints.join('\n'))
    setTagDraft(result.tags.join(', '))
    setEditingBullets(false)
    setEditingTags(false)
  }, [result])

  return (
    <div className="space-y-3">
      <EditableResultCard
        id={`title${s}`} label="Titre SEO" icon={FileText}
        content={result.title} onContentChange={v => onResultChange({ ...result, title: v })}
        copied={copied} onCopy={onCopy}
      />
      <EditableResultCard
        id={`meta${s}`} label="Meta description" icon={Hash}
        content={result.metaDescription} onContentChange={v => onResultChange({ ...result, metaDescription: v })}
        copied={copied} onCopy={onCopy}
      />
      <EditableResultCard
        id={`desc${s}`} label="Description" icon={AlignLeft}
        content={result.description} onContentChange={v => onResultChange({ ...result, description: v })}
        copied={copied} onCopy={onCopy} multiline
      />

      {/* Points clés éditables */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.065] group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Points clés</span>
          </div>
          <div className="flex items-center gap-1">
            {!editingBullets && (
              <button
                onClick={() => { setBulletDraft(result.bulletPoints.join('\n')); setEditingBullets(true) }}
                className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-md hover:bg-white/[0.04] opacity-0 group-hover:opacity-100"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <CopyButton id={`bullets${s}`} copied={copied} onCopy={() => onCopy(result.bulletPoints.map(b => `• ${b}`).join('\n'), `bullets${s}`)} />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {editingBullets ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-white/30 mb-2">Un point par ligne</p>
              <Textarea
                value={bulletDraft}
                onChange={e => setBulletDraft(e.target.value)}
                autoFocus
                rows={5}
                className="w-full bg-white/[0.04] border border-purple-500/40 text-white text-sm rounded-xl p-2 resize-none focus:outline-none focus:border-purple-500/70"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const pts = bulletDraft.split('\n').map(l => l.trim()).filter(Boolean)
                    onResultChange({ ...result, bulletPoints: pts })
                    setEditingBullets(false)
                  }}
                  className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  <Check className="h-3 w-3" /> Valider
                </button>
                <button onClick={() => setEditingBullets(false)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors">
                  <X className="h-3 w-3" /> Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.ul key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {result.bulletPoints.map((bp, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex gap-2 text-sm text-white/70">
                  <span className="text-purple-400 mt-0.5 shrink-0">›</span> {bp}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tags éditables */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.065] group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
              <Tag className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Tags</span>
          </div>
          {!editingTags && (
            <button
              onClick={() => { setTagDraft(result.tags.join(', ')); setEditingTags(true) }}
              className="text-white/20 hover:text-white/50 transition-colors p-1 rounded-md hover:bg-white/[0.04] opacity-0 group-hover:opacity-100"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <AnimatePresence mode="wait">
          {editingTags ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-white/30 mb-2">Séparez les tags par des virgules</p>
              <Input
                value={tagDraft}
                onChange={e => setTagDraft(e.target.value)}
                autoFocus
                className="bg-white/[0.04] border border-purple-500/40 text-white rounded-xl focus:border-purple-500/70"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const tags = tagDraft.split(',').map(t => t.trim()).filter(Boolean)
                    onResultChange({ ...result, tags })
                    setEditingTags(false)
                  }}
                  className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  <Check className="h-3 w-3" /> Valider
                </button>
                <button onClick={() => setEditingTags(false)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors">
                  <X className="h-3 w-3" /> Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
              {result.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs">{tag}</span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ─── Onboarding Modal ─────────────────────────────────────────────────────────

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#10101a] border border-white/[0.09] rounded-2xl p-6 shadow-2xl shadow-black/60"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === step ? 'bg-purple-500 w-6' : i < step ? 'bg-purple-500/40 w-3' : 'bg-white/10 w-3'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white mb-2">{current.title}</h2>
            <p className="text-sm text-white/60 leading-relaxed mb-4">{current.description}</p>
            {current.tip && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 mb-4">
                <HelpCircle className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-300/80 leading-relaxed">{current.tip}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Passer l&apos;intro
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.065] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Précédent
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setStep(s => s + 1)}
              className="flex items-center gap-1 text-xs text-white px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors font-medium"
            >
              {isLast ? (
                <><Sparkles className="h-3.5 w-3.5" /> C&apos;est parti !</>
              ) : (
                <>Suivant <ChevronRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Product Preview Modal ────────────────────────────────────────────────────

function ProductPreviewModal({ result, productName, imagePreview, onClose }: {
  result: ProductSheet
  productName: string
  imagePreview: string | null
  onClose: () => void
}) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#10101a] border border-white/[0.09] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.065] shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Prévisualisation</span>
          </div>
          {/* Desktop / Mobile switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-[#0d0d14] p-6 flex items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className={viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-3xl'}
            >
              {/* Simulated product page — white light theme */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl font-sans">
                {/* Fake store nav */}
                <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-800" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Ma Boutique</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-2 bg-gray-200 rounded" />
                    <div className="w-12 h-2 bg-gray-200 rounded" />
                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Breadcrumb */}
                <div className="px-6 pt-4 pb-2">
                  <p className="text-xs text-gray-400">Accueil / Produits / <span className="text-gray-600">{productName}</span></p>
                </div>

                {/* Product layout */}
                <div className={`px-6 pb-8 ${viewMode === 'desktop' ? 'grid grid-cols-2 gap-8' : 'flex flex-col gap-4'}`}>

                  {/* Image */}
                  <div className="space-y-2">
                    <div className={`rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center ${viewMode === 'mobile' ? 'h-56' : 'aspect-square'}`}>
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imagePreview} alt={productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-300">
                          <ImagePlus className="h-10 w-10" />
                          <span className="text-xs">Photo produit</span>
                        </div>
                      )}
                    </div>
                    {viewMode === 'desktop' && (
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center ${i === 0 ? 'ring-2 ring-gray-800' : ''}`}>
                            {i === 0 && imagePreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imagePreview} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <div className="w-5 h-5 bg-gray-200 rounded" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="space-y-4 py-2">
                    {/* Title */}
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 leading-tight">{result.title}</h1>
                      {/* Stars */}
                      <div className="flex items-center gap-1 mt-2">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">4.0 (127 avis)</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">€XX,XX</span>
                      <span className="text-sm text-gray-400 line-through">€XX,XX</span>
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">-XX%</span>
                    </div>

                    {/* Bullet points */}
                    <ul className="space-y-2">
                      {result.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="space-y-2 pt-1">
                      <button className="w-full bg-gray-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Ajouter au panier
                      </button>
                      <button className="w-full bg-white text-gray-800 border border-gray-200 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
                        Acheter maintenant
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description section */}
                <div className="px-6 pb-8 border-t border-gray-100 pt-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.description}</p>
                </div>

                {/* Meta info */}
                <div className="px-6 pb-6 bg-gray-50 pt-4">
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Meta description (SEO)</p>
                  <p className="text-xs text-gray-500 italic">{result.metaDescription}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  user, profile, history,
}: {
  user: { email: string }
  profile: Profile
  history: Generation[]
}) {
  const router = useRouter()
  const supabase = createClient()

  // Generate tab state
  const [productName, setProductName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [category, setCategory] = useState('Général')
  const [tone, setTone] = useState('professionnel')
  const [language, setLanguage] = useState('fr')
  const [withVariants, setWithVariants] = useState(false)
  const [abSideBySide, setAbSideBySide] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProductSheet | null>(null)
  const [variantResults, setVariantResults] = useState<ProductSheet[] | null>(null)
  const [activeVariant, setActiveVariant] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Image vision state
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Preview modal
  const [showPreview, setShowPreview] = useState(false)

  // Inline edits — mutable copies of results
  const [editedResult, setEditedResult] = useState<ProductSheet | null>(null)
  const [editedVariants, setEditedVariants] = useState<ProductSheet[] | null>(null)

  // Brand Voice state
  const [brandDesc, setBrandDesc] = useState(profile.brand_profile?.description || '')
  const [brandKeywords, setBrandKeywords] = useState<string[]>(profile.brand_profile?.keywords || [])
  const [brandAvoid, setBrandAvoid] = useState<string[]>(profile.brand_profile?.avoidWords || [])
  const [brandExample, setBrandExample] = useState(profile.brand_profile?.exampleText || '')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandSaved, setBrandSaved] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<SavedTemplate[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('shopscribe_templates') || '[]')
    } catch { return [] }
  })
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Bulk tab state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkFile, setBulkFile] = useState<string | null>(null)
  const [bulkJobId, setBulkJobId] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [bulkProgress, setBulkProgress] = useState({ processed: 0, total: 0 })
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkError, setBulkError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('shopscribe_onboarding_seen')
    if (!seen) {
      setShowOnboarding(true)
      localStorage.setItem('shopscribe_onboarding_seen', '1')
    }
  }, [])

  const limit = PLAN_LIMITS[profile.plan]
  const used = profile.generations_used
  const remaining = limit === -1 ? '∞' : Math.max(0, limit - used)
  const pct = limit === -1 ? 0 : Math.min(100, (used / limit) * 100)

  // ─── Handlers ────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageMimeType(file.type || 'image/jpeg')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      // Extract base64 part only (strip "data:image/...;base64,")
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageBase64(null)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyAll(sheet: ProductSheet) {
    copy(
      `TITRE:\n${sheet.title}\n\nDESCRIPTION:\n${sheet.description}\n\nPOINTS CLÉS:\n${sheet.bulletPoints.map(b => `• ${b}`).join('\n')}\n\nMETA DESCRIPTION:\n${sheet.metaDescription}\n\nTAGS:\n${sheet.tags.join(', ')}`,
      'all'
    )
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setVariantResults(null)
    setEditedResult(null)
    setEditedVariants(null)
    setActiveVariant(0)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, keywords, category, tone, language, variants: withVariants, imageBase64, imageMimeType }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la génération')
    } else if (withVariants) {
      setVariantResults(data.data)
      setEditedVariants(data.data)
      setResult(data.data[0])
      setEditedResult(data.data[0])
      router.refresh()
    } else {
      setResult(data.data)
      setEditedResult(data.data)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault()
    setBrandSaving(true)
    await fetch('/api/brand-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: brandDesc, keywords: brandKeywords, avoidWords: brandAvoid, exampleText: brandExample }),
    })
    setBrandSaving(false)
    setBrandSaved(true)
    setTimeout(() => setBrandSaved(false), 3000)
  }

  // ─── Templates ───────────────────────────────────────────────────────────────

  function saveTemplate() {
    if (!templateName.trim()) return
    const tmpl: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      category,
      tone,
      language,
      keywords,
    }
    const updated = [...templates, tmpl]
    setTemplates(updated)
    localStorage.setItem('shopscribe_templates', JSON.stringify(updated))
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  function loadTemplate(tmpl: SavedTemplate) {
    setCategory(tmpl.category)
    setTone(tmpl.tone)
    setLanguage(tmpl.language)
    setKeywords(tmpl.keywords)
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    localStorage.setItem('shopscribe_templates', JSON.stringify(updated))
  }

  // ─── CSV ─────────────────────────────────────────────────────────────────────

  function parseCSV(text: string): BulkRow[] {
    const result = Papa.parse<Record<string, string>>(text.trim(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    })
    return result.data
      .map((row) => ({
        productName: row['product_name'] || row['nom'] || row['name'] || '',
        keywords: row['keywords'] || row['mots_cles'] || row['mots-clés'] || '',
        category: row['category'] || row['categorie'] || row['catégorie'] || 'Général',
        tone: row['tone'] || row['ton'] || 'professionnel',
        language: row['language'] || row['langue'] || 'fr',
      }))
      .filter(r => r.productName && r.keywords)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setBulkFile(file.name)
      setBulkRows(parseCSV(text))
      setBulkStatus('idle')
      setBulkError('')
    }
    reader.readAsText(file)
  }

  const pollJob = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/bulk/${jobId}`)
      if (!res.ok) return
      const job = await res.json()
      setBulkProgress({ processed: job.processed, total: job.total })
      if (job.results?.length) setBulkResults(job.results)
      if (job.status === 'done' || job.status === 'error') {
        clearInterval(pollRef.current!)
        setBulkStatus(job.status)
        router.refresh()
      }
    }, 2000)
  }, [router])

  async function handleBulkGenerate() {
    if (bulkRows.length === 0) return
    setBulkStatus('processing')
    setBulkProgress({ processed: 0, total: bulkRows.length })
    setBulkError('')

    const res = await fetch('/api/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: bulkRows }),
    })
    const data = await res.json()

    if (!res.ok) {
      setBulkStatus('error')
      setBulkError(data.error || 'Erreur lors du lancement')
      return
    }

    setBulkJobId(data.jobId)
    pollJob(data.jobId)
  }

  function downloadBulkCSV() {
    const header = 'product_name,title,meta_description,description,bullet_points,tags,error'
    const rows = bulkResults.map(r => [
      `"${r.productName}"`,
      `"${r.title || ''}"`,
      `"${r.metaDescription || ''}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.bulletPoints || []).join(' | ')}"`,
      `"${(r.tags || []).join(', ')}"`,
      `"${r.error || ''}"`,
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopscribe-bulk-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadTemplate() {
    const csv = 'product_name,keywords,category,tone,language\n"Sac à dos 30L","randonnée étanche léger",Sport,professionnel,fr\n"Robe d\'été","fleurs légère coton",Mode,casual,fr'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopscribe-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  // Determine which result to display (edited version or original)
  const displayResult = editedResult || result
  const displayVariants = editedVariants || variantResults

  return (
    <div className="min-h-screen bg-[#080810] text-white">

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* Product Preview Modal */}
      <AnimatePresence>
        {showPreview && displayResult && (
          <ProductPreviewModal
            result={displayVariants ? displayVariants[activeVariant] : displayResult}
            productName={productName}
            imagePreview={imagePreview}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-purple-600/8 blur-[110px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full bg-indigo-500/6 blur-[90px]" />
      </div>

      {/* Header */}
      <header className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-md shadow-purple-600/30">
              <Tag className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/80 tracking-tight">ShopScribe</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-white/28 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5 min-w-[36px] min-h-[36px] hidden sm:flex items-center justify-center"
              title="Guide d'utilisation"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <Badge className={`text-xs px-2 sm:px-3 py-1 rounded-full border-0 font-medium ${profile.plan === 'free' ? 'bg-white/[0.06] text-white/45' : 'bg-purple-600/20 text-purple-300 border border-purple-500/20'}`}>
              {profile.plan !== 'free' && <Crown className="h-3 w-3 mr-1" />}
              {PLAN_LABELS[profile.plan]}
            </Badge>
            <span className="text-white/28 text-xs hidden sm:block truncate max-w-[160px]">{user.email}</span>
            <button onClick={handleLogout} className="text-white/28 hover:text-white/65 transition-colors p-1.5 rounded-lg hover:bg-white/5 min-w-[36px] min-h-[36px] flex items-center justify-center">
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
          className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.065] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-white/55">
                {limit === -1 ? 'Générations illimitées' : `${used} / ${limit} fiches utilisées`}
              </span>
              <span className="text-xs sm:text-sm font-medium text-white/75">
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

        {/* Tabs */}
        <Tabs defaultValue="generate">
          <TabsList className="bg-white/[0.04] border border-white/[0.065] rounded-xl p-1 mb-6 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="generate" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/38 px-2 sm:px-4 transition-all duration-200">
              <Sparkles className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden xs:inline sm:inline">Générer</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/38 px-2 sm:px-4 transition-all duration-200">
              <Layers className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden xs:inline sm:inline">Masse</span>
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/38 px-2 sm:px-4 transition-all duration-200">
              <Building2 className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden xs:inline sm:inline">Marque</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/38 px-2 sm:px-4 transition-all duration-200">
              <History className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden xs:inline sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Onglet Générer ─────────────────────────────────────────────────── */}
          <TabsContent value="generate">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Formulaire */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]"
              >
                <h2 className="text-base font-semibold text-white mb-5">Votre produit</h2>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-white/45 text-xs font-medium uppercase tracking-wide">Nom du produit *</Label>
                    <Input
                      placeholder="ex: Sac à dos imperméable 30L"
                      value={productName}
                      onChange={e => setProductName(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/18 rounded-xl focus:border-purple-500/50 focus:ring-0 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/45 text-xs font-medium uppercase tracking-wide">Mots-clés *</Label>
                    <Input
                      placeholder="ex: randonnée, étanche, léger, voyage"
                      value={keywords}
                      onChange={e => setKeywords(e.target.value)}
                      required
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/18 rounded-xl focus:border-purple-500/50 focus:ring-0 transition-colors"
                    />
                  </div>

                  {/* Image upload — Vision IA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Photo produit</Label>
                      <span className="text-xs text-purple-400/70 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Vision IA
                      </span>
                    </div>
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-white/[0.03]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Aperçu produit" className="w-full h-36 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-400" /> Image prête — l&apos;IA va l&apos;analyser
                          </span>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-white/60 hover:text-white bg-black/40 rounded-lg p-1 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="border border-dashed border-white/[0.10] hover:border-purple-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                      >
                        <ImagePlus className="h-6 w-6 text-white/15 group-hover:text-purple-400/50 mx-auto mb-1.5 transition-colors" />
                        <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Ajouter une photo pour enrichir la fiche</p>
                        <p className="text-xs text-white/15 mt-0.5">JPG, PNG, WebP — optionnel</p>
                      </div>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Catégorie</Label>
                      <Select value={category} onValueChange={v => setCategory(v ?? 'Général')}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13131a] border-white/[0.08] rounded-xl">
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Langue</Label>
                      <Select value={language} onValueChange={v => setLanguage(v ?? 'fr')}>
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#13131a] border-white/[0.08] rounded-xl">
                          {LANGUAGES.map(l => (
                            <SelectItem key={l.value} value={l.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{l.label}</SelectItem>
                          ))}
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
                        {TONES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Variantes toggle */}
                  <div
                    onClick={() => setWithVariants(v => !v)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${withVariants ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/[0.03] border-white/[0.065] hover:border-white/10'}`}
                  >
                    <div className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${withVariants ? 'bg-purple-600' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${withVariants ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">Générer 3 variantes A/B</p>
                      <p className="text-xs text-white/30">3 approches différentes — compte comme 3 générations</p>
                    </div>
                  </div>

                  {/* Brand voice indicator */}
                  {(brandDesc || brandKeywords.length > 0) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/8 border border-purple-500/15">
                      <Building2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="text-xs text-purple-300/80">Ton de marque activé — style personnalisé appliqué</span>
                    </div>
                  )}

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
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                          <span className="truncate">{withVariants ? 'Génération de 3 variantes...' : 'Génération en cours...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {withVariants ? 'Générer 3 variantes' : 'Générer la fiche produit'}
                          <ArrowRight className="h-4 w-4 ml-auto" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* ── Templates ──────────────────────────────────────────────── */}
                  <div className="pt-1 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/30 font-medium uppercase tracking-wide">Mes templates</span>
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplate(v => !v)}
                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        Sauvegarder
                      </button>
                    </div>

                    {/* Save form */}
                    <AnimatePresence>
                      {showSaveTemplate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-2"
                        >
                          <div className="flex gap-2 pt-1">
                            <Input
                              placeholder="Nom du template..."
                              value={templateName}
                              onChange={e => setTemplateName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTemplate() } }}
                              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl text-xs focus:border-purple-500/50 focus:ring-0 h-8"
                            />
                            <button
                              type="button"
                              onClick={saveTemplate}
                              className="text-xs text-white px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors shrink-0"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSaveTemplate(false)}
                              className="text-xs text-white/40 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Template list */}
                    {templates.length === 0 ? (
                      <p className="text-xs text-white/20 py-1">Aucun template — sauvegardez vos configurations favorites</p>
                    ) : (
                      <div className="space-y-1">
                        {templates.map(tmpl => (
                          <div key={tmpl.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 group/tmpl transition-colors">
                            <Bookmark className="h-3 w-3 text-purple-400/60 shrink-0" />
                            <button
                              type="button"
                              onClick={() => loadTemplate(tmpl)}
                              className="flex-1 text-left text-xs text-white/50 hover:text-white/80 transition-colors"
                            >
                              {tmpl.name}
                              <span className="text-white/25 ml-1.5">· {tmpl.category} · {TONES.find(t => t.value === tmpl.tone)?.label}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTemplate(tmpl.id)}
                              className="text-white/20 hover:text-red-400/70 transition-colors opacity-0 group-hover/tmpl:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </motion.div>

              {/* Résultats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <AnimatePresence mode="wait">
                  {displayResult ? (
                    <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="space-y-3">

                      {/* Variants */}
                      {displayVariants && displayVariants.length > 1 ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-semibold text-white">Variantes A/B</h2>
                              <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">3 versions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Vue côte-à-côte toggle */}
                              <button
                                onClick={() => setAbSideBySide(v => !v)}
                                className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg border ${abSideBySide ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-white/[0.04] border-white/[0.065] text-white/40 hover:text-white/70'}`}
                                title="Vue côte-à-côte"
                              >
                                <Columns className="h-3 w-3" />
                                <span className="hidden sm:inline">Comparer</span>
                              </button>
                              <button
                                onClick={() => copyAll(displayVariants[activeVariant])}
                                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10"
                              >
                                {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                Copier tout
                              </button>
                            </div>
                          </div>

                          {/* Side-by-side comparison */}
                          {abSideBySide ? (
                            <div className="space-y-3">
                              <p className="text-xs text-white/30">Comparaison côte-à-côte — survolez les champs pour modifier</p>
                              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                {displayVariants.map((v, i) => (
                                  <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${i === activeVariant ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-white/40'}`}>
                                        Variante {i + 1}
                                      </span>
                                      <button onClick={() => { setActiveVariant(i); setAbSideBySide(false) }} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                                        Sélectionner
                                      </button>
                                    </div>
                                    {/* Compact comparison cards */}
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.065] space-y-2">
                                      <div>
                                        <p className="text-xs text-white/30 uppercase tracking-wide mb-1">Titre</p>
                                        <p className="text-xs text-white/70 leading-snug">{v.title}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-white/30 uppercase tracking-wide mb-1">Meta</p>
                                        <p className="text-xs text-white/50 leading-snug line-clamp-2">{v.metaDescription}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-white/30 uppercase tracking-wide mb-1">Points clés</p>
                                        <ul className="space-y-1">
                                          {v.bulletPoints.slice(0, 3).map((bp, bi) => (
                                            <li key={bi} className="flex gap-1.5 text-xs text-white/50">
                                              <span className="text-purple-400 shrink-0">›</span> {bp}
                                            </li>
                                          ))}
                                          {v.bulletPoints.length > 3 && <li className="text-xs text-white/25">+{v.bulletPoints.length - 3} autres</li>}
                                        </ul>
                                      </div>
                                    </div>
                                    {/* SEO mini score */}
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                      <BarChart2 className="h-3 w-3 text-white/30" />
                                      <span className="text-xs text-white/30">SEO</span>
                                      <span className={`text-xs font-bold ml-auto ${calculateSEOScore(v, keywords).score >= 75 ? 'text-green-400' : calculateSEOScore(v, keywords).score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {calculateSEOScore(v, keywords).score}/100
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-white/25 text-center">Cliquez sur &quot;Sélectionner&quot; pour voir et éditer la variante complète</p>
                            </div>
                          ) : (
                            <>
                              {/* Standard variant navigation */}
                              <div className="flex items-center gap-2 mb-3">
                                <button
                                  onClick={() => setActiveVariant(v => Math.max(0, v - 1))}
                                  disabled={activeVariant === 0}
                                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                {displayVariants.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setActiveVariant(i)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeVariant === i ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-white/40 hover:text-white/70'}`}
                                  >
                                    Variante {i + 1}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setActiveVariant(v => Math.min(displayVariants.length - 1, v + 1))}
                                  disabled={activeVariant === displayVariants.length - 1}
                                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <EditableProductSheetDisplay
                                result={displayVariants[activeVariant]}
                                onResultChange={updated => {
                                  const newVariants = [...displayVariants]
                                  newVariants[activeVariant] = updated
                                  setEditedVariants(newVariants)
                                  if (activeVariant === 0) setEditedResult(updated)
                                }}
                                suffix={`v${activeVariant}`}
                                copied={copied}
                                onCopy={copy}
                              />
                              <SEOScorePanel result={displayVariants[activeVariant]} keywords={keywords} />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <h2 className="text-base font-semibold text-white">Résultat</h2>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10"
                              >
                                <Eye className="h-3 w-3" /> Prévisualiser
                              </button>
                              <button
                                onClick={() => copyAll(displayResult)}
                                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10"
                              >
                                {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                Tout copier
                              </button>
                            </div>
                          </div>
                          <EditableProductSheetDisplay
                            result={displayResult}
                            onResultChange={setEditedResult}
                            copied={copied}
                            onCopy={copy}
                          />
                          <SEOScorePanel result={displayResult} keywords={keywords} />
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
                      <div className="text-center text-white/20 py-24">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.065] flex items-center justify-center mx-auto mb-5">
                          <Sparkles className="h-7 w-7 text-purple-500/25" />
                        </div>
                        <p className="text-sm text-white/35">Votre fiche produit apparaîtra ici</p>
                        <p className="text-xs mt-1.5 text-white/18">Remplissez le formulaire et cliquez sur Générer</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </TabsContent>

          {/* ── Onglet Masse ───────────────────────────────────────────────────── */}
          <TabsContent value="bulk">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {bulkStatus === 'idle' && (
                <>
                  {/* Upload zone */}
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-semibold text-white">Génération en masse</h2>
                        <p className="text-xs text-white/40 mt-0.5">Uploadez un CSV pour générer jusqu&apos;à 100 fiches produits</p>
                      </div>
                      <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10">
                        <Download className="h-3 w-3" /> Modèle CSV
                      </button>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
                    >
                      <Upload className="h-8 w-8 text-white/15 group-hover:text-purple-400/50 mx-auto mb-3 transition-colors" />
                      {bulkFile ? (
                        <p className="text-sm text-white/60">{bulkFile} — <span className="text-purple-400">{bulkRows.length} produits détectés</span></p>
                      ) : (
                        <>
                          <p className="text-sm text-white/40">Glissez votre CSV ou cliquez pour choisir</p>
                          <p className="text-xs text-white/20 mt-1">Colonnes : product_name, keywords, category, tone, language</p>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </div>
                  </div>

                  {/* Preview */}
                  {bulkRows.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]">
                      <h3 className="text-sm font-semibold text-white mb-3">Aperçu — {bulkRows.length} produits</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.065]">
                              {['Nom du produit', 'Mots-clés', 'Catégorie', 'Ton', 'Langue'].map(h => (
                                <th key={h} className="text-left text-white/30 font-medium pb-2 pr-4">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkRows.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-b border-white/[0.03]">
                                <td className="py-2 pr-4 text-white/70 max-w-[140px] truncate">{row.productName}</td>
                                <td className="py-2 pr-4 text-white/40 max-w-[140px] truncate">{row.keywords}</td>
                                <td className="py-2 pr-4 text-white/40">{row.category}</td>
                                <td className="py-2 pr-4 text-white/40">{row.tone}</td>
                                <td className="py-2 text-white/40">{row.language}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {bulkRows.length > 5 && <p className="text-xs text-white/20 mt-2">... et {bulkRows.length - 5} autres produits</p>}
                      </div>
                      <Button
                        onClick={handleBulkGenerate}
                        className="mt-4 w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-10 gap-2 font-medium"
                      >
                        <Sparkles className="h-4 w-4" />
                        Lancer la génération de {bulkRows.length} fiches
                      </Button>
                    </div>
                  )}

                  {bulkError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {bulkError}
                    </div>
                  )}
                </>
              )}

              {bulkStatus === 'processing' && (
                <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.065] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1">Génération en cours</h3>
                  <p className="text-sm text-white/40 mb-6">{bulkProgress.processed} / {bulkProgress.total} fiches générées</p>
                  <div className="w-full max-w-sm mx-auto h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500 rounded-full"
                      animate={{ width: bulkProgress.total > 0 ? `${(bulkProgress.processed / bulkProgress.total) * 100}%` : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-white/20 mt-3">Cette page se met à jour automatiquement</p>
                </div>
              )}

              {bulkStatus === 'done' && (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">Génération terminée</h3>
                      <p className="text-xs text-white/40 mt-0.5">{bulkResults.filter(r => !r.error).length} / {bulkResults.length} fiches générées avec succès</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setBulkStatus('idle'); setBulkRows([]); setBulkFile(null); setBulkJobId(null); setBulkResults([]) }}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10"
                      >
                        <RefreshCw className="h-3 w-3" /> Nouveau batch
                      </button>
                      <button
                        onClick={downloadBulkCSV}
                        className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
                      >
                        <Download className="h-3 w-3" /> Télécharger CSV
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bulkResults.map((r, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-xs ${r.error ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white/70">{r.productName}</span>
                          {r.error ? (
                            <span className="text-red-400">Erreur</span>
                          ) : (
                            <span className="text-green-400">OK</span>
                          )}
                        </div>
                        {!r.error && r.title && <p className="text-white/30 mt-0.5 truncate">{r.title}</p>}
                        {r.error && <p className="text-red-400/60 mt-0.5">{r.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ── Onglet Ma Marque ───────────────────────────────────────────────── */}
          <TabsContent value="brand">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-white">Ton de marque</h2>
                  <p className="text-sm text-white/40 mt-1">Définissez votre identité de marque pour que chaque fiche générée soit parfaitement alignée avec votre style.</p>
                </div>

                <form onSubmit={handleSaveBrand} className="space-y-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]">
                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Qui êtes-vous ?</Label>
                    <Textarea
                      placeholder="ex: Marque de vêtements éco-responsables pour femmes actives. Nous vendons des pièces durables, confortables et élégantes, fabriquées en France."
                      value={brandDesc}
                      onChange={e => setBrandDesc(e.target.value)}
                      rows={3}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Mots qui vous définissent</Label>
                    <p className="text-xs text-white/25">Ces mots seront utilisés naturellement dans vos fiches</p>
                    <TagInput value={brandKeywords} onChange={setBrandKeywords} placeholder="ex: durable, artisanal, élégant..." />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Mots à éviter</Label>
                    <p className="text-xs text-white/25">Ces mots ne seront jamais utilisés dans vos fiches</p>
                    <TagInput value={brandAvoid} onChange={setBrandAvoid} placeholder="ex: pas cher, discount, promotion..." />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/50 text-xs font-medium uppercase tracking-wide">Exemple de texte de votre marque</Label>
                    <p className="text-xs text-white/25">Collez un exemple de description que vous aimez — l&apos;IA reproduira ce style</p>
                    <Textarea
                      placeholder="Collez ici un exemple de description produit ou de texte que vous aimez..."
                      value={brandExample}
                      onChange={e => setBrandExample(e.target.value)}
                      rows={4}
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={brandSaving}
                    className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-10 gap-2 font-medium px-6"
                  >
                    {brandSaving ? (
                      <><div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
                    ) : brandSaved ? (
                      <><Check className="h-3.5 w-3.5" /> Sauvegardé !</>
                    ) : (
                      <><Save className="h-3.5 w-3.5" /> Sauvegarder le profil de marque</>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Onglet Historique ──────────────────────────────────────────────── */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.065]">
              {history.length === 0 ? (
                <div className="text-center text-white/20 py-16">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.065] flex items-center justify-center mx-auto mb-4">
                    <History className="h-6 w-6 text-white/15" />
                  </div>
                  <p className="text-sm text-white/32">Aucune génération pour le moment</p>
                  <p className="text-xs mt-1 text-white/18">Générez votre première fiche dans l&apos;onglet Générer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((gen, i) => (
                    <HistoryItem key={gen.id} gen={gen} index={i} onCopyAll={copyAll} copied={copied} onCopy={copy} />
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

// ─── History Item (expandable) ────────────────────────────────────────────────

function HistoryItem({ gen, index, onCopyAll, copied, onCopy }: {
  gen: Generation
  index: number
  onCopyAll: (sheet: ProductSheet) => void
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between p-3 sm:p-4 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-sm font-medium truncate">{gen.product_name}</p>
          {gen.result?.title && (
            <p className="text-white/30 text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">{gen.result.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className="text-white/25 text-xs">
            {new Date(gen.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-white/30" /> : <ChevronDown className="h-3.5 w-3.5 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && gen.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
              <div className="flex justify-end">
                <button
                  onClick={() => onCopyAll(gen.result)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] hover:border-white/10"
                >
                  {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  Tout copier
                </button>
              </div>
              <div className="grid gap-2">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-xs text-white/30 mb-1 uppercase tracking-wide">Titre SEO</p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white/70 text-sm">{gen.result.title}</p>
                    <button onClick={() => onCopy(gen.result.title, `hist-title-${gen.id}`)} className="text-white/20 hover:text-white/50 shrink-0 p-1">
                      {copied === `hist-title-${gen.id}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-xs text-white/30 mb-1 uppercase tracking-wide">Meta description</p>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white/60 text-sm">{gen.result.metaDescription}</p>
                    <button onClick={() => onCopy(gen.result.metaDescription, `hist-meta-${gen.id}`)} className="text-white/20 hover:text-white/50 shrink-0 p-1">
                      {copied === `hist-meta-${gen.id}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                {gen.result.bulletPoints?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xs text-white/30 mb-2 uppercase tracking-wide">Points clés</p>
                    <ul className="space-y-1">
                      {gen.result.bulletPoints.map((bp, i) => (
                        <li key={i} className="flex gap-2 text-xs text-white/60">
                          <span className="text-purple-400 shrink-0">›</span> {bp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {gen.result.tags?.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xs text-white/30 mb-2 uppercase tracking-wide">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gen.result.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
