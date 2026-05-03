import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Only allow toggling is_favorite
  if (typeof body.is_favorite !== 'boolean') {
    return NextResponse.json({ error: 'Champ is_favorite requis (boolean)' }, { status: 400 })
  }

  const { error } = await supabase
    .from('generations')
    .update({ is_favorite: body.is_favorite })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
