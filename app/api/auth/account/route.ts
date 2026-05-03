import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    if (body.confirmation !== 'SUPPRIMER') {
      return NextResponse.json({ error: 'Confirmation invalide' }, { status: 400 })
    }

    // Use admin client to delete the user from Supabase Auth
    // This cascades to profiles, generations, bulk_jobs via ON DELETE CASCADE
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Delete user error:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression du compte' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
