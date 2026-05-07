import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { email, password, first_name, last_name } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }

  // Client admin qui bypasse la confirmation email
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Créer l'utilisateur avec email_confirm: true pour bypasser la vérification
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: first_name || '',
      last_name: last_name || '',
      full_name: `${first_name || ''} ${last_name || ''}`.trim(),
    },
  })

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Une erreur est survenue. Veuillez réessayer.' }, { status: 400 })
  }

  // Envoyer l'email de bienvenue
  try {
    await sendWelcomeEmail(email, first_name || 'vous')
  } catch (emailErr) {
    console.error('[signup] Failed to send welcome email:', emailErr)
  }

  return NextResponse.json({ user: data.user }, { status: 201 })
}
