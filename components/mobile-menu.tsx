'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, Tag, ArrowRight, LayoutDashboard, User,
  BadgeDollarSign, Layers, LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuProps {
  isLoggedIn?: boolean
}

const EASE = [0.21, 0.47, 0.32, 0.98] as const

export function MobileMenu({ isLoggedIn = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

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
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.8 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] flex flex-col shadow-2xl shadow-black/60"
              style={{ backgroundColor: '#0c0c15' }}
            >
              {/* Orb déco interne */}
              <div className="absolute top-[-10%] right-[-10%] w-[220px] h-[220px] rounded-full bg-purple-600/12 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-[10%] left-[-10%] w-[160px] h-[160px] rounded-full bg-indigo-500/8 blur-[60px] pointer-events-none" />

              {/* Bordure gauche lumineuse */}
              <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500/30 to-transparent" />

              {/* Header */}
              <div className="relative flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <Tag className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-semibold tracking-tight">ShopScribe</span>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Fermer"
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Links avec stagger */}
              <nav className="relative flex flex-col gap-1 px-3 py-5 flex-1">
                {links.map(({ href, label, icon: Icon }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07, duration: 0.35, ease: EASE }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.07] transition-all text-sm font-medium group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center group-hover:bg-purple-600/15 group-hover:border-purple-500/25 transition-all">
                        <Icon className="h-3.5 w-3.5 text-white/40 group-hover:text-purple-400 transition-colors" />
                      </div>
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Séparateur dégradé */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              {/* CTA */}
              <motion.div
                className="relative px-4 pb-10 pt-5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4, ease: EASE }}
              >
                {isLoggedIn ? (
                  <Link href="/account" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 gap-2 text-sm font-medium hover:shadow-lg hover:shadow-purple-600/25 transition-all">
                      <User className="h-4 w-4" />
                      Mon compte
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 gap-2 text-sm font-medium hover:shadow-lg hover:shadow-purple-600/25 transition-all">
                        Essayer gratuitement
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-center text-white/22 text-xs mt-3">3 générations gratuites · Sans CB</p>
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
