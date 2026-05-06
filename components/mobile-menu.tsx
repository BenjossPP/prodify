'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Tag, ArrowRight, LayoutDashboard, User,
  BadgeDollarSign, Layers, LogIn
} from 'lucide-react'

interface MobileMenuProps {
  isLoggedIn?: boolean
}

const EASE = [0.21, 0.47, 0.32, 0.98] as const

export function MobileMenu({ isLoggedIn = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true)
  }, [])
  const scrollY = useRef(0)

  useEffect(() => {
    if (open) {
      // iOS Safari fix : bloquer le scroll en fixant le body
      scrollY.current = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurer le scroll à la position exacte
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY.current)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { href: '/pricing', label: 'Tarifs', icon: BadgeDollarSign },
    { href: '/#features', label: 'Fonctionnalités', icon: Layers },
    ...(isLoggedIn
      ? [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }]
      : [{ href: '/login', label: 'Connexion', icon: LogIn }]
    ),
  ]

  return (
    <>
      {/* Hamburger */}
      <motion.button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.09] text-white/65 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Ouvrir le menu"
        whileTap={{ scale: 0.92 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {ready && open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9998,
                background: 'rgba(0,0,0,0.72)',
                // iOS Safari : utiliser -webkit-fill-available
                height: '100%',
                WebkitTapHighlightColor: 'transparent',
              }}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.9 }}
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
                // PAS de overflow:hidden ni de filter:blur ici — bug Safari
              }}
            >
              {/* Bordure gauche lumineuse — sans blur */}
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(168,85,247,0.35), transparent)', zIndex: 1 }} />

              {/* Header */}
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="/Logo SS.png" alt="ShopScribe" style={{ height: 32, width: 'auto' }} />
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', flexShrink: 0 }}
                  aria-label="Fermer"
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </motion.button>
              </div>

              {/* Links */}
              <nav style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
                {links.map(({ href, label, icon: Icon }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 0.3, ease: EASE }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.4)' }} />
                      </div>
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Séparateur */}
              <div style={{ margin: '0 20px', height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)', flexShrink: 0 }} />

              {/* CTA */}
              <motion.div
                style={{ position: 'relative', zIndex: 2, padding: '20px 16px 48px', flexShrink: 0 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.35, ease: EASE }}
              >
                {isLoggedIn ? (
                  <Link href="/account" onClick={() => setOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                    <button style={{ width: '100%', height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #9333ea, #7c3aed)', color: 'white', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(147,51,234,0.3)' }}>
                      <User style={{ width: 16, height: 16 }} />
                      Mon compte
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" onClick={() => setOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                      <button style={{ width: '100%', height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #9333ea, #7c3aed)', color: 'white', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(147,51,234,0.3)' }}>
                        Essayer gratuitement
                        <ArrowRight style={{ width: 16, height: 16 }} />
                      </button>
                    </Link>
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 12 }}>3 générations gratuites · Sans CB</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
