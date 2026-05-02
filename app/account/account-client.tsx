'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Zap, LogOut, Crown, User, Mail, Shield, ArrowRight,
  Check, Eye, EyeOff, X
} from 'lucide-react'

const PLAN_LABELS: Record<string, string> = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', business: 'Business' }
const PLAN_LIMITS: Record<string, number> = { free: 3, starter: 25, pro: 100, business: 500 }

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  return { score: Object.values(checks).filter(Boolean).length, checks }
}

const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

export default function AccountClient({
  user,
  profile,
}: {
  user: { email: string; id: string }
  profile: { plan: string; generations_used: number; first_name: string | null; last_name: string | null; created_at: string | null }
}) {
  const router = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState(profile.first_name || '')
  const [lastName, setLastName] = useState(profile.last_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const { score, checks } = getPasswordStrength(newPassword)
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  const limit = PLAN_LIMITS[profile.plan]
  const used = profile.generations_used
  const remaining = limit === -1 ? '∞' : Math.max(0, limit - used)
  const pct = limit === -1 ? 0 : Math.min(100, (used / limit) * 100)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')

    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq('id', user.id)

    if (error) {
      setProfileError('Erreur lors de la sauvegarde.')
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    }
    setProfileSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }
    if (score < 3) {
      setPasswordError('Le mot de passe n\'est pas assez sécurisé.')
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      if (error.message.includes('same password')) {
        setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien.')
      } else {
        setPasswordError('Erreur lors du changement de mot de passe.')
      }
    } else {
      setPasswordSaved(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    }
    setPasswordSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/80">ShopScribe</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5 text-xs gap-1.5 rounded-xl">
                Tableau de bord
              </Button>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5 relative">

        {/* Titre */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-semibold text-white">Mon compte</h1>
          <p className="text-white/40 text-sm mt-1">{user.email}</p>
        </motion.div>

        {/* Plan & quota */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
                <Crown className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Plan actuel</p>
                <p className="text-xs text-white/40">{PLAN_LABELS[profile.plan]}</p>
              </div>
            </div>
            <Badge className={`text-xs px-3 py-1 rounded-full border-0 font-medium ${profile.plan === 'free' ? 'bg-white/5 text-white/50' : 'bg-purple-600/20 text-purple-300'}`}>
              {profile.plan !== 'free' && <Crown className="h-3 w-3 mr-1" />}
              {PLAN_LABELS[profile.plan]}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>{limit === -1 ? 'Générations illimitées' : `${used} / ${limit} fiches utilisées`}</span>
              <span className="text-white/60">{remaining === '∞' ? '∞ restantes' : `${remaining} restantes`}</span>
            </div>
            {limit !== -1 && (
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>

          {profile.plan === 'free' && (
            <Link href="/pricing" className="inline-block mt-4">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs gap-1.5 px-3">
                <Crown className="h-3 w-3" /> Passer Pro
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Informations personnelles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Informations personnelles</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Prénom</Label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jean"
                  autoComplete="given-name"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/50 text-xs">Nom</Label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Dupont"
                  autoComplete="family-name"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs">Email</Label>
              <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {user.email}
              </div>
            </div>

            <AnimatePresence>
              {profileError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {profileError}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={profileSaving}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl gap-1.5 px-4"
            >
              {profileSaved ? (
                <><Check className="h-3.5 w-3.5" /> Sauvegardé</>
              ) : profileSaving ? (
                <><div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Sauvegarde...</>
              ) : 'Sauvegarder'}
            </Button>
          </form>
        </motion.div>

        {/* Changer le mot de passe */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Changer le mot de passe</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-purple-500/50 focus:ring-0 h-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {newPassword.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? strengthColors[score] : 'bg-white/10'}`} />
                      ))}
                    </div>
                    {score > 0 && <p className="text-xs text-white/40">Force : <span className="text-white/60">{strengthLabels[score]}</span></p>}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {[
                        { key: 'length', label: '8 caractères min.' },
                        { key: 'uppercase', label: '1 majuscule' },
                        { key: 'number', label: '1 chiffre' },
                        { key: 'special', label: '1 caractère spécial' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          {checks[key as keyof typeof checks]
                            ? <Check className="h-3 w-3 text-green-400 shrink-0" />
                            : <X className="h-3 w-3 text-white/20 shrink-0" />}
                          <span className={`text-xs ${checks[key as keyof typeof checks] ? 'text-white/50' : 'text-white/25'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/50 text-xs">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                  className={`bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:ring-0 h-10 pr-10 transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch ? 'border-green-500/40' : 'border-red-500/40'
                      : 'focus:border-purple-500/50'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <AnimatePresence>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400">Les mots de passe ne correspondent pas.</motion.p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {passwordError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {passwordError}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={passwordSaving}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl gap-1.5 px-4"
            >
              {passwordSaved ? (
                <><Check className="h-3.5 w-3.5" /> Mot de passe mis à jour</>
              ) : passwordSaving ? (
                <><div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Mise à jour...</>
              ) : 'Changer le mot de passe'}
            </Button>
          </form>
        </motion.div>

        {/* Déconnexion */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-xl gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </motion.div>

      </div>
    </div>
  )
}
