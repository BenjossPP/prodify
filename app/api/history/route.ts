import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const { data: items, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })

  return NextResponse.json({ items: items || [] })
}
