'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import {
  Users, Zap, TrendingUp, Euro, Activity, Clock,
  CheckCircle, AlertCircle, Loader2, Package, RefreshCw,
  Shield, ChevronRight, Layers, Globe, MousePointer, Eye,
  ExternalLink, Search, Radio,
} from 'lucide-react'
import Link from 'next/link'

// ── Carte monde (dynamic import — SSR incompatible) ───────────────────────────
const WorldMap = dynamic(() => import('./world-map'), { ssr: false, loading: () => (
  <div className="h-[340px] flex items-center justify-center">
    <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
  </div>
)})

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPIs {
  totalUsers: number
  totalGenerations: number
  gensToday: number
  gensThisWeek: number
  activeUsers: number
  estimatedRevenue: number
}

interface DailyPoint { date: string; count: number }

interface AdminData {
  kpis: KPIs
  planCounts: { free: number; starter: number; pro: number; business: number }
  dailyChart: DailyPoint[]
  bulkStats: { pending: number; processing: number; done: number; error: number }
  recentUsers: Array<{ id: string; first_name: string | null; last_name: string | null; email: string; plan: string; generations_used: number; generations_limit: number; created_at: string }>
  recentGens: Array<{ id: string; user_id: string; email: string; product_name: string; created_at: string }>
  recentBulkJobs: Array<{ id: string; user_id: string; email: string; status: string; total: number; processed: number; created_at: string }>
}

