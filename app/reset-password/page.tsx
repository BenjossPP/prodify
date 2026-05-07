'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Eye, EyeOff, CheckCircle, Check, X } from 'lucide-react'

function getPasswordStrength(password: string): { score: number; checks: Record<string, boolean> } {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { score, checks }
}

const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { score, checks } = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  useEffect(() => {
    // Supabase handles the token from the URL hash automatically via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (score < 3) {
      setError('Le mot de passe n\'est pas assez sécurisé.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      if (error.message.includes('Auth session missing') || error.message.includes('session')) {
        setError('Le lien a expiré ou est invalide. Veuillez faire une nouvelle demande.')
      } else if (error.message.includes('same password')) {
        setError('Le nouveau mot de passe doit être différent de l\'ancien.')
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="relative p-8 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-center overflow-hidden">
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent" />
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Mot de passe mis à jour</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Votre mot de passe a été réinitialisé avec succès.
              Vous allez être redirigé vers votre tableau de bord.
            </p>
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
            <h1 className="text-xl font-semibold text-white mb-1">Nouveau mot de passe</h1>
            <p className="text-white/40 text-sm">Choisissez un mot de passe sécurisé.</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/60 text-sm">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Indicateur de force */}
              <AnimatePresence>
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-1"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= score ? strengthColors[score] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    {score > 0 && (
                      <p className="text-xs text-white/40">
                        Force : <span className="text-white/60">{strengthLabels[score]}</span>
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        { key: 'length', label: '8 caractères min.' },
                        { key: 'uppercase', label: '1 majuscule' },
                        { key: 'number', label: '1 chiffre' },
                        { key: 'special', label: '1 caractère spécial' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          {checks[key as keyof typeof checks] ? (
                            <Check className="h-3 w-3 text-green-400 shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-white/20 shrink-0" />
                          )}
                          <span className={`text-xs ${checks[key as keyof typeof checks] ? 'text-white/50' : 'text-white/25'}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-white/60 text-sm">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Répétez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:ring-0 h-11 pr-10 transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-500/40 focus:border-green-500/60'
                        : 'border-red-500/40 focus:border-red-500/60'
                      : 'focus:border-purple-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-400"
                  >
                    Les mots de passe ne correspondent pas.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Erreur globale */}
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
                  Mise à jour...
                </span>
              ) : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
