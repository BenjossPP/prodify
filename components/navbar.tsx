'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, ArrowRight, LayoutDashboard, User } from 'lucide-react'
import { MobileMenu } from '@/components/mobile-menu'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setSessionLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setSessionLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={`relative w-full max-w-5xl transition-all duration-500 ${
          scrolled
            ? 'rounded-2xl bg-[#0b0b14]/90 backdrop-blur-2xl border border-white/[0.09] shadow-2xl shadow-black/40 py-2.5 px-4 sm:px-5'
            : 'rounded-2xl bg-[#080810]/50 backdrop-blur-xl border border-white/[0.06] py-3 px-4 sm:px-5'
        }`}
      >
        {/* top-line lumineuse */}
        <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:shadow-purple-600/55 transition-shadow duration-300">
                <Tag className="h-4 w-4 text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-base font-semibold tracking-tight bg-gradient-to-r from-white to-white/75 bg-clip-text text-transparent group-hover:to-white transition-all duration-300">
                ShopScribe
              </span>
            </Link>
          </motion.div>

          {/* Nav links — desktop */}
          <motion.div
            className="hidden md:flex items-center gap-1"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {[
              { href: '/#features', label: 'Fonctionnalités' },
              { href: '/pricing', label: 'Tarifs' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative group px-3.5 py-2 text-sm text-white/45 hover:text-white/90 transition-colors duration-200 rounded-xl hover:bg-white/[0.04]"
              >
                {label}
                <span className="absolute bottom-1.5 left-3.5 right-3.5 h-px bg-gradient-to-r from-purple-500/0 via-purple-400/60 to-purple-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
              </Link>
            ))}
          </motion.div>

          {/* CTA buttons — desktop */}
          <motion.div
            className="hidden md:flex items-center gap-2.5"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {sessionLoading ? (
              <div className="w-48 h-9 rounded-xl bg-white/[0.04] animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 px-3.5 py-2 text-sm text-white/50 hover:text-white/85 hover:bg-white/[0.05] rounded-xl transition-all duration-200">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </button>
                </Link>
                <Link href="/account">
                  <button className="relative flex items-center gap-2 px-4 py-2 text-sm text-white font-medium rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-300 overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                    <User className="h-3.5 w-3.5 relative z-10" />
                    <span className="relative z-10">Mon compte</span>
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-3.5 py-2 text-sm text-white/50 hover:text-white/85 hover:bg-white/[0.05] rounded-xl transition-all duration-200">
                    Connexion
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="relative flex items-center gap-2 px-4 py-2 text-sm text-white font-medium rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-300 overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                    <span className="relative z-10">Essayer gratuitement</span>
                    <ArrowRight className="h-3.5 w-3.5 relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Mobile menu */}
          <MobileMenu isLoggedIn={isLoggedIn} />
        </div>
      </motion.nav>
    </div>
  )
}
