import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProductSheet } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, keywords, category, tone, language } = body

    if (!productName || !keywords) {
      return NextResponse.json({ error: 'Nom du produit et mots-clés requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check quota for logged-in users
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, generations_used, generations_reset_at')
        .eq('id', user.id)
        .single()

      if (profile) {
        const plan = profile.plan || 'free'
        const limits: Record<string, number> = { free: 10, pro: 500, business: -1 }
        const limit = limits[plan]

        // Reset monthly counter if needed
        const resetAt = new Date(profile.generations_reset_at || 0)
        const now = new Date()
        if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
          await supabase
            .from('profiles')
            .update({ generations_used: 0, generations_reset_at: now.toISOString() })
            .eq('id', user.id)
        } else if (limit !== -1 && profile.generations_used >= limit) {
          return NextResponse.json(
            { error: 'Quota mensuel atteint. Passez au plan supérieur.' },
            { status: 429 }
          )
        }
      }
    } else {
      // Anonymous users: check session-based limit via cookie
      const guestCount = parseInt(request.cookies.get('guest_gen')?.value || '0')
      if (guestCount >= 3) {
        return NextResponse.json(
          { error: 'Limite gratuite atteinte. Créez un compte pour continuer.' },
          { status: 429 }
        )
      }
    }

    // Generate product sheet
    const result = await generateProductSheet({
      productName,
      keywords,
      category: category || 'Général',
      tone: tone || 'professionnel',
      language: language || 'fr',
    })

    // Save to history if logged in
    if (user) {
      await supabase.from('generations').insert({
        user_id: user.id,
        product_name: productName,
        keywords,
        category,
        tone,
        language,
        result,
      })

      await supabase.rpc('increment_generations', { user_id: user.id })
    }

    const response = NextResponse.json({ success: true, data: result })

    // Increment guest counter
    if (!user) {
      const current = parseInt(request.cookies.get('guest_gen')?.value || '0')
      response.cookies.set('guest_gen', String(current + 1), { maxAge: 60 * 60 * 24 * 30 })
    }

    return response
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
