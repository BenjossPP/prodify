'use client'

import Papa from 'papaparse'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  is_favorite: boolean
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expanded, setExpanded] = useState(false)
  const color = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bgColor = score >= 75 ? 'bg-green-500/8 border-green-500/20' : score >= 50 ? 'bg-amber-500/8 border-amber-500/20' : 'bg-red-500/8 border-red-500/20'
  const barColor = score >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : score >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-400'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const failedCriteria = criteria.filter(c => !c.passed)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${bgColor} overflow-hidden`}
    >
      {/* Score header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-white/50" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Score SEO</p>
            <p className="text-xs text-white/35">{score >= 75 ? 'Excellent' : score >= 50 ? 'Correct' : 'À améliorer'}</p>
          </div>
        </div>
        <span className={`text-3xl font-bold tabular-nums ${color}`}>
          {score}<span className="text-sm font-normal text-white/25">/100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${barColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Criteria */}
      <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
        {criteria.map((c, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${c.passed ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-white/20'}`}>
                {c.passed ? '✓' : '○'}
              </span>
              <span className={c.passed ? 'text-white/65' : 'text-white/30'}>{c.label}</span>
              <span className={`ml-auto font-mono ${c.passed ? 'text-white/40' : 'text-white/15'}`}>+{c.points}</span>
            </div>
            {!c.passed && (
              <div className="flex items-start gap-1.5 ml-6 mt-1">
                <Info className="h-3 w-3 text-amber-400/60 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/65 leading-snug">{c.suggestion}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {score === 100 && (
        <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-2 text-xs text-green-400/80">
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
    <button
      onClick={onCopy}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        copied === id
          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
          : 'bg-white/[0.04] text-white/35 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.07]'
      }`}
    >
      {copied === id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied === id ? 'Copié' : 'Copier'}
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
  id, label, icon: Icon, content, onContentChange, copied, onCopy, multiline = false, maxLength, accent = 'purple',
}: {
  id: string
  label: string
  icon: React.ElementType
  content: string
  onContentChange: (v: string) => void
  copied: string | null
  onCopy: (text: string, id: string) => void
  multiline?: boolean
  maxLength?: number
  accent?: 'purple' | 'blue' | 'indigo' | 'teal' | 'pink'
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)

  // sync if content changes externally (new generation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(content)
    setEditing(false)
  }, [content])

  function commit() {
    onContentChange(draft)
    setEditing(false)
  }

  const charCount = editing ? draft.length : content.length
  const overLimit = maxLength ? charCount > maxLength : false

  const accentMap = {
    purple: { icon: 'bg-purple-500/15 text-purple-400', border: 'border-purple-500/40 focus:border-purple-500/70', bar: 'bg-purple-500' },
    blue:   { icon: 'bg-blue-500/15 text-blue-400',   border: 'border-blue-500/40 focus:border-blue-500/70',   bar: 'bg-blue-500' },
    indigo: { icon: 'bg-indigo-500/15 text-indigo-400', border: 'border-indigo-500/40 focus:border-indigo-500/70', bar: 'bg-indigo-500' },
    teal:   { icon: 'bg-teal-500/15 text-teal-400',   border: 'border-teal-500/40 focus:border-teal-500/70',   bar: 'bg-teal-500' },
    pink:   { icon: 'bg-pink-500/15 text-pink-400',   border: 'border-pink-500/40 focus:border-pink-500/70',   bar: 'bg-pink-500' },
  }
  const a = accentMap[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden group hover:border-white/[0.11] transition-colors duration-200"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-white/55 uppercase tracking-wider">{label}</span>
          {maxLength && (
            <span className={`text-xs tabular-nums transition-colors ml-1 ${overLimit ? 'text-red-400' : 'text-white/20'}`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!editing && (
            <button
              onClick={() => { setDraft(content); setEditing(true) }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/25 hover:text-white/60 transition-colors hover:bg-white/[0.05] opacity-0 group-hover:opacity-100"
              title="Modifier"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <CopyButton id={id} copied={copied} onCopy={() => onCopy(content, id)} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
                rows={multiline ? 5 : 2}
                className={`w-full bg-white/[0.04] text-white text-sm rounded-xl px-3 py-2 resize-none focus:outline-none transition-colors border ${overLimit ? 'border-red-500/50' : a.border}`}
              />
              {maxLength && (
                <p className={`text-xs mt-1 text-right tabular-nums ${overLimit ? 'text-red-400' : 'text-white/25'}`}>
                  {draft.length} / {maxLength} caractères
                </p>
              )}
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={commit}
                  className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-medium"
                >
                  <Check className="h-3 w-3" /> Valider
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors"
                >
                  <X className="h-3 w-3" /> Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.p key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`text-white/80 text-sm leading-relaxed ${multiline ? '' : 'font-medium'}`}>
              {content}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBulletDraft(result.bulletPoints.join('\n'))
    setTagDraft(result.tags.join(', '))
    setEditingBullets(false)
    setEditingTags(false)
  }, [result])

  return (
    <div className="space-y-3">
      <EditableResultCard
        id={`title${s}`} label="Titre SEO" icon={FileText} accent="purple"
        content={result.title} onContentChange={v => onResultChange({ ...result, title: v })}
        copied={copied} onCopy={onCopy} maxLength={80}
      />
      <EditableResultCard
        id={`meta${s}`} label="Meta description" icon={Hash} accent="blue"
        content={result.metaDescription} onContentChange={v => onResultChange({ ...result, metaDescription: v })}
        copied={copied} onCopy={onCopy} maxLength={160}
      />
      <EditableResultCard
        id={`desc${s}`} label="Description" icon={AlignLeft} accent="indigo"
        content={result.description} onContentChange={v => onResultChange({ ...result, description: v })}
        copied={copied} onCopy={onCopy} multiline
      />

      {/* Points clés éditables */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden group hover:border-white/[0.11] transition-colors duration-200"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
              <CheckCircleIcon className="h-3.5 w-3.5 text-teal-400" />
            </div>
            <span className="text-xs font-semibold text-white/55 uppercase tracking-wider">Points clés</span>
          </div>
          <div className="flex items-center gap-1.5">
            {!editingBullets && (
              <button
                onClick={() => { setBulletDraft(result.bulletPoints.join('\n')); setEditingBullets(true) }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/25 hover:text-white/60 transition-colors hover:bg-white/[0.05] opacity-0 group-hover:opacity-100"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => onCopy(result.bulletPoints.map(b => `• ${b}`).join('\n'), `bullets${s}`)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                copied === `bullets${s}`
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                  : 'bg-white/[0.04] text-white/35 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.07]'
              }`}
            >
              {copied === `bullets${s}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === `bullets${s}` ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            {editingBullets ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-white/30 mb-2">Un point par ligne</p>
                <Textarea
                  value={bulletDraft}
                  onChange={e => setBulletDraft(e.target.value)}
                  autoFocus
                  rows={5}
                  className="w-full bg-white/[0.04] border border-teal-500/40 text-white text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-teal-500/70"
                />
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => {
                      const pts = bulletDraft.split('\n').map(l => l.trim()).filter(Boolean)
                      onResultChange({ ...result, bulletPoints: pts })
                      setEditingBullets(false)
                    }}
                    className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-medium"
                  >
                    <Check className="h-3 w-3" /> Valider
                  </button>
                  <button onClick={() => setEditingBullets(false)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors">
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
        </div>
      </motion.div>

      {/* Tags éditables */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden group hover:border-white/[0.11] transition-colors duration-200"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center">
              <Tag className="h-3.5 w-3.5 text-pink-400" />
            </div>
            <span className="text-xs font-semibold text-white/55 uppercase tracking-wider">Tags</span>
          </div>
          {!editingTags && (
            <button
              onClick={() => { setTagDraft(result.tags.join(', ')); setEditingTags(true) }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/25 hover:text-white/60 transition-colors hover:bg-white/[0.05] opacity-0 group-hover:opacity-100"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="px-4 py-3">
          <AnimatePresence mode="wait">
            {editingTags ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-white/30 mb-2">Séparez les tags par des virgules</p>
                <Input
                  value={tagDraft}
                  onChange={e => setTagDraft(e.target.value)}
                  autoFocus
                  className="bg-white/[0.04] border border-pink-500/40 text-white rounded-xl focus:border-pink-500/70"
                />
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => {
                      const tags = tagDraft.split(',').map(t => t.trim()).filter(Boolean)
                      onResultChange({ ...result, tags })
                      setEditingTags(false)
                    }}
                    className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors font-medium"
                  >
                    <Check className="h-3 w-3" /> Valider
                  </button>
                  <button onClick={() => setEditingTags(false)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.065] transition-colors">
                    <X className="h-3 w-3" /> Annuler
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                {result.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-medium">{tag}</span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

  // Generate tab state — initialised from localStorage draft if available
  const [productName, setProductName] = useState(() => {
    if (typeof window === 'undefined') return ''
    try { return JSON.parse(localStorage.getItem('shopscribe_form_draft') || '{}').productName || '' } catch { return '' }
  })
  const [keywords, setKeywords] = useState(() => {
    if (typeof window === 'undefined') return ''
    try { return JSON.parse(localStorage.getItem('shopscribe_form_draft') || '{}').keywords || '' } catch { return '' }
  })
  const [category, setCategory] = useState(() => {
    if (typeof window === 'undefined') return 'Général'
    try { return JSON.parse(localStorage.getItem('shopscribe_form_draft') || '{}').category || 'Général' } catch { return 'Général' }
  })
  const [tone, setTone] = useState(() => {
    if (typeof window === 'undefined') return 'professionnel'
    try { return JSON.parse(localStorage.getItem('shopscribe_form_draft') || '{}').tone || 'professionnel' } catch { return 'professionnel' }
  })
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'fr'
    try { return JSON.parse(localStorage.getItem('shopscribe_form_draft') || '{}').language || 'fr' } catch { return 'fr' }
  })
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
  const [showExportMenu, setShowExportMenu] = useState(false)

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
  const [brandError, setBrandError] = useState('')

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bulkJobId, setBulkJobId] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [bulkProgress, setBulkProgress] = useState({ processed: 0, total: 0 })
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkError, setBulkError] = useState('')

  // History pagination
  const [historyItems, setHistoryItems] = useState<Generation[]>(history)
  const [historyOffset, setHistoryOffset] = useState(history.length)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyHasMore, setHistoryHasMore] = useState(history.length === 20)

  // History search & filter
  const [historySearch, setHistorySearch] = useState('')
  const [historyPeriod, setHistoryPeriod] = useState<'all' | 'today' | '7days' | 'month'>('all')
  const [historyFavOnly, setHistoryFavOnly] = useState(false)

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ productName?: string; keywords?: string }>({})

  // Persist form draft on any change
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('shopscribe_form_draft', JSON.stringify({ productName, keywords, category, tone, language }))
  }, [productName, keywords, category, tone, language])

  async function loadMoreHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/history?offset=${historyOffset}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        const newItems: Generation[] = data.items || []
        setHistoryItems(prev => [...prev, ...newItems])
        setHistoryOffset(prev => prev + newItems.length)
        setHistoryHasMore(newItems.length === 20)
      }
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false)
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup poll interval on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('shopscribe_onboarding_seen')
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOnboarding(true)
      localStorage.setItem('shopscribe_onboarding_seen', '1')
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      // Ctrl/Cmd + Enter → generate (only when not in a textarea/input other than productName/keywords)
      if (meta && e.key === 'Enter') {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'TEXTAREA') return // don't trigger inside editing fields
        e.preventDefault()
        const form = document.querySelector<HTMLFormElement>('form[data-generate-form]')
        if (form) form.requestSubmit()
      }
      // Ctrl/Cmd + Shift + C → copy all
      if (meta && e.shiftKey && e.key === 'c') {
        e.preventDefault()
        const activeSheet = editedResult
        if (activeSheet) {
          navigator.clipboard.writeText(
            `TITRE:\n${activeSheet.title}\n\nDESCRIPTION:\n${activeSheet.description}\n\nPOINTS CLÉS:\n${activeSheet.bulletPoints.map(b => `• ${b}`).join('\n')}\n\nMETA DESCRIPTION:\n${activeSheet.metaDescription}\n\nTAGS:\n${activeSheet.tags.join(', ')}`
          )
          setCopied('all')
          setTimeout(() => setCopied(null), 2000)
        }
      }
      // Escape → close export menu
      if (e.key === 'Escape') setShowExportMenu(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editedResult])

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return
    function onClickOutside() { setShowExportMenu(false) }
    window.addEventListener('click', onClickOutside)
    return () => window.removeEventListener('click', onClickOutside)
  }, [showExportMenu])

  const limit = PLAN_LIMITS[profile.plan]
  const used = profile.generations_used
  const remaining = limit === -1 ? '∞' : Math.max(0, limit - used)
  const pct = limit === -1 ? 0 : Math.min(100, (used / limit) * 100)

  // ─── Filtered history ──────────────────────────────────────────────────────

  const filteredHistory = historyItems.filter(gen => {
    // Favorites filter
    if (historyFavOnly && !gen.is_favorite) return false
    // Search filter
    if (historySearch && !gen.product_name.toLowerCase().includes(historySearch.toLowerCase())) return false
    // Period filter
    if (historyPeriod !== 'all') {
      const now = new Date()
      const date = new Date(gen.created_at)
      if (historyPeriod === 'today') {
        if (date.toDateString() !== now.toDateString()) return false
      } else if (historyPeriod === '7days') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 7)
        if (date < cutoff) return false
      } else if (historyPeriod === 'month') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 30)
        if (date < cutoff) return false
      }
    }
    return true
  })

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

  async function toggleFavorite(genId: string, current: boolean) {
    // Optimistic update
    setHistoryItems(prev => prev.map(g => g.id === genId ? { ...g, is_favorite: !current } : g))
    posthog.capture('favorite_toggled', { action: current ? 'remove' : 'add' })
    await fetch(`/api/history/${genId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: !current }),
    }).catch(() => {
      // Revert on error
      setHistoryItems(prev => prev.map(g => g.id === genId ? { ...g, is_favorite: current } : g))
    })
  }

  function copyAll(sheet: ProductSheet) {    copy(
      `TITRE:\n${sheet.title}\n\nDESCRIPTION:\n${sheet.description}\n\nPOINTS CLÉS:\n${sheet.bulletPoints.map(b => `• ${b}`).join('\n')}\n\nMETA DESCRIPTION:\n${sheet.metaDescription}\n\nTAGS:\n${sheet.tags.join(', ')}`,
      'all'
    )
  }

  function copyForEtsy(sheet: ProductSheet) {
    // Etsy: title max 140 chars, max 13 tags
    const title = sheet.title.slice(0, 140)
    const tags = sheet.tags.slice(0, 13).join(', ')
    copy(
      `TITRE ETSY (${title.length}/140):\n${title}\n\nDESCRIPTION:\n${sheet.description}\n\nTAGS (${sheet.tags.slice(0, 13).length}/13):\n${tags}`,
      'etsy'
    )
  }

  function copyForAmazon(sheet: ProductSheet) {
    // Amazon: title max 200 chars, 5 bullet points as feature bullets
    const title = sheet.title.slice(0, 200)
    const bullets = sheet.bulletPoints.slice(0, 5).map(b => `• ${b}`).join('\n')
    copy(
      `TITRE AMAZON (${title.length}/200):\n${title}\n\nPOINTS PRODUIT:\n${bullets}\n\nDESCRIPTION:\n${sheet.description}`,
      'amazon'
    )
  }

  function exportSheetTxt(sheet: ProductSheet, name: string) {
    posthog.capture('export_txt', { source: 'generate' })
    const content = [
      `PRODUIT : ${name}`,
      `DATE : ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      `TITRE SEO :`,
      sheet.title,
      '',
      `META DESCRIPTION :`,
      sheet.metaDescription,
      '',
      `DESCRIPTION :`,
      sheet.description,
      '',
      `POINTS CLÉS :`,
      ...(sheet.bulletPoints || []).map(b => `• ${b}`),
      '',
      `TAGS :`,
      (sheet.tags || []).join(', '),
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopscribe-${name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation
    const errors: { productName?: string; keywords?: string } = {}
    if (!productName.trim()) errors.productName = 'Le nom du produit est requis'
    if (!keywords.trim()) errors.keywords = 'Les mots-clés sont requis'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    setLoading(true)
    setError('')
    setResult(null)
    setVariantResults(null)
    setEditedResult(null)
    setEditedVariants(null)
    setActiveVariant(0)

    posthog.capture('generate_clicked', { category, tone, language, variants: withVariants, hasImage: !!imageBase64 })

    try {
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
        posthog.capture('generation_success', { variants: true })
        router.refresh()
      } else {
        setResult(data.data)
        setEditedResult(data.data)
        posthog.capture('generation_success', { variants: false })
        router.refresh()
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault()
    setBrandSaving(true)
    setBrandError('')
    try {
      const res = await fetch('/api/brand-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: brandDesc, keywords: brandKeywords, avoidWords: brandAvoid, exampleText: brandExample }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setBrandError(data.error || 'Erreur lors de la sauvegarde')
      } else {
        setBrandSaved(true)
        setTimeout(() => setBrandSaved(false), 3000)
      }
    } catch {
      setBrandError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setBrandSaving(false)
    }
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
      try {
        const res = await fetch(`/api/bulk/${jobId}`)
        if (!res.ok) return
        const job = await res.json()
        setBulkProgress({ processed: job.processed, total: job.total })
        if (job.results?.length) setBulkResults(job.results)
        if (job.status === 'done' || job.status === 'error') {
          clearInterval(pollRef.current!)
          setBulkStatus(job.status)
          if (job.status === 'error') setBulkError('Une erreur est survenue pendant la génération.')
          router.refresh()
        }
      } catch {
        // Network error during poll — keep trying, don't crash
      }
    }, 2000)
  }, [router])

  async function handleBulkGenerate() {
    if (bulkRows.length === 0) return
    setBulkStatus('processing')
    setBulkProgress({ processed: 0, total: bulkRows.length })
    setBulkError('')
    posthog.capture('bulk_started', { count: bulkRows.length })

    try {
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
    } catch {
      setBulkStatus('error')
      setBulkError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    }
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

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<'generate' | 'bulk' | 'brand' | 'history'>('generate')

  const initials = user.email.substring(0, 2).toUpperCase()
  const planColor = profile.plan === 'free'
    ? 'bg-white/[0.07] text-white/45 border-white/[0.08]'
    : 'bg-gradient-to-r from-purple-600/30 to-violet-600/30 text-purple-300 border-purple-500/30'

  const navItems = [
    { id: 'generate' as const, icon: Sparkles, label: 'Générer' },
    { id: 'bulk' as const, icon: Layers, label: 'En masse' },
    { id: 'brand' as const, icon: Building2, label: 'Ma Marque' },
    { id: 'history' as const, icon: History, label: 'Historique' },
  ]

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col">

      {/* Modals */}
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      </AnimatePresence>
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

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/7 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      {/* ── Mobile top bar ────────────────────────────────────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#07070f]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-md shadow-purple-600/30">
            <Tag className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/80">ShopScribe</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${planColor}`}>
            {profile.plan !== 'free' && <Crown className="h-2.5 w-2.5 inline mr-1" />}
            {PLAN_LABELS[profile.plan]}
          </span>
          <button onClick={handleLogout} className="p-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile bottom navigation ─────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c18]/95 backdrop-blur-xl border-t border-white/[0.07] px-2 py-2 flex">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all ${
              activeTab === id ? 'text-purple-400' : 'text-white/28 hover:text-white/55'
            }`}
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            <span className="text-[10px] font-medium">{label}</span>
            {activeTab === id && <div className="w-1 h-1 rounded-full bg-purple-400" />}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 relative z-10">

        {/* ── Sidebar (desktop) ────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-screen sticky top-0 bg-[#0a0a16]/80 border-r border-white/[0.065] backdrop-blur-sm">

          {/* Logo */}
          <div className="px-5 pt-6 pb-5 border-b border-white/[0.055]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/25 group-hover:shadow-purple-600/40 transition-shadow">
                <Tag className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <span className="font-semibold text-white/90 tracking-tight">ShopScribe</span>
                <p className="text-xs text-white/28 -mt-0.5">Fiches produits IA</p>
              </div>
            </Link>
          </div>

          {/* User card */}
          <div className="px-4 py-4 border-b border-white/[0.055]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md shadow-purple-600/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/70 font-medium truncate">{user.email}</p>
                <span className={`inline-flex items-center gap-1 mt-0.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${planColor}`}>
                  {profile.plan !== 'free' && <Crown className="h-2.5 w-2.5" />}
                  {PLAN_LABELS[profile.plan]}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  activeTab === id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-600/10'
                    : 'text-white/40 hover:text-white/75 hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${activeTab === id ? 'text-purple-400' : 'text-white/30'}`} />
                {label}
                {id === 'history' && historyItems.length > 0 && (
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-md font-mono ${activeTab === id ? 'bg-purple-500/20 text-purple-300' : 'bg-white/[0.06] text-white/30'}`}>
                    {historyItems.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Quota */}
          <div className="px-4 py-4 border-t border-white/[0.055]">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-medium">Générations</span>
                <span className="text-xs font-mono text-white/70">
                  {remaining === '∞' ? '∞' : `${remaining} restantes`}
                </span>
              </div>
              {limit !== -1 && (
                <>
                  <div className="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full ${pct > 80 ? 'bg-gradient-to-r from-red-500 to-rose-400' : pct > 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-purple-500 to-violet-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-white/28">{used} / {limit} utilisées</p>
                </>
              )}
              {profile.plan === 'free' && (
                <Link href="/pricing" className="block mt-3">
                  <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-600/20">
                    <Crown className="h-3 w-3" /> Passer Pro
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 flex items-center justify-between">
            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Guide
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/25 hover:text-red-400/70 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0 overflow-x-hidden">

          {/* ── Generate tab ───────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="p-4 sm:p-6 lg:p-8"
              >
                {/* Page title */}
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Générer une fiche produit</h1>
                  <p className="text-sm text-white/40 mt-1">Remplissez le formulaire — votre fiche est prête en 10 secondes.</p>
                </div>

                <div className="grid xl:grid-cols-2 gap-5 xl:gap-6">

                  {/* ── Formulaire ────────────────────────────────────────────── */}
                  <div className="space-y-4">

                    {/* Product name + keywords */}
                    <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/[0.055]">
                        <h2 className="text-sm font-semibold text-white/85">Votre produit</h2>
                      </div>
                      <form onSubmit={handleGenerate} data-generate-form className="p-5 space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Nom du produit <span className="text-purple-400">*</span></Label>
                          <Input
                            placeholder="ex: Sac à dos imperméable 30L"
                            value={productName}
                            onChange={e => { setProductName(e.target.value); if (formErrors.productName) setFormErrors(prev => ({ ...prev, productName: undefined })) }}
                            required
                            className={`bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/20 rounded-xl focus:ring-0 h-11 transition-all ${formErrors.productName ? 'border-red-500/60' : 'focus:border-purple-500/60 focus:bg-white/[0.055]'}`}
                          />
                          {formErrors.productName && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3 shrink-0" /> {formErrors.productName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Mots-clés <span className="text-purple-400">*</span></Label>
                          <Input
                            placeholder="ex: randonnée, étanche, léger, voyage"
                            value={keywords}
                            onChange={e => { setKeywords(e.target.value); if (formErrors.keywords) setFormErrors(prev => ({ ...prev, keywords: undefined })) }}
                            required
                            className={`bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/20 rounded-xl focus:ring-0 h-11 transition-all ${formErrors.keywords ? 'border-red-500/60' : 'focus:border-purple-500/60 focus:bg-white/[0.055]'}`}
                          />
                          {formErrors.keywords && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="h-3 w-3 shrink-0" /> {formErrors.keywords}
                            </p>
                          )}
                        </div>

                        {/* Image upload */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Photo produit</Label>
                            <span className="text-xs text-purple-400/70 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Vision IA
                            </span>
                          </div>
                          {imagePreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-white/[0.03]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imagePreview} alt="Aperçu produit" className="w-full h-32 object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                                <span className="text-xs text-white/85 flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-400" /> Image chargée
                                </span>
                                <button type="button" onClick={removeImage} className="text-white/60 hover:text-white bg-black/40 rounded-lg p-1">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => imageInputRef.current?.click()}
                              className="border border-dashed border-white/[0.10] hover:border-purple-500/40 rounded-xl p-5 text-center cursor-pointer transition-all group hover:bg-purple-600/[0.03]"
                            >
                              <ImagePlus className="h-6 w-6 text-white/15 group-hover:text-purple-400/50 mx-auto mb-1.5 transition-colors" />
                              <p className="text-xs text-white/30 group-hover:text-white/50 transition-colors">Ajouter une photo pour enrichir la fiche</p>
                              <p className="text-xs text-white/15 mt-0.5">JPG · PNG · WebP — optionnel</p>
                            </div>
                          )}
                          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
                        </div>

                        {/* Options grid */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="space-y-1.5">
                            <Label className="text-white/45 text-xs font-medium">Catégorie</Label>
                            <Select value={category} onValueChange={v => setCategory(v ?? 'Général')}>
                              <SelectTrigger className="bg-white/[0.04] border-white/[0.09] text-white rounded-xl h-10 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#12121e] border-white/[0.09] rounded-xl">
                                {CATEGORIES.map(c => (
                                  <SelectItem key={c} value={c} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-white/45 text-xs font-medium">Ton</Label>
                            <Select value={tone} onValueChange={v => setTone(v ?? 'professionnel')}>
                              <SelectTrigger className="bg-white/[0.04] border-white/[0.09] text-white rounded-xl h-10 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#12121e] border-white/[0.09] rounded-xl">
                                {TONES.map(t => (
                                  <SelectItem key={t.value} value={t.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-white/45 text-xs font-medium">Langue</Label>
                            <Select value={language} onValueChange={v => setLanguage(v ?? 'fr')}>
                              <SelectTrigger className="bg-white/[0.04] border-white/[0.09] text-white rounded-xl h-10 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#12121e] border-white/[0.09] rounded-xl">
                                {LANGUAGES.map(l => (
                                  <SelectItem key={l.value} value={l.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{l.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Variants toggle */}
                        <div
                          onClick={() => setWithVariants(v => !v)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${withVariants ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/[0.025] border-white/[0.065] hover:border-white/10'}`}
                        >
                          <div className={`w-10 h-5.5 w-10 h-[22px] rounded-full transition-colors relative shrink-0 ${withVariants ? 'bg-purple-600' : 'bg-white/12'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${withVariants ? 'left-[22px]' : 'left-0.5'}`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white/75">Générer 3 variantes A/B</p>
                            <p className="text-xs text-white/30 mt-0.5">3 approches différentes · compte comme 3 générations</p>
                          </div>
                        </div>

                        {/* Brand voice indicator */}
                        {(brandDesc || brandKeywords.length > 0) && (
                          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-purple-600/8 border border-purple-500/20">
                            <Building2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span className="text-xs text-purple-300/85 font-medium">Ton de marque activé</span>
                            <span className="text-xs text-purple-400/50">· style personnalisé</span>
                          </div>
                        )}

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-red-400 text-sm bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3"
                          >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                          </motion.div>
                        )}

                        {/* Generate button */}
                        <motion.button
                          type="submit"
                          disabled={loading}
                          whileHover={{ scale: loading ? 1 : 1.01 }}
                          whileTap={{ scale: loading ? 1 : 0.99 }}
                          className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:from-purple-600/50 disabled:to-violet-600/50 text-white rounded-xl h-12 gap-2.5 font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-600/20 hover:shadow-purple-600/35 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {!loading && (
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                          )}
                          {loading ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white/25 border-t-white rounded-full animate-spin shrink-0" />
                              {withVariants ? 'Génération de 3 variantes...' : 'Génération en cours...'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              {withVariants ? 'Générer 3 variantes' : 'Générer la fiche produit'}
                              <ArrowRight className="h-4 w-4 ml-auto" />
                            </>
                          )}
                        </motion.button>

                        {/* Templates */}
                        <div className="pt-1 border-t border-white/[0.05]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/28 font-medium uppercase tracking-wider">Templates</span>
                            <button
                              type="button"
                              onClick={() => setShowSaveTemplate(v => !v)}
                              className="flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                            >
                              <BookmarkPlus className="h-3.5 w-3.5" /> Sauvegarder
                            </button>
                          </div>
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
                                  <button type="button" onClick={saveTemplate} className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors shrink-0">
                                    <Save className="h-3 w-3 text-white" />
                                  </button>
                                  <button type="button" onClick={() => setShowSaveTemplate(false)} className="px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors text-white/40">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {templates.length === 0 ? (
                            <p className="text-xs text-white/18 py-1">Aucun template — sauvegardez vos configurations favorites</p>
                          ) : (
                            <div className="space-y-1">
                              {templates.map(tmpl => (
                                <div key={tmpl.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.025] border border-white/[0.05] hover:border-white/10 group/tmpl transition-colors">
                                  <Bookmark className="h-3 w-3 text-purple-400/60 shrink-0" />
                                  <button
                                    type="button"
                                    onClick={() => loadTemplate(tmpl)}
                                    className="flex-1 text-left text-xs text-white/50 hover:text-white/80 transition-colors"
                                  >
                                    {tmpl.name}
                                    <span className="text-white/22 ml-1.5">· {tmpl.category} · {TONES.find(t => t.value === tmpl.tone)?.label}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTemplate(tmpl.id)}
                                    className="text-white/18 hover:text-red-400/70 transition-colors opacity-0 group-hover/tmpl:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* ── Résultats ─────────────────────────────────────────────── */}
                  <div>
                    <AnimatePresence mode="wait">
                      {displayResult ? (
                        <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                          {/* Variant navigation */}
                          {displayVariants && displayVariants.length > 1 ? (
                            <>
                              {/* Header */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-lg font-bold text-white">Variantes A/B</h2>
                                  <p className="text-xs text-white/35 mt-0.5">3 approches rédigées différemment</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setAbSideBySide(v => !v)}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${abSideBySide ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-white/[0.04] border-white/[0.065] text-white/40 hover:text-white/70'}`}
                                  >
                                    <Columns className="h-3 w-3" />
                                    <span className="hidden sm:inline">Comparer</span>
                                  </button>
                                  <button
                                    onClick={() => copyAll(displayVariants[activeVariant])}
                                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${copied === 'all' ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-white/[0.04] border-white/[0.065] text-white/40 hover:text-white/70'}`}
                                  >
                                    {copied === 'all' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    Tout copier
                                  </button>
                                </div>
                              </div>

                              {abSideBySide ? (
                                <div className="space-y-3">
                                  <p className="text-xs text-white/28">Vue comparative — cliquez pour sélectionner une variante</p>
                                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                    {displayVariants.map((v, i) => (
                                      <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl ${i === activeVariant ? 'bg-purple-600 text-white' : 'bg-white/[0.05] text-white/40'}`}>
                                            Variante {i + 1}
                                          </span>
                                          <button onClick={() => { setActiveVariant(i); setAbSideBySide(false) }} className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors">
                                            Voir →
                                          </button>
                                        </div>
                                        <div className={`p-4 rounded-2xl border space-y-3 ${i === activeVariant ? 'bg-purple-600/5 border-purple-500/20' : 'bg-white/[0.03] border-white/[0.065]'}`}>
                                          <div>
                                            <p className="text-xs text-white/30 uppercase tracking-wide mb-1.5">Titre</p>
                                            <p className="text-xs text-white/75 leading-snug font-medium">{v.title}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-white/30 uppercase tracking-wide mb-1.5">Meta</p>
                                            <p className="text-xs text-white/50 leading-snug line-clamp-2">{v.metaDescription}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-white/30 uppercase tracking-wide mb-1.5">Points clés</p>
                                            <ul className="space-y-1">
                                              {v.bulletPoints.slice(0, 3).map((bp, bi) => (
                                                <li key={bi} className="flex gap-1.5 text-xs text-white/50">
                                                  <span className="text-purple-400 shrink-0">›</span> {bp}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                                          <BarChart2 className="h-3 w-3 text-white/30" />
                                          <span className="text-xs text-white/30">Score SEO</span>
                                          <span className={`text-xs font-bold ml-auto ${calculateSEOScore(v, keywords).score >= 75 ? 'text-green-400' : calculateSEOScore(v, keywords).score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {calculateSEOScore(v, keywords).score}/100
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setActiveVariant(v => Math.max(0, v - 1))}
                                      disabled={activeVariant === 0}
                                      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.065] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {displayVariants.map((_, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setActiveVariant(i)}
                                        className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeVariant === i ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'bg-white/[0.04] text-white/40 hover:text-white/70'}`}
                                      >
                                        Variante {i + 1}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => setActiveVariant(v => Math.min(displayVariants.length - 1, v + 1))}
                                      disabled={activeVariant === displayVariants.length - 1}
                                      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.065] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronRight className="h-4 w-4" />
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
                              {/* Single result header */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <h2 className="text-lg font-bold text-white">Fiche générée</h2>
                                  <p className="text-xs text-white/35 mt-0.5">Éditez les champs, puis copiez</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.065] text-white/40 hover:text-white/70 transition-all"
                                  >
                                    <Eye className="h-3 w-3" /> Aperçu
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={e => { e.stopPropagation(); setShowExportMenu(v => !v) }}
                                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${copied === 'all' ? 'bg-green-500/15 border-green-500/25 text-green-400' : 'bg-white/[0.04] border-white/[0.065] text-white/40 hover:text-white/70'}`}
                                    >
                                      {copied === 'all' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                      Exporter <ChevronDown className="h-3 w-3" />
                                    </button>
                                    <AnimatePresence>
                                      {showExportMenu && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                          transition={{ duration: 0.12 }}
                                          className="absolute right-0 top-full mt-1 z-20 w-52 rounded-xl bg-[#12121e] border border-white/[0.1] shadow-xl overflow-hidden"
                                        >
                                          {[
                                            { label: 'Tout copier', sub: 'Format standard', icon: <Copy className="h-3.5 w-3.5 text-white/30 shrink-0" />, onClick: () => { copyAll(displayResult!); setShowExportMenu(false) } },
                                            { label: 'Format Etsy', sub: 'Titre 140 car. · 13 tags', icon: <span className="text-base leading-none shrink-0">🛍️</span>, onClick: () => { copyForEtsy(displayResult!); setShowExportMenu(false) } },
                                            { label: 'Format Amazon', sub: 'Titre 200 car. · 5 bullets', icon: <span className="text-base leading-none shrink-0">📦</span>, onClick: () => { copyForAmazon(displayResult!); setShowExportMenu(false) } },
                                            { label: 'Exporter .txt', sub: 'Fichier texte formaté', icon: <Download className="h-3.5 w-3.5 text-white/30 shrink-0" />, onClick: () => { exportSheetTxt(displayResult!, productName); setShowExportMenu(false) } },
                                          ].map((item, i) => (
                                            <div key={item.label}>
                                              <button
                                                onClick={item.onClick}
                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
                                              >
                                                {item.icon}
                                                <div>
                                                  <p className="font-medium">{item.label}</p>
                                                  <p className="text-white/30">{item.sub}</p>
                                                </div>
                                              </button>
                                              {(i === 0 || i === 2) && <div className="h-px bg-white/[0.06] mx-3" />}
                                            </div>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
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

                      ) : loading ? (
                        <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="h-5 w-36 bg-white/[0.07] rounded-lg animate-pulse mb-1.5" />
                              <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-28 bg-white/[0.04] rounded-xl animate-pulse" />
                          </div>
                          {[
                            { w: '90%', lines: 1, accent: 'bg-purple-500/10' },
                            { w: '85%', lines: 1, accent: 'bg-blue-500/10' },
                            { w: '100%', lines: 3, accent: 'bg-indigo-500/10' },
                            { w: '100%', lines: 4, accent: 'bg-teal-500/10' },
                            { w: '80%', lines: 1, accent: 'bg-pink-500/10' },
                          ].map(({ w, lines, accent }, i) => (
                            <div key={i} className={`rounded-2xl border border-white/[0.065] overflow-hidden ${accent}`}>
                              <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/[0.06] animate-pulse" />
                                <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                                <div className="ml-auto h-7 w-16 bg-white/[0.04] rounded-lg animate-pulse" />
                              </div>
                              <div className="px-4 py-3 space-y-2">
                                {Array.from({ length: lines }).map((_, li) => (
                                  <div key={li} className="h-3.5 bg-white/[0.05] rounded animate-pulse" style={{ width: li === 0 ? w : `${60 + Math.random() * 30}%` }} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>

                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center min-h-[400px]">
                          <div className="text-center px-6 py-16">
                            <div className="relative mx-auto mb-6 w-20 h-20">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/15 to-violet-600/10 border border-purple-500/20 flex items-center justify-center">
                                <Sparkles className="h-9 w-9 text-purple-500/40" />
                              </div>
                              <div className="absolute inset-0 rounded-2xl bg-purple-600/5 blur-xl" />
                            </div>
                            <h3 className="text-base font-semibold text-white/60 mb-2">Votre fiche apparaîtra ici</h3>
                            <p className="text-sm text-white/25 max-w-xs mx-auto leading-relaxed">Remplissez le formulaire à gauche et cliquez sur <strong className="text-white/40">Générer</strong></p>
                            <p className="text-xs text-white/18 mt-3">Raccourci : <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded text-white/30 font-mono">⌘ Enter</kbd></p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Bulk tab ──────────────────────────────────────────────────────── */}
            {activeTab === 'bulk' && (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Génération en masse</h1>
                  <p className="text-sm text-white/40 mt-1">Uploadez un CSV et générez jusqu&apos;à 100 fiches en une fois.</p>
                </div>

                <div className="max-w-3xl relative">

                  {/* Pro overlay */}
                  {profile.plan === 'free' && (
                    <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center text-center bg-[#07070f]/85 backdrop-blur-sm px-6 py-16 border border-white/[0.065]">
                      <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-5">
                        <Crown className="h-7 w-7 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Fonctionnalité Pro</h3>
                      <p className="text-sm text-white/45 mb-7 max-w-sm leading-relaxed">La génération en masse est disponible à partir du plan Starter. Traitez tout votre catalogue en une nuit.</p>
                      <Link href="/pricing">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/25">
                          <Crown className="h-4 w-4" /> Passer Pro <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  )}

                  {bulkStatus === 'idle' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.055] flex items-center justify-between">
                          <div>
                            <h2 className="text-sm font-semibold text-white/85">Importer un fichier CSV</h2>
                            <p className="text-xs text-white/40 mt-0.5">Colonnes : product_name, keywords, category, tone, language</p>
                          </div>
                          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.065] hover:border-white/10">
                            <Download className="h-3 w-3" /> Modèle CSV
                          </button>
                        </div>
                        <div className="p-5">
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-10 text-center cursor-pointer transition-all group hover:bg-purple-600/[0.03]"
                          >
                            <Upload className="h-9 w-9 text-white/15 group-hover:text-purple-400/50 mx-auto mb-3 transition-colors" />
                            {bulkFile ? (
                              <p className="text-sm text-white/60 font-medium">{bulkFile} — <span className="text-purple-400">{bulkRows.length} produits</span></p>
                            ) : (
                              <>
                                <p className="text-sm text-white/40 font-medium">Glissez votre CSV ici</p>
                                <p className="text-xs text-white/20 mt-1">ou cliquez pour parcourir</p>
                              </>
                            )}
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                          </div>
                        </div>
                      </div>

                      {bulkRows.length > 0 && (
                        <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden">
                          <div className="px-5 py-4 border-b border-white/[0.055]">
                            <h3 className="text-sm font-semibold text-white/85">Aperçu — {bulkRows.length} produits détectés</h3>
                          </div>
                          <div className="p-5">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-white/[0.065]">
                                    {['Produit', 'Mots-clés', 'Catégorie', 'Ton', 'Langue'].map(h => (
                                      <th key={h} className="text-left text-white/35 font-semibold pb-2 pr-4">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {bulkRows.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="border-b border-white/[0.03]">
                                      <td className="py-2.5 pr-4 text-white/75 font-medium max-w-[140px] truncate">{row.productName}</td>
                                      <td className="py-2.5 pr-4 text-white/45 max-w-[140px] truncate">{row.keywords}</td>
                                      <td className="py-2.5 pr-4 text-white/45">{row.category}</td>
                                      <td className="py-2.5 pr-4 text-white/45">{row.tone}</td>
                                      <td className="py-2.5 text-white/45">{row.language}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {bulkRows.length > 5 && <p className="text-xs text-white/22 mt-3">... et {bulkRows.length - 5} autres produits</p>}
                            </div>
                            <button
                              onClick={handleBulkGenerate}
                              className="mt-5 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/20"
                            >
                              <Sparkles className="h-4 w-4" />
                              Lancer la génération — {bulkRows.length} fiches
                            </button>
                          </div>
                        </div>
                      )}

                      {bulkError && (
                        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {bulkError}
                        </div>
                      )}
                    </div>
                  )}

                  {bulkStatus === 'processing' && (
                    <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] p-12 text-center">
                      <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                          <RefreshCw className="h-7 w-7 text-purple-400 animate-spin" />
                        </div>
                        <div className="absolute inset-0 bg-purple-600/10 rounded-2xl blur-xl" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">Génération en cours</h3>
                      <p className="text-sm text-white/40 mb-6">{bulkProgress.processed} / {bulkProgress.total} fiches générées</p>
                      <div className="w-full max-w-sm mx-auto h-2 bg-white/[0.07] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                          animate={{ width: bulkProgress.total > 0 ? `${(bulkProgress.processed / bulkProgress.total) * 100}%` : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-white/20 mt-4">La page se met à jour automatiquement</p>
                    </div>
                  )}

                  {bulkStatus === 'done' && (
                    <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/[0.055] flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">Génération terminée</h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            <span className="text-green-400">{bulkResults.filter(r => !r.error).length}</span> / {bulkResults.length} fiches générées
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setBulkStatus('idle'); setBulkRows([]); setBulkFile(null); setBulkJobId(null); setBulkResults([]) }}
                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.065] transition-all"
                          >
                            <RefreshCw className="h-3 w-3" /> Nouveau batch
                          </button>
                          <button
                            onClick={downloadBulkCSV}
                            className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 transition-all"
                          >
                            <Download className="h-3 w-3" /> Télécharger CSV
                          </button>
                        </div>
                      </div>
                      <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
                        {bulkResults.map((r, i) => (
                          <div key={i} className={`p-3.5 rounded-xl border text-xs ${r.error ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/10'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white/75">{r.productName}</span>
                              {r.error ? (
                                <span className="text-red-400 font-medium">Erreur</span>
                              ) : (
                                <span className="text-green-400 font-medium flex items-center gap-1"><Check className="h-3 w-3" /> OK</span>
                              )}
                            </div>
                            {!r.error && r.title && <p className="text-white/35 mt-1 truncate">{r.title}</p>}
                            {r.error && <p className="text-red-400/65 mt-1">{r.error}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Brand tab ─────────────────────────────────────────────────────── */}
            {activeTab === 'brand' && (
              <motion.div
                key="brand"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Ton de marque</h1>
                  <p className="text-sm text-white/40 mt-1">Configurez votre identité — chaque fiche sera adaptée à votre style.</p>
                </div>

                <div className="max-w-2xl relative">

                  {/* Pro overlay */}
                  {profile.plan === 'free' && (
                    <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center text-center bg-[#07070f]/85 backdrop-blur-sm px-6 py-16 border border-white/[0.065]">
                      <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-5">
                        <Crown className="h-7 w-7 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Fonctionnalité Pro</h3>
                      <p className="text-sm text-white/45 mb-7 max-w-sm leading-relaxed">Le profil de marque est disponible à partir du plan Starter.</p>
                      <Link href="/pricing">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/25">
                          <Crown className="h-4 w-4" /> Passer Pro <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  )}

                  <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.055]">
                      <h2 className="text-sm font-semibold text-white/85">Profil de marque</h2>
                    </div>
                    <form onSubmit={handleSaveBrand} className="p-5 space-y-5">
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Qui êtes-vous ?</Label>
                        <Textarea
                          placeholder="ex: Marque de vêtements éco-responsables pour femmes actives. Pièces durables, confortables et élégantes, fabriquées en France."
                          value={brandDesc}
                          onChange={e => setBrandDesc(e.target.value)}
                          rows={3}
                          className="bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Mots qui vous définissent</Label>
                        <p className="text-xs text-white/25">Ces mots seront intégrés naturellement dans vos fiches</p>
                        <TagInput value={brandKeywords} onChange={setBrandKeywords} placeholder="ex: durable, artisanal, élégant..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Mots à éviter</Label>
                        <p className="text-xs text-white/25">Ces mots ne seront jamais utilisés</p>
                        <TagInput value={brandAvoid} onChange={setBrandAvoid} placeholder="ex: pas cher, discount, promotion..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Exemple de texte de votre marque</Label>
                        <p className="text-xs text-white/25">L&apos;IA reproduira ce style d&apos;écriture</p>
                        <Textarea
                          placeholder="Collez ici une description produit que vous aimez..."
                          value={brandExample}
                          onChange={e => setBrandExample(e.target.value)}
                          rows={4}
                          className="bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={brandSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-md shadow-purple-600/20"
                      >
                        {brandSaving ? (
                          <><div className="h-3.5 w-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
                        ) : brandSaved ? (
                          <><Check className="h-3.5 w-3.5" /> Sauvegardé !</>
                        ) : (
                          <><Save className="h-3.5 w-3.5" /> Sauvegarder le profil</>
                        )}
                      </button>

                      {brandError && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {brandError}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── History tab ───────────────────────────────────────────────────── */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-4 sm:p-6 lg:p-8"
              >
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Historique</h1>
                  <p className="text-sm text-white/40 mt-1">{historyItems.length} fiche{historyItems.length > 1 ? 's' : ''} générée{historyItems.length > 1 ? 's' : ''}</p>
                </div>

                {historyItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 mb-5">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Rechercher un produit..."
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 pl-10"
                      />
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      {historySearch && (
                        <button onClick={() => setHistorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setHistoryFavOnly(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${historyFavOnly ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/[0.04] border-white/[0.09] text-white/35 hover:text-white/60'}`}
                      >
                        <Star className={`h-3.5 w-3.5 ${historyFavOnly ? 'fill-amber-400' : ''}`} /> Favoris
                      </button>
                      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.09] rounded-xl p-1">
                        {(['all', 'today', '7days', 'month'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setHistoryPeriod(p)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${historyPeriod === p ? 'bg-purple-600 text-white shadow-sm' : 'text-white/35 hover:text-white/60'}`}
                          >
                            {p === 'all' ? 'Tout' : p === 'today' ? "Auj." : p === '7days' ? '7j' : '30j'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {historyItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.065] flex items-center justify-center mx-auto mb-5">
                      <History className="h-7 w-7 text-white/15" />
                    </div>
                    <h3 className="text-base font-semibold text-white/40 mb-1">Aucune génération</h3>
                    <p className="text-sm text-white/22">Générez votre première fiche dans l&apos;onglet Générer</p>
                    <button
                      onClick={() => setActiveTab('generate')}
                      className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/25 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-all"
                    >
                      <Sparkles className="h-4 w-4" /> Générer ma première fiche
                    </button>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-white/35">Aucun résultat pour cette recherche</p>
                    <button onClick={() => { setHistorySearch(''); setHistoryPeriod('all') }} className="mt-3 text-xs text-purple-400/70 hover:text-purple-400 transition-colors">
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredHistory.map((gen, i) => (
                      <HistoryItem key={gen.id} gen={gen} index={i} onCopyAll={copyAll} copied={copied} onCopy={copy} onToggleFavorite={toggleFavorite} />
                    ))}
                  </div>
                )}

                {historyHasMore && !historySearch && historyPeriod === 'all' && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={loadMoreHistory}
                      disabled={historyLoading}
                      className="flex items-center gap-2 mx-auto text-xs text-white/40 hover:text-white/70 transition-colors px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.065] hover:border-white/10 disabled:opacity-50"
                    >
                      {historyLoading ? (
                        <><div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Chargement...</>
                      ) : (
                        <><RefreshCw className="h-3 w-3" /> Voir plus</>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ─── History Item (expandable) ────────────────────────────────────────────────

function exportTxt(gen: Generation) {
  posthog.capture('export_txt', { source: 'history' })
  const content = [
    `PRODUIT : ${gen.product_name}`,
    `DATE : ${new Date(gen.created_at).toLocaleDateString('fr-FR')}`,
    '',
    `TITRE SEO :`,
    gen.result.title,
    '',
    `META DESCRIPTION :`,
    gen.result.metaDescription,
    '',
    `DESCRIPTION :`,
    gen.result.description,
    '',
    `POINTS CLÉS :`,
    ...(gen.result.bulletPoints || []).map(b => `• ${b}`),
    '',
    `TAGS :`,
    (gen.result.tags || []).join(', '),
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shopscribe-${gen.product_name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function HistoryItem({ gen, index, onCopyAll, copied, onCopy, onToggleFavorite }: {
  gen: Generation
  index: number
  onCopyAll: (sheet: ProductSheet) => void
  copied: string | null
  onCopy: (text: string, id: string) => void
  onToggleFavorite: (id: string, current: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const tagCount = gen.result?.tags?.length ?? 0
  const bulletCount = gen.result?.bulletPoints?.length ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        gen.is_favorite
          ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/35'
          : 'bg-white/[0.025] border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between p-4 gap-3">
        <button className="min-w-0 flex-1 text-left group" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
              <FileText className="h-3 w-3 text-purple-400" />
            </div>
            <p className="text-white/85 text-sm font-semibold truncate group-hover:text-white transition-colors">{gen.product_name}</p>
          </div>
          {gen.result?.title && (
            <p className="text-white/35 text-xs leading-relaxed line-clamp-2 pl-8">{gen.result.title}</p>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(gen.id, gen.is_favorite) }}
            className={`p-1.5 rounded-lg transition-colors ${gen.is_favorite ? 'text-amber-400' : 'text-white/20 hover:text-amber-400/70'}`}
            title={gen.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`h-3.5 w-3.5 ${gen.is_favorite ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); exportTxt(gen) }}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 transition-colors"
            title="Exporter en .txt"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2">
          {bulletCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300/80 text-[11px] font-medium">
              <AlignLeft className="h-2.5 w-2.5" />
              {bulletCount} points
            </span>
          )}
          {tagCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300/80 text-[11px] font-medium">
              <Hash className="h-2.5 w-2.5" />
              {tagCount} tags
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/20 text-[11px]">
            {new Date(gen.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
          </span>
          <button onClick={() => setExpanded(v => !v)} className="p-1 rounded-lg text-white/20 hover:text-white/50 transition-colors">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && gen.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.05] px-4 pt-3 pb-4 space-y-2.5">
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => onCopyAll(gen.result)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12]"
                >
                  {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  Tout copier
                </button>
              </div>

              {/* SEO Title */}
              <div className="rounded-xl bg-purple-500/[0.06] border border-purple-500/[0.14] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-purple-400/70 uppercase tracking-wider">Titre SEO</span>
                  <button onClick={() => onCopy(gen.result.title, `hist-title-${gen.id}`)} className="p-1 rounded-lg text-white/20 hover:text-purple-400/70 transition-colors">
                    {copied === `hist-title-${gen.id}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-white/75 text-sm leading-relaxed">{gen.result.title}</p>
              </div>

              {/* Meta description */}
              <div className="rounded-xl bg-blue-500/[0.06] border border-blue-500/[0.14] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-blue-400/70 uppercase tracking-wider">Meta description</span>
                  <button onClick={() => onCopy(gen.result.metaDescription, `hist-meta-${gen.id}`)} className="p-1 rounded-lg text-white/20 hover:text-blue-400/70 transition-colors">
                    {copied === `hist-meta-${gen.id}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{gen.result.metaDescription}</p>
              </div>

              {/* Bullet points */}
              {gen.result.bulletPoints?.length > 0 && (
                <div className="rounded-xl bg-teal-500/[0.06] border border-teal-500/[0.14] p-3">
                  <span className="text-[10px] font-semibold text-teal-400/70 uppercase tracking-wider block mb-2">Points clés</span>
                  <ul className="space-y-1.5">
                    {gen.result.bulletPoints.map((bp, i) => (
                      <li key={i} className="flex gap-2 text-xs text-white/60 leading-relaxed">
                        <span className="text-teal-400 mt-0.5 shrink-0">›</span> {bp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {gen.result.tags?.length > 0 && (
                <div className="rounded-xl bg-pink-500/[0.06] border border-pink-500/[0.14] p-3">
                  <span className="text-[10px] font-semibold text-pink-400/70 uppercase tracking-wider block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {gen.result.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-lg bg-pink-600/10 border border-pink-500/20 text-pink-300 text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
