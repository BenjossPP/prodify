import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Client admin sans session — utilisé uniquement pour les webhooks
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const session = event.data.object as any
      const uid = session.metadata?.supabase_uid
      const plan = session.metadata?.plan as keyof typeof PLANS

      console.log('checkout.session.completed — uid:', uid, 'plan:', plan)

      if (uid && plan && PLANS[plan]) {
        const generations = PLANS[plan].generations
        const { error } = await supabase
          .from('profiles')
          .update({
            plan,
            generations_used: 0,
            generations_limit: generations,
          })
          .eq('id', uid)

        if (error) console.error('Supabase update error:', error)
        else console.log('Plan mis à jour avec succès:', plan, 'pour', uid, '— quota:', generations)
      } else {
        console.warn('uid ou plan manquant / invalide dans les metadata:', session.metadata)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
