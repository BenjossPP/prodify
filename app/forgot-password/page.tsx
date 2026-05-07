'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
        // On affiche toujours le succès, sauf erreur réseau
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setError('Erreur de connexion. Vérifiez votre connexion internet.')
          setLoading(false)
          return
        }
      }

      setSent(true)
      setLoading(false)
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="relative p-8 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-center overflow-hidden">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
            <div className="w-16 h-16 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto mb-5">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Email envoyé</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-1">
              Si un compte existe pour{' '}
              <strong className="text-white/70">{email}</strong>,
              vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-white/25 text-xs mt-3 mb-6">
              Vérifiez aussi vos spams. Le lien expire dans 1 heure.
            </p>
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orbes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[250px] h-[250px] rounded-full bg-violet-500/4 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group ">
            <img src="/logo shopscribe.png" alt="ShopScribe" className="h-6 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="relative p-6 sm:p-8 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white mb-1">Mot de passe oublié</h1>
            <p className="text-white/40 text-sm">
              Entrez votre email et nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-11"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl h-11 font-medium transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/35 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </span>
              ) : 'Envoyer le lien'}
            </Button>
          </form>

          <p className="mt-5 text-center text-white/30 text-sm">
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
