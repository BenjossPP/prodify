'use client'

import { useState, useRef, useCallback } from 'react'
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
  Zap, Copy, Check, LogOut, History, Sparkles,
  Crown, ArrowRight, FileText, Tag, AlignLeft, Hash,
  Upload, BarChart2, Layers, Building2, X, Download,
  ChevronLeft, ChevronRight, Save, RefreshCw, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  plan: string
  generations_used: number
  brand_profile: BrandProfile | null
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

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 500, business: -1 }
const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', pro: 'Pro', business: 'Business' }

const CATEGORIES = ['Général', 'Mode', 'Électronique', 'Sport', 'Maison', 'Beauté', 'Alimentation', 'Bijoux']
const TONES = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'luxueux', label: 'Luxueux' },
  { value: 'technique', label: 'Technique' },
  { value: 'fun', label: 'Fun & Dynamique' },
]

// ─── SEO Score ─────────────────────────────────────────────────────────────────

interface SEOCriteria {
  label: string
  passed: boolean
  points: number
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
    { label: 'Mot-clé principal dans le titre', passed: titleHasPrimary, points: 20 },
    { label: `Titre entre 40–80 caractères (${titleLength})`, passed: titleLengthOk, points: 15 },
    { label: `Meta entre 100–160 caractères (${metaLength})`, passed: metaLengthOk, points: 15 },
    { label: 'Mot-clé principal dans la description', passed: descHasPrimary, points: 15 },
    { label: 'Mots-clés représentés dans les tags', passed: tagsHaveKeywords, points: 20 },
    { label: `Description suffisamment longue (${wordCount} mots)`, passed: descLong, points: 15 },
  ]

  const score = criteria.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0)
  return { score, criteria }
}

function SEOScorePanel({ result, keywords }: { result: ProductSheet; keywords: string }) {
  const { score, criteria } = calculateSEOScore(result, keywords)
  const color = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bgColor = score >= 75 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'
  const barColor = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

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
      <div className="space-y-1.5">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={c.passed ? 'text-green-400' : 'text-white/20'}>
              {c.passed ? '✓' : '○'}
            </span>
            <span className={c.passed ? 'text-white/60' : 'text-white/25'}>{c.label}</span>
            <span className={`ml-auto ${c.passed ? 'text-white/40' : 'text-white/15'}`}>+{c.points}</span>
          </div>
        ))}
      </div>
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

// ─── Result Card ───────────────────────────────────────────────────────────────

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

