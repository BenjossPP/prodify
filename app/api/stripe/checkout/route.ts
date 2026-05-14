import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe'
import { VALID_PLANS } from '@/lib/plans'

// Whitelist server-side des priceIds autorisés — jamais fournis par le client
const ALLOWED_PRICE_IDS = new Set([
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
].filter(Boolean))

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !VALID_PLANS.includes(plan) || plan === 'free') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Résoudre le priceId côté serveur depuis le plan — jamais depuis le client
    const priceId = PLANS[plan as keyof typeof PLANS]?.stripePriceId
    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: 'Plan non disponible' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { supabase_uid: user.id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
