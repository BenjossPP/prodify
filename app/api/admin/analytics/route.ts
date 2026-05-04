import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PH_HOST = 'https://eu.posthog.com'
const PH_PROJECT = process.env.POSTHOG_PROJECT_ID!
const PH_KEY = process.env.POSTHOG_PERSONAL_API_KEY!

async function phQuery(query: string): Promise<unknown[][]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000) // 12s timeout
  try {
    const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`PostHog query failed: ${res.status} — ${text}`)
    }
    const json = await res.json()
    return (json.results as unknown[][]) ?? []
  } finally {
    clearTimeout(timeout)
  }
}

// Version sécurisée qui retourne [] en cas d'erreur
async function phQuerySafe(query: string): Promise<unknown[][]> {
  try {
    return await phQuery(query)
  } catch (e) {
    console.error('[phQuerySafe]', e)
    return []
  }
}

export async function GET() {
  // Auth check
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const [
      kpiRows,
      onlineRows,
      countryRows,
      referrerRows,
      pageRows,
      dailyRows,
    ] = await Promise.all([
      // Pageviews + sessions uniques sur 7 jours
      phQuerySafe(`
        SELECT
          count() as pageviews,
          count(DISTINCT session_id) as sessions,
          count(DISTINCT person_id) as unique_visitors
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 7 DAY
      `),

      // Utilisateurs "en ligne" — sessions actives dans les 5 dernières minutes
      phQuerySafe(`
        SELECT count(DISTINCT person_id) as online
        FROM events
        WHERE timestamp >= now() - INTERVAL 5 MINUTE
      `),

      // Répartition par pays (30 derniers jours)
      phQuerySafe(`
        SELECT
          properties.$geoip_country_code as country_code,
          properties.$geoip_country_name as country_name,
          count(DISTINCT session_id) as sessions
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
          AND properties.$geoip_country_code IS NOT NULL
          AND properties.$geoip_country_code != ''
        GROUP BY country_code, country_name
        ORDER BY sessions DESC
        LIMIT 50
      `),

      // Sources de trafic (30 derniers jours)
      phQuerySafe(`
        SELECT
          properties.$referring_domain as domain,
          count(DISTINCT session_id) as sessions
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY domain
        ORDER BY sessions DESC
        LIMIT 30
      `),

      // Top pages visitées (7 derniers jours)
      phQuerySafe(`
        SELECT
          properties.$pathname as path,
          count() as views,
          count(DISTINCT session_id) as sessions
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 7 DAY
          AND properties.$pathname IS NOT NULL
        GROUP BY path
        ORDER BY views DESC
        LIMIT 15
      `),

      // Pageviews par jour (30 derniers jours)
      phQuerySafe(`
        SELECT
          toDate(timestamp) as day,
          count() as pageviews,
          count(DISTINCT session_id) as sessions
        FROM events
        WHERE event = '$pageview'
          AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day ASC
      `),
    ])

    // ── KPIs ────────────────────────────────────────────────────────────────
    const kpi = kpiRows[0] ?? [0, 0, 0]
    const kpis = {
      pageviews7d: Number(kpi[0]) || 0,
      sessions7d: Number(kpi[1]) || 0,
      uniqueVisitors7d: Number(kpi[2]) || 0,
      onlineNow: Number((onlineRows[0] ?? [0])[0]) || 0,
    }

    // ── Pays ────────────────────────────────────────────────────────────────
    const countries = countryRows.map(r => ({
      code: String(r[0] ?? ''),
      name: String(r[1] ?? ''),
      sessions: Number(r[2]) || 0,
    }))

    // ── Sources de trafic ───────────────────────────────────────────────────
    const rawReferrers = referrerRows.map(r => ({
      domain: String(r[0] ?? ''),
      sessions: Number(r[1]) || 0,
    }))

    // Catégoriser les sources
    const sourceMap: Record<string, number> = { Direct: 0, 'Moteurs de recherche': 0, 'Réseaux sociaux': 0, Autres: 0 }
    const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'ecosia', 'qwant']
    const socialNetworks = ['facebook', 'twitter', 't.co', 'instagram', 'linkedin', 'tiktok', 'youtube', 'reddit', 'pinterest', 'snapchat']
    const topReferrers: { domain: string; sessions: number; category: string }[] = []

    rawReferrers.forEach(r => {
      const d = r.domain.toLowerCase().replace('www.', '')
      let category = 'Autres'
      if (!d || d === '' || d === 'direct' || d === 'null') {
        category = 'Direct'
        sourceMap['Direct'] += r.sessions
      } else if (searchEngines.some(s => d.includes(s))) {
        category = 'Moteurs de recherche'
        sourceMap['Moteurs de recherche'] += r.sessions
      } else if (socialNetworks.some(s => d.includes(s))) {
        category = 'Réseaux sociaux'
        sourceMap['Réseaux sociaux'] += r.sessions
      } else {
        sourceMap['Autres'] += r.sessions
      }
      if (d && d !== '' && d !== 'null' && d !== 'direct') {
        topReferrers.push({ domain: r.domain || 'Direct', sessions: r.sessions, category })
      }
    })

    const trafficSources = Object.entries(sourceMap).map(([name, value]) => ({ name, value }))

    // ── Top pages ────────────────────────────────────────────────────────────
    const topPages = pageRows.map(r => ({
      path: String(r[0] ?? '/'),
      views: Number(r[1]) || 0,
      sessions: Number(r[2]) || 0,
    }))

    // ── Graphique journalier ─────────────────────────────────────────────────
    // Remplir les jours manquants
    const dailyMap: Record<string, { pageviews: number; sessions: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      dailyMap[d.toISOString().split('T')[0]] = { pageviews: 0, sessions: 0 }
    }
    dailyRows.forEach(r => {
      const key = String(r[0]).split('T')[0]
      if (key in dailyMap) {
        dailyMap[key] = { pageviews: Number(r[1]) || 0, sessions: Number(r[2]) || 0 }
      }
    })
    const dailyChart = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

    return NextResponse.json({
      kpis,
      countries,
      trafficSources,
      topReferrers: topReferrers.slice(0, 15),
      topPages,
      dailyChart,
    })
  } catch (err) {
    console.error('[admin/analytics]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
