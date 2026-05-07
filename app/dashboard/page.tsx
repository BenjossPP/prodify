import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_used, generations_limit, brand_profile')
    .eq('id', user.id)
    .single()

  const { data: history } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <DashboardClient
      user={{ email: user.email! }}
      profile={profile || { plan: 'free', generations_used: 0, generations_limit: 3, brand_profile: null }}
      history={history || []}
    />
  )
}
