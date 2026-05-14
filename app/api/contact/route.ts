import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const { name, email, subject, message } = body as Record<string, string>

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Le message est trop long (2000 caractères max).' }, { status: 400 })
  }

  try {
    await sendContactEmail({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez ou écrivez directement à support@shopscribe-ai.com.' }, { status: 500 })
  }
}
