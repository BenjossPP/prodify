import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './account-client'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_used, first_name, last_name, created_at')
    .eq('id', user.id)
    .single()

  return (
    <AccountClient
      user={{ email: user.email!, id: user.id }}
      profile={profile || { plan: 'free', generations_used: 0, first_name: null, last_name: null, created_at: null }}
    />
  )
}
