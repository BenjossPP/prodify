'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Tag, ArrowRight, LayoutDashboard, User, Menu, X, BadgeDollarSign, Layers, LogIn, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  // Mark ready after mount to avoid SSR mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setIsAdmin(session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
      setSessionLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setIsAdmin(session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
      setSessionLoading(false)
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock scroll iOS Safari
  useEffect(() => {
    if (!menuOpen) return
    const y = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, y)
    }
  }, [menuOpen])

  const navLinks = [
    { href: '/#features', label: 'Fonctionnalités', icon: Layers },
    { href: '/pricing', label: 'Tarifs', icon: BadgeDollarSign },
    ...(isLoggedIn
      ? isAdmin
        ? [{ href: '/admin', label: 'Admin', icon: Shield }]
        : [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
      : [{ href: '/login', label: 'Connexion', icon: LogIn }]
    ),
  ]

  return (
    <>
      {/* ── Navbar pill ─────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-5">
        <nav
          className={`relative w-full max-w-5xl transition-all duration-500 ${
            scrolled
              ? 'rounded-2xl bg-[#0b0b14]/90 backdrop-blur-2xl border border-white/[0.09] shadow-2xl shadow-black/40 py-2.5 px-4 sm:px-5'
              : 'rounded-2xl bg-[#080810]/50 backdrop-blur-xl border border-white/[0.06] py-3 px-4 sm:px-5'
          }`}
        >
          <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <img src="/Logo SS.png" alt="ShopScribe" className="h-8 w-auto" />
            </Link>

            {/* Links desktop */}
            <div className="hidden md:flex items-center gap-1">
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
            </div>

            {/* CTA desktop */}
            <div className="hidden md:flex items-center gap-2.5">
              {sessionLoading ? (
                <div className="w-48 h-9 rounded-xl bg-white/[0.04] animate-pulse" />
              ) : isLoggedIn ? (
                <>
                  <Link href={isAdmin ? '/admin' : '/dashboard'}>
                    <button className="flex items-center gap-2 px-3.5 py-2 text-sm text-white/50 hover:text-white/85 hover:bg-white/[0.05] rounded-xl transition-all duration-200">
                      {isAdmin ? <Shield className="h-3.5 w-3.5" /> : <LayoutDashboard className="h-3.5 w-3.5" />}
                      {isAdmin ? 'Admin' : 'Dashboard'}
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
            </div>

            {/* Hamburger — mobile uniquement */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.09] text-white/65 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Drawer mobile ───────────────────────────────────────── */}
      {ready && (
        <>
          {/* Backdrop */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(0,0,0,0.72)',
              }}
            />
          )}

          {/* Drawer */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100%',
              zIndex: 9999,
              width: 300,
              maxWidth: 'calc(100vw - 48px)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#09090f',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.7)',
              transition: 'transform 0.35s cubic-bezier(0.21,0.47,0.32,0.98)',
              transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            {/* Bordure gauche */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(168,85,247,0.35), transparent)' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/Logo SS.png" alt="ShopScribe" style={{ height: 32, width: 'auto' }} />
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', flexShrink: 0 }}
                aria-label="Fermer"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Séparateur */}
            <div style={{ margin: '0 20px', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)', flexShrink: 0 }} />

            {/* CTA */}
            <div style={{ padding: '20px 16px 48px', flexShrink: 0 }}>
              {isLoggedIn ? (
                <Link href="/account" onClick={() => setMenuOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                  <button style={{ width: '100%', height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #9333ea, #7c3aed)', color: 'white', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <User style={{ width: 16, height: 16 }} />
                    Mon compte
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" onClick={() => setMenuOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                    <button style={{ width: '100%', height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #9333ea, #7c3aed)', color: 'white', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Essayer gratuitement
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </Link>
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12 }}>3 générations gratuites · Sans CB</p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