function ProductSheetDisplay({ result, suffix, copied, onCopy }: {
  result: ProductSheet
  suffix?: string
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  const s = suffix || ''
  return (
    <div className="space-y-3">
      <ResultCard id={`title${s}`} label="Titre SEO" icon={FileText} content={result.title} copied={copied} onCopy={onCopy} />
      <ResultCard id={`meta${s}`} label="Meta description" icon={Hash} content={result.metaDescription} copied={copied} onCopy={onCopy} />
      <ResultCard id={`desc${s}`} label="Description" icon={AlignLeft} content={result.description} copied={copied} onCopy={onCopy} multiline />

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
              <CheckCircleIcon className="h-3 w-3 text-purple-400" />
            </div>
            <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Points clés</span>
          </div>
          <CopyButton id={`bullets${s}`} copied={copied} onCopy={() => onCopy(result.bulletPoints.map(b => `• ${b}`).join('\n'), `bullets${s}`)} />
        </div>
        <ul className="space-y-2">
          {result.bulletPoints.map((bp, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex gap-2 text-sm text-white/70">
              <span className="text-purple-400 mt-0.5 shrink-0">›</span> {bp}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-purple-600/15 flex items-center justify-center">
            <Tag className="h-3 w-3 text-purple-400" />
          </div>
          <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Tags</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-300 text-xs">{tag}</span>
          ))}
        </div>
      </div>
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
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProductSheet | null>(null)
  const [variantResults, setVariantResults] = useState<ProductSheet[] | null>(null)
  const [activeVariant, setActiveVariant] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Brand Voice state
  const [brandDesc, setBrandDesc] = useState(profile.brand_profile?.description || '')
  const [brandKeywords, setBrandKeywords] = useState<string[]>(profile.brand_profile?.keywords || [])
  const [brandAvoid, setBrandAvoid] = useState<string[]>(profile.brand_profile?.avoidWords || [])
  const [brandExample, setBrandExample] = useState(profile.brand_profile?.exampleText || '')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandSaved, setBrandSaved] = useState(false)

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
    setActiveVariant(0)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, keywords, category, tone, language, variants: withVariants }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erreur lors de la génération')
    } else if (withVariants) {
      setVariantResults(data.data)
      setResult(data.data[0])
      router.refresh()
    } else {
      setResult(data.data)
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

  // ─── CSV ─────────────────────────────────────────────────────────────────────

  function parseCSV(text: string): BulkRow[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return {
        productName: row['product_name'] || row['nom'] || row['name'] || '',
        keywords: row['keywords'] || row['mots_cles'] || row['mots-clés'] || '',
        category: row['category'] || row['categorie'] || row['catégorie'] || 'Général',
        tone: row['tone'] || row['ton'] || 'professionnel',
        language: row['language'] || row['langue'] || 'fr',
      }
    }).filter(r => r.productName && r.keywords)
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
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
            <span className="text-sm font-semibold text-white/80">ShopScribe</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge className={`text-xs px-2 sm:px-3 py-1 rounded-full border-0 font-medium ${profile.plan === 'free' ? 'bg-white/5 text-white/50' : 'bg-purple-600/20 text-purple-300'}`}>
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
                {limit === -1 ? 'Générations illimitées' : `${used} / ${limit} générations utilisées ce mois`}
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

        {/* Tabs */}
        <Tabs defaultValue="generate">
          <TabsList className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-6 w-full sm:w-auto sm:inline-flex">
            <TabsTrigger value="generate" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-3 sm:px-4">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Générer
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-3 sm:px-4">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Masse
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-3 sm:px-4">
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Ma Marque
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 sm:flex-none rounded-lg text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/40 px-3 sm:px-4">
              <History className="h-3.5 w-3.5 mr-1.5" /> Historique
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
                          {CATEGORIES.map(c => (
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
                        {TONES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-white/70 focus:bg-white/[0.06] focus:text-white rounded-lg">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Variantes toggle */}
                  <div
                    onClick={() => setWithVariants(v => !v)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${withVariants ? 'bg-purple-600/10 border-purple-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:border-white/10'}`}
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
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          {withVariants ? 'Génération de 3 variantes...' : 'Génération en cours...'}
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
                </form>
              </motion.div>

              {/* Résultats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="space-y-3">

                      {/* Variants tab switcher */}
                      {variantResults && variantResults.length > 1 ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-semibold text-white">Variantes A/B</h2>
                              <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">3 versions</span>
                            </div>
                            <button
                              onClick={() => copyAll(variantResults[activeVariant])}
                              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10"
                            >
                              {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                              Copier tout
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <button
                              onClick={() => setActiveVariant(v => Math.max(0, v - 1))}
                              disabled={activeVariant === 0}
                              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            {variantResults.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setActiveVariant(i)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeVariant === i ? 'bg-purple-600 text-white' : 'bg-white/[0.04] text-white/40 hover:text-white/70'}`}
                              >
                                Variante {i + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => setActiveVariant(v => Math.min(variantResults.length - 1, v + 1))}
                              disabled={activeVariant === variantResults.length - 1}
                              className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <ProductSheetDisplay result={variantResults[activeVariant]} suffix={`v${activeVariant}`} copied={copied} onCopy={copy} />
                          <SEOScorePanel result={variantResults[activeVariant]} keywords={keywords} />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <h2 className="text-base font-semibold text-white">Résultat</h2>
                            <button
                              onClick={() => copyAll(result)}
                              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10"
                            >
                              {copied === 'all' ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                              Tout copier
                            </button>
                          </div>
                          <ProductSheetDisplay result={result} copied={copied} onCopy={copy} />
                          <SEOScorePanel result={result} keywords={keywords} />
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center">
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

          {/* ── Onglet Masse ───────────────────────────────────────────────────── */}
          <TabsContent value="bulk">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {bulkStatus === 'idle' && (
                <>
                  {/* Upload zone */}
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-semibold text-white">Génération en masse</h2>
                        <p className="text-xs text-white/40 mt-0.5">Uploadez un CSV pour générer jusqu&apos;à 100 fiches produits</p>
                      </div>
                      <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10">
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
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <h3 className="text-sm font-semibold text-white mb-3">Aperçu — {bulkRows.length} produits</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.06]">
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
                <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
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
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">Génération terminée</h3>
                      <p className="text-xs text-white/40 mt-0.5">{bulkResults.filter(r => !r.error).length} / {bulkResults.length} fiches générées avec succès</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setBulkStatus('idle'); setBulkRows([]); setBulkFile(null); setBulkJobId(null); setBulkResults([]) }}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/10"
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

                <form onSubmit={handleSaveBrand} className="space-y-5 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
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
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white/80 text-sm font-medium truncate">{gen.product_name}</p>
                        {gen.result?.title && (
                          <p className="text-white/30 text-xs mt-0.5 truncate max-w-[200px] sm:max-w-xs">{gen.result.title}</p>
                        )}
                      </div>
                      <span className="text-white/25 text-xs shrink-0 ml-3">
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
