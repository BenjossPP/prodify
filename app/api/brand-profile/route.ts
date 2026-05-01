import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_profile')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ brand_profile: profile?.brand_profile || null })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { description, keywords, avoidWords, exampleText } = body

  const brand_profile = { description, keywords, avoidWords, exampleText }

  const { error } = await supabase
    .from('profiles')
    .update({ brand_profile })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  return NextResponse.json({ success: true })
}
