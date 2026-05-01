import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: job, error } = await supabase
    .from('bulk_jobs')
    .select('id, status, total, processed, results, created_at')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (error || !job) return NextResponse.json({ error: 'Job introuvable' }, { status: 404 })

  return NextResponse.json(job)
}
