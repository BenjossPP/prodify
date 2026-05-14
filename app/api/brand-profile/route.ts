import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_DESCRIPTION_LENGTH = 1000
const MAX_EXAMPLE_TEXT_LENGTH = 2000
const MAX_KEYWORDS_COUNT = 30
const MAX_KEYWORD_LENGTH = 50

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

  // Validation des tailles pour éviter l'injection de données massives dans les prompts OpenAI
  if (description && typeof description === 'string' && description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: `Description trop longue (max ${MAX_DESCRIPTION_LENGTH} caractères)` }, { status: 400 })
  }
  if (exampleText && typeof exampleText === 'string' && exampleText.length > MAX_EXAMPLE_TEXT_LENGTH) {
    return NextResponse.json({ error: `Exemple de texte trop long (max ${MAX_EXAMPLE_TEXT_LENGTH} caractères)` }, { status: 400 })
  }
  if (keywords && Array.isArray(keywords)) {
    if (keywords.length > MAX_KEYWORDS_COUNT) {
      return NextResponse.json({ error: `Trop de mots-clés (max ${MAX_KEYWORDS_COUNT})` }, { status: 400 })
    }
    if (keywords.some((k: unknown) => typeof k !== 'string' || k.length > MAX_KEYWORD_LENGTH)) {
      return NextResponse.json({ error: `Mot-clé trop long (max ${MAX_KEYWORD_LENGTH} caractères)` }, { status: 400 })
    }
  }
  if (avoidWords && Array.isArray(avoidWords)) {
    if (avoidWords.length > MAX_KEYWORDS_COUNT) {
      return NextResponse.json({ error: `Trop de mots à éviter (max ${MAX_KEYWORDS_COUNT})` }, { status: 400 })
    }
    if (avoidWords.some((k: unknown) => typeof k !== 'string' || k.length > MAX_KEYWORD_LENGTH)) {
      return NextResponse.json({ error: `Mot à éviter trop long (max ${MAX_KEYWORD_LENGTH} caractères)` }, { status: 400 })
    }
  }

  const brand_profile = {
    description: description?.trim() || '',
    keywords: Array.isArray(keywords) ? keywords : [],
    avoidWords: Array.isArray(avoidWords) ? avoidWords : [],
    exampleText: exampleText?.trim() || '',
  }

  const { error } = await supabase
    .from('profiles')
    .update({ brand_profile })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })

  return NextResponse.json({ success: true })
}
