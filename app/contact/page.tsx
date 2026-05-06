'use client'

import { useState } from 'react'
import Link from 'next/link'

const SUBJECTS = [
  'Question sur un plan',
  'Problème technique',
  'Facturation / remboursement',
  'Suggestion d\'amélioration',
  'Autre',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Une erreur est survenue.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setErrorMsg('Erreur réseau. Réessayez ou écrivez à support@shopscribe-ai.com.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden">
      {/* Orbes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-purple-600/8 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto">
        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm transition-colors mb-10 inline-flex items-center gap-1.5">
          ← Retour à l&apos;accueil
        </Link>

        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-white mb-3">
            Nous contacter
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Une question, un problème ou une suggestion ? On vous répond sous 24h.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Message envoyé !</h2>
            <p className="text-white/50 text-sm mb-6">
              Nous avons bien reçu votre message et vous répondrons dans les 24h.
            </p>
            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' }) }}
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-white/60 mb-1.5" htmlFor="name">Nom</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jean@exemple.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="subject">Sujet</label>
              <select
                id="subject"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all appearance-none cursor-pointer"
              >
                {SUBJECTS.map(s => <option key={s} value={s} className="bg-[#0f0f1a]">{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Décrivez votre demande..."
                maxLength={2000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all resize-none"
              />
              <p className="text-white/25 text-xs mt-1.5 text-right">{form.message.length}/2000</p>
            </div>

            {status === 'error' && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>

            <p className="text-center text-white/30 text-xs">
              Ou écrivez directement à{' '}
              <a href="mailto:support@shopscribe-ai.com" className="text-purple-400/70 hover:text-purple-400 transition-colors">
                support@shopscribe-ai.com
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
