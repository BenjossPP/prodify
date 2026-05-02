import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProductSheet, generateProductSheetVariants } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, keywords, category, tone, language, variants } = body

    if (!productName || !keywords) {
      return NextResponse.json({ error: 'Nom du produit et mots-clés requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let brandProfile = undefined

    // Check quota for logged-in users
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, generations_used, brand_profile')
        .eq('id', user.id)
        .single()

      if (profile) {
        const plan = profile.plan || 'free'
        const limits: Record<string, number> = { free: 3, starter: 25, pro: 100, business: 500 }
        const limit = limits[plan] ?? 3
        // Each variant call counts as 3 generations
        const cost = variants ? 3 : 1

        if (limit !== -1 && profile.generations_used + cost > limit) {
          return NextResponse.json(
            { error: 'Quota atteint. Achetez un nouveau pack pour continuer.' },
            { status: 429 }
          )
        }

        // Inject brand profile if available
        if (profile.brand_profile) {
          brandProfile = profile.brand_profile
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

    const params = {
      productName,
      keywords,
      category: category || 'Général',
      tone: tone || 'professionnel',
      language: language || 'fr',
      brandProfile,
    }

    // Generate product sheet(s)
    let result = null
    let variantResults = null

    if (variants) {
      variantResults = await generateProductSheetVariants(params)
      result = variantResults[0]
    } else {
      result = await generateProductSheet(params)
    }

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

      const cost = variants ? 3 : 1
      for (let i = 0; i < cost; i++) {
        await supabase.rpc('increment_generations', { user_id: user.id })
      }
    }

    const response = NextResponse.json({
      success: true,
      data: variants ? variantResults : result,
      variants: !!variants,
    })

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
