import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminDashboard from './admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  // Client admin (service role — bypasse le RLS)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [
    profilesRes,
    generationsRes,
    bulkJobsRes,
    recentUsersRes,
    recentGensRes,
    dailyGensRes,
  ] = await Promise.all([
    admin.from('profiles').select('id, first_name, last_name, plan, generations_used, generations_limit, created_at'),
    admin.from('generations').select('id, user_id, product_name, created_at'),
    admin.from('bulk_jobs').select('id, user_id, status, total, processed, created_at'),
    admin.from('profiles').select('id, first_name, last_name, plan, generations_used, generations_limit, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('generations').select('id, user_id, product_name, created_at').order('created_at', { ascending: false }).limit(15),
    admin.from('generations').select('created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const profiles = profilesRes.data || []
  const generations = generationsRes.data || []
  const bulkJobs = bulkJobsRes.data || []
  const recentUsers = recentUsersRes.data || []
  const recentGens = recentGensRes.data || []
  const dailyGensRaw = dailyGensRes.data || []

  // Emails via Auth Admin
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  authUsers?.forEach(u => { emailMap[u.id] = u.email || '' })

  // Stats
  const planCounts = { free: 0, starter: 0, pro: 0, business: 0 }
  profiles.forEach(p => {
    if (p.plan in planCounts) planCounts[p.plan as keyof typeof planCounts]++
  })

  const PLAN_PRICES = { free: 0, starter: 9, pro: 29, business: 59 }
  const estimatedRevenue = Object.entries(planCounts).reduce((sum, [plan, count]) => {
    return sum + count * PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
  }, 0)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const gensToday = generations.filter(g => new Date(g.created_at) >= today).length
  const gensThisWeek = generations.filter(g => new Date(g.created_at) >= weekAgo).length
  const activeUserIds = new Set(generations.filter(g => new Date(g.created_at) >= weekAgo).map(g => g.user_id))

  // Graphique 30 jours
  const dailyMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dailyMap[d.toISOString().split('T')[0]] = 0
  }
  dailyGensRaw.forEach(g => {
    const key = g.created_at.split('T')[0]
    if (key in dailyMap) dailyMap[key]++
  })
  const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  const bulkStats = {
    pending: bulkJobs.filter(j => j.status === 'pending').length,
    processing: bulkJobs.filter(j => j.status === 'processing').length,
    done: bulkJobs.filter(j => j.status === 'done').length,
    error: bulkJobs.filter(j => j.status === 'error').length,
  }

  const data = {
    kpis: {
      totalUsers: profiles.length,
      totalGenerations: generations.length,
      gensToday,
      gensThisWeek,
      activeUsers: activeUserIds.size,
      estimatedRevenue,
    },
    planCounts,
    dailyChart,
    bulkStats,
    recentUsers: recentUsers.map(u => ({ ...u, email: emailMap[u.id] || '' })),
    recentGens: recentGens.map(g => ({ ...g, email: emailMap[g.user_id] || '' })),
    recentBulkJobs: bulkJobs.slice(0, 10).map(j => ({ ...j, email: emailMap[j.user_id] || '' })),
  }

  return <AdminDashboard data={data} adminEmail={user.email!} />
}
