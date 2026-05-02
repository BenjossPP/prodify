import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateProductSheet } from '@/lib/openai'

// Admin client to bypass RLS for server-side job updates
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { rows } = body as { rows: Array<{ productName: string; keywords: string; category?: string; tone?: string; language?: string }> }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Aucune ligne fournie' }, { status: 400 })
  }

  if (rows.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 produits par batch' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, generations_used, brand_profile')
    .eq('id', user.id)
    .single()

  if (profile) {
    const plan = profile.plan || 'free'
    const limits: Record<string, number> = { free: 3, starter: 25, pro: 100, business: 500 }
    const limit = limits[plan] ?? 3
    const currentUsed = profile.generations_used

    if (limit !== -1 && currentUsed + rows.length > limit) {
      return NextResponse.json(
        { error: `Quota insuffisant. Vous avez ${Math.max(0, limit - currentUsed)} générations restantes.` },
        { status: 429 }
      )
    }
  }

  // Create bulk job
  const admin = getAdminClient()
  const { data: job, error: jobError } = await admin
    .from('bulk_jobs')
    .insert({ user_id: user.id, status: 'processing', total: rows.length, processed: 0, results: [] })
    .select()
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Erreur création du job' }, { status: 500 })
  }

  const brandProfile = profile?.brand_profile || undefined

  // Process asynchronously (fire and forget)
  processJob(job.id, rows, brandProfile, user.id).catch(console.error)

  return NextResponse.json({ jobId: job.id })
}

async function processJob(
  jobId: string,
  rows: Array<{ productName: string; keywords: string; category?: string; tone?: string; language?: string }>,
  brandProfile: unknown,
  userId: string
) {
  const admin = getAdminClient()
  const results: unknown[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const sheet = await generateProductSheet({
        productName: row.productName,
        keywords: row.keywords,
        category: row.category || 'Général',
        tone: row.tone || 'professionnel',
        language: (row.language as 'fr' | 'en') || 'fr',
        brandProfile: brandProfile as never,
      })

      results.push({ productName: row.productName, ...sheet, error: null })

      // Save to generations history
      await admin.from('generations').insert({
        user_id: userId,
        product_name: row.productName,
        keywords: row.keywords,
        category: row.category,
        tone: row.tone,
        language: row.language || 'fr',
        result: sheet,
      })

      await admin.rpc('increment_generations', { user_id: userId })
    } catch {
      results.push({ productName: row.productName, error: 'Échec de la génération' })
    }

    // Update progress
    await admin
      .from('bulk_jobs')
      .update({ processed: i + 1, results })
      .eq('id', jobId)
  }

  // Mark as done
  await admin
    .from('bulk_jobs')
    .update({ status: 'done', processed: rows.length, results })
    .eq('id', jobId)
}