interface AnalyticsData {
  kpis: {
    pageviews7d: number
    sessions7d: number
    uniqueVisitors7d: number
    onlineNow: number
  }
  countries: Array<{ code: string; name: string; sessions: number }>
  trafficSources: Array<{ name: string; value: number }>
  topReferrers: Array<{ domain: string; sessions: number; category: string }>
  topPages: Array<{ path: string; views: number; sessions: number }>
  dailyChart: Array<{ date: string; pageviews: number; sessions: number }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatDateShort(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function planLabel(plan: string) {
  return { free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business' }[plan] ?? plan
}

function planColor(plan: string) {
  return {
    free: 'bg-white/10 text-white/50',
    starter: 'bg-blue-500/20 text-blue-300',
    pro: 'bg-purple-500/20 text-purple-300',
    business: 'bg-amber-500/20 text-amber-300',
  }[plan] ?? 'bg-white/10 text-white/50'
}

function statusIcon(status: string) {
  if (status === 'done') return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
  if (status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
  if (status === 'processing') return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
  return <Clock className="h-3.5 w-3.5 text-white/30" />
}

function sourceIcon(name: string) {
  if (name === 'Moteurs de recherche') return <Search className="h-3.5 w-3.5 text-blue-400" />
  if (name === 'Réseaux sociaux') return <ExternalLink className="h-3.5 w-3.5 text-pink-400" />
  if (name === 'Direct') return <Globe className="h-3.5 w-3.5 text-purple-400" />
  return <ExternalLink className="h-3.5 w-3.5 text-white/40" />
}

const PIE_COLORS = ['#4b5563', '#3b82f6', '#a855f7', '#f59e0b']
const SOURCE_COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#6b7280']

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, accent = false, pulse = false,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  pulse?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 ${
      accent
        ? 'bg-gradient-to-br from-purple-600/20 to-violet-700/10 border-purple-500/30'
        : 'bg-white/[0.03] border-white/[0.07]'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-purple-500/30' : 'bg-white/[0.06]'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-purple-300' : 'text-white/50'}`} />
          {pulse && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-white/35">{sub}</div>}
      {accent && <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard({ data, adminEmail }: { data: AdminData; adminEmail: string }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'generations' | 'bulk' | 'analytics'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveData, setLiveData] = useState<AdminData>(data)

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setAnalyticsData(await res.json())
    } catch (e) {
      setAnalyticsError(String(e))
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Charger analytics au premier clic sur l'onglet
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData && !analyticsLoading) {
      loadAnalytics()
    }
  }, [activeTab, analyticsData, analyticsLoading, loadAnalytics])

  async function refresh() {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setLiveData(await res.json())
      if (activeTab === 'analytics') await loadAnalytics()
    } finally {
      setIsRefreshing(false)
    }
  }

  const d = liveData
  const planPieData = [
    { name: 'Gratuit', value: d.planCounts.free },
    { name: 'Starter', value: d.planCounts.starter },
    { name: 'Pro', value: d.planCounts.pro },
    { name: 'Business', value: d.planCounts.business },
  ]

  // Calcul max sessions pour la carte
  const maxSessions = analyticsData ? Math.max(...analyticsData.countries.map(c => c.sessions), 1) : 1

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm text-white">Admin</span>
              <span className="ml-2 text-xs text-white/30">{adminEmail}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg transition-all disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded-lg transition-all">
                <Layers className="h-3 w-3" />
                App
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pt-2 overflow-x-auto">
          {([
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'analytics', label: '🌍 Analytics' },
            { key: 'users', label: 'Utilisateurs' },
            { key: 'generations', label: 'Générations' },
            { key: 'bulk', label: 'Jobs Bulk' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-white border-purple-500'
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── Overview tab ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <Section title="Indicateurs clés">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <KpiCard icon={Users} label="Utilisateurs" value={d.kpis.totalUsers} sub="inscrits au total" />
                <KpiCard icon={Zap} label="Générations" value={d.kpis.totalGenerations} sub="toutes périodes" />
                <KpiCard icon={TrendingUp} label="Aujourd'hui" value={d.kpis.gensToday} sub="fiches générées" />
                <KpiCard icon={Activity} label="Cette semaine" value={d.kpis.gensThisWeek} sub="7 derniers jours" />
                <KpiCard icon={Users} label="Actifs 7j" value={d.kpis.activeUsers} sub="users avec générations" />
                <KpiCard icon={Euro} label="Revenus estimés" value={`${d.kpis.estimatedRevenue} €`} sub="plans vendus × prix" accent />
              </div>
            </Section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Générations — 30 derniers jours</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={d.dailyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} itemStyle={{ color: '#c084fc' }} labelFormatter={(v) => `${v}`} />
                    <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#genGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Répartition des plans</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={planPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {planPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} itemStyle={{ color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {planPieData.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-white/50">{p.name}</span>
                      </div>
                      <span className="text-white/70 font-medium">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Jobs Bulk</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Terminés', value: d.bulkStats.done, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'En cours', value: d.bulkStats.processing, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'En attente', value: d.bulkStats.pending, color: 'text-white/50', bg: 'bg-white/[0.05]' },
                    { label: 'Erreurs', value: d.bulkStats.error, color: 'text-red-400', bg: 'bg-red-500/10' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-4 ${s.bg} flex flex-col gap-1`}>
                      <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                      <span className="text-xs text-white/40">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Dernières générations</h3>
                  <button onClick={() => setActiveTab('generations')} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    Tout voir <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {d.recentGens.slice(0, 6).map(g => (
                    <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm text-white/80 truncate">{g.product_name || '—'}</p>
                        <p className="text-xs text-white/30 truncate">{g.email}</p>
                      </div>
                      <span className="text-xs text-white/25 ml-3 whitespace-nowrap">{formatDate(g.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Section title="Derniers inscrits">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
                  <div className="col-span-4">Utilisateur</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2 text-center">Plan</div>
                  <div className="col-span-2 text-center">Générations</div>
                  <div className="col-span-1 text-right">Inscrit</div>
                </div>
                {d.recentUsers.slice(0, 5).map(u => (
                  <div key={u.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/40 to-violet-600/40 flex items-center justify-center text-xs font-semibold text-purple-300 flex-shrink-0">
                        {(u.first_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-sm text-white/70 truncate">
                        {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email.split('@')[0]}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-white/40 truncate">{u.email}</div>
                    <div className="col-span-2 flex justify-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor(u.plan)}`}>{planLabel(u.plan)}</span>
                    </div>
                    <div className="col-span-2 text-center text-xs text-white/50">{u.generations_used} / {u.generations_limit}</div>
                    <div className="col-span-1 text-right text-xs text-white/25">{formatDate(u.created_at)}</div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── Analytics tab ────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <>
            {analyticsLoading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                <p className="text-sm text-white/40">Chargement des données PostHog…</p>
              </div>
            )}

            {analyticsError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-300 mb-1">Erreur lors du chargement des analytics</p>
                <p className="text-xs text-white/30 mb-4">{analyticsError}</p>
                <button onClick={loadAnalytics} className="px-4 py-2 text-xs bg-white/[0.06] hover:bg-white/10 rounded-lg transition-all text-white/60">
                  Réessayer
                </button>
              </div>
            )}

            {analyticsData && !analyticsLoading && (
              <>
                {/* KPIs Analytics */}
                <Section title="Trafic — 7 derniers jours">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard icon={Eye} label="Pages vues" value={analyticsData.kpis.pageviews7d.toLocaleString('fr-FR')} sub="7 derniers jours" />
                    <KpiCard icon={MousePointer} label="Sessions" value={analyticsData.kpis.sessions7d.toLocaleString('fr-FR')} sub="7 derniers jours" />
                    <KpiCard icon={Users} label="Visiteurs uniques" value={analyticsData.kpis.uniqueVisitors7d.toLocaleString('fr-FR')} sub="7 derniers jours" />
                    <KpiCard icon={Radio} label="En ligne maintenant" value={analyticsData.kpis.onlineNow} sub="sessions actives (5 min)" accent pulse />
                  </div>
                </Section>

                {/* Graphique pageviews + sessions */}
                <Section title="Évolution du trafic — 30 jours">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={analyticsData.dailyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                        />
                        <Line type="monotone" dataKey="pageviews" stroke="#a855f7" strokeWidth={2} dot={false} name="Pages vues" />
                        <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sessions" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-4 justify-center">
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <div className="w-3 h-0.5 bg-purple-500 rounded" />
                        Pages vues
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <div className="w-3 h-0.5 bg-blue-500 rounded" />
                        Sessions
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Carte monde */}
                <Section title="Carte mondiale des visiteurs — 30 jours">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <WorldMap countries={analyticsData.countries} maxSessions={maxSessions} />
                    {/* Top 5 pays sous la carte */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {analyticsData.countries.slice(0, 5).map((c, i) => (
                        <div key={c.code} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                          <span className="text-lg leading-none">{countryFlag(c.code)}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white/70 truncate">{c.name || c.code}</div>
                            <div className="text-xs text-white/35">{c.sessions} sessions</div>
                          </div>
                          {i === 0 && <span className="ml-auto text-xs text-purple-400">🥇</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Sources de trafic + Top référents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut sources */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Sources de trafic — 30 jours</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={analyticsData.trafficSources.filter(s => s.value > 0)}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analyticsData.trafficSources.filter(s => s.value > 0).map((_, i) => (
                            <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          itemStyle={{ color: 'white' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2.5">
                      {analyticsData.trafficSources.filter(s => s.value > 0).map((s, i) => {
                        const total = analyticsData.trafficSources.reduce((acc, x) => acc + x.value, 0)
                        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                        return (
                          <div key={s.name} className="flex items-center gap-3">
                            {sourceIcon(s.name)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/60">{s.name}</span>
                                <span className="text-xs text-white/40">{s.value} · {pct}%</span>
                              </div>
                              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Top référents */}
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-5">Domaines référents — 30 jours</h3>
                    <div className="space-y-2">
                      {analyticsData.topReferrers.length === 0 && (
                        <p className="text-sm text-white/25 text-center py-8">Aucun référent détecté</p>
                      )}
                      {analyticsData.topReferrers.slice(0, 10).map((r, i) => {
                        const maxRef = analyticsData.topReferrers[0]?.sessions || 1
                        return (
                          <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                            <div className="w-5 h-5 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                              {/* favicon via Google */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://www.google.com/s2/favicons?sz=16&domain=${r.domain}`}
                                alt=""
                                className="w-3.5 h-3.5 rounded"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/65 truncate">{r.domain}</span>
                                <span className="text-xs text-white/35 ml-2 flex-shrink-0">{r.sessions}</span>
                              </div>
                              <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500/70 to-violet-500/70" style={{ width: `${(r.sessions / maxRef) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Top pages */}
                <Section title="Pages les plus visitées — 7 jours">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                    <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
                      <div className="col-span-6">URL</div>
                      <div className="col-span-3 text-center">Vues</div>
                      <div className="col-span-3 text-right">Sessions</div>
                    </div>
                    {analyticsData.topPages.length === 0 && (
                      <div className="px-5 py-10 text-center text-white/25 text-sm">Aucune donnée disponible</div>
                    )}
                    {analyticsData.topPages.map((p, i) => {
                      const maxViews = analyticsData.topPages[0]?.views || 1
                      return (
                        <div key={i} className="grid grid-cols-12 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                          <div className="col-span-6 flex items-center gap-3">
                            <div className="w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center text-xs text-purple-400 font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-white/70 truncate font-mono">{p.path}</div>
                              <div className="mt-1 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className="text-sm font-medium text-white/70">{p.views.toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="col-span-3 text-right text-sm text-white/40">{p.sessions.toLocaleString('fr-FR')}</div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              </>
            )}
          </>
        )}

        {/* ── Users tab ────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <Section title={`Utilisateurs (${d.recentUsers.length} affichés)`}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
                <div className="col-span-3">Nom</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2 text-center">Plan</div>
                <div className="col-span-2 text-center">Quotas</div>
                <div className="col-span-2 text-right">Inscrit le</div>
              </div>
              {d.recentUsers.map(u => (
                <div key={u.id} className="grid grid-cols-12 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-violet-600/40 flex items-center justify-center text-xs font-semibold text-purple-300 flex-shrink-0">
                      {(u.first_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                    </div>
                    <span className="text-sm text-white/70 truncate">
                      {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : '—'}
                    </span>
                  </div>
                  <div className="col-span-3 text-sm text-white/50 truncate">{u.email}</div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${planColor(u.plan)}`}>{planLabel(u.plan)}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="text-xs text-white/50 mb-1">{u.generations_used} / {u.generations_limit}</div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${Math.min(100, (u.generations_used / Math.max(1, u.generations_limit)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-xs text-white/30">{formatDate(u.created_at)}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Generations tab ──────────────────────────────────── */}
        {activeTab === 'generations' && (
          <>
            <Section title="Graphique — 30 derniers jours">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={d.dailyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} itemStyle={{ color: '#c084fc' }} />
                    <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section title={`Dernières générations (${d.recentGens.length})`}>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
                  <div className="col-span-4">Produit</div>
                  <div className="col-span-4">Utilisateur</div>
                  <div className="col-span-4 text-right">Date</div>
                </div>
                {d.recentGens.map(g => (
                  <div key={g.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Package className="h-3 w-3 text-purple-300" />
                        </div>
                        <span className="text-sm text-white/70 truncate">{g.product_name || '—'}</span>
                      </div>
                    </div>
                    <div className="col-span-4 text-sm text-white/40 truncate">{g.email}</div>
                    <div className="col-span-4 text-right text-xs text-white/30">{formatDate(g.created_at)}</div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── Bulk tab ─────────────────────────────────────────── */}
        {activeTab === 'bulk' && (
          <>
            <Section title="Statuts globaux">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Terminés', value: d.bulkStats.done, color: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { label: 'En cours', value: d.bulkStats.processing, color: 'text-blue-400', border: 'border-blue-500/20' },
                  { label: 'En attente', value: d.bulkStats.pending, color: 'text-white/50', border: 'border-white/[0.07]' },
                  { label: 'Erreurs', value: d.bulkStats.error, color: 'text-red-400', border: 'border-red-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border ${s.border} bg-white/[0.02] p-5`}>
                    <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                    <div className="text-xs text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title={`Derniers jobs (${d.recentBulkJobs.length})`}>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-white/30 uppercase tracking-wider">
                  <div className="col-span-4">Utilisateur</div>
                  <div className="col-span-2 text-center">Statut</div>
                  <div className="col-span-3 text-center">Progression</div>
                  <div className="col-span-3 text-right">Date</div>
                </div>
                {d.recentBulkJobs.map(j => (
                  <div key={j.id} className="grid grid-cols-12 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="col-span-4 text-sm text-white/60 truncate">{j.email}</div>
                    <div className="col-span-2 flex justify-center items-center gap-1.5">
                      {statusIcon(j.status)}
                      <span className="text-xs text-white/40 capitalize">{j.status}</span>
                    </div>
                    <div className="col-span-3 text-center">
                      <div className="text-xs text-white/50 mb-1">{j.processed} / {j.total}</div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mx-2">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${j.total > 0 ? Math.min(100, (j.processed / j.total) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-xs text-white/30">{formatDate(j.created_at)}</div>
                  </div>
                ))}
                {d.recentBulkJobs.length === 0 && (
                  <div className="px-5 py-12 text-center text-white/25 text-sm">Aucun job bulk pour le moment</div>
                )}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

// ── Utilitaire drapeaux emoji ─────────────────────────────────────────────────
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍'
  return code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  )
}
