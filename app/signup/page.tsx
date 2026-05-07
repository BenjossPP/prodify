'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tag, Eye, EyeOff, Check, X } from 'lucide-react'

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

function translateError(message: string): string {
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (message.includes('Unable to validate email address')) {
    return 'Adresse email invalide.'
  }
  if (message.includes('Signup is disabled')) {
    return 'Les inscriptions sont temporairement désactivées.'
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const { score, checks } = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  async function handleSignup(e: React.FormEvent) {
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

    try {
      // Inscription via route admin (bypass confirmation email)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // Connexion automatique après inscription
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError(translateError(signInError.message))
          setLoading(false)
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } catch {
        setError('Erreur de connexion. Veuillez vous connecter manuellement.')
        setLoading(false)
      }
    } catch {
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
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
          {/* top-line lumineuse */}
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white mb-1">Créer un compte</h1>
            <p className="text-white/40 text-sm">3 générations gratuites pour commencer</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Prénom / Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-white/60 text-sm">Prénom</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-white/60 text-sm">Nom</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-11"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/60 text-sm">Mot de passe</Label>
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

            {/* Confirmation mot de passe */}
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
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-xl h-11 font-medium transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/35 disabled:opacity-50 mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Création en cours...
                </span>
              ) : 'Créer mon compte gratuitement'}
            </Button>
          </form>

          <p className="mt-5 text-center text-white/30 text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          Aucune carte requise · Annulation à tout moment
        </p>
      </motion.div>
    </div>
  )
}
