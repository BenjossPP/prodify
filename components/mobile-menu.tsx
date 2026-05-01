'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-[#0e0e16] border-l border-white/[0.07] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-white font-semibold tracking-tight">Prodify</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                >
                  Tarifs
                </Link>
                <Link
                  href="/#features"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium"
                >
                  Connexion
                </Link>
              </nav>

              {/* CTA */}
              <div className="px-4 pb-8 pt-4 border-t border-white/[0.06]">
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 gap-2 text-sm font-medium">
                    Essayer gratuitement
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-center text-white/25 text-xs mt-3">3 générations gratuites · Sans CB</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
