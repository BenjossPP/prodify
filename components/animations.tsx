'use client'

import { motion, useInView, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

// ─── Easing curves ────────────────────────────────────────────────────────────
const EASE_SMOOTH = [0.21, 0.47, 0.32, 0.98] as const
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EASE_SPRING = { type: 'spring', stiffness: 100, damping: 20 }

// ─── FadeIn ───────────────────────────────────────────────────────────────────
// Apparition avec direction + blur optionnel
export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  blur = false,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  blur?: boolean
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const directionMap = {
    up: { y: 32, x: 0 },
    down: { y: -32, x: 0 },
    left: { y: 0, x: 32 },
    right: { y: 0, x: -32 },
    none: { y: 0, x: 0 },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionMap[direction],
        filter: blur ? 'blur(10px)' : 'blur(0px)',
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }
          : {}
      }
      transition={{ duration: 0.7, delay, ease: EASE_SMOOTH }}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────
export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
}: {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerItem ──────────────────────────────────────────────────────────────
// Chaque enfant slide + fade + blur au scroll
export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.6, ease: EASE_SMOOTH },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── ScaleIn ──────────────────────────────────────────────────────────────────
// Zoom + fade depuis le centre
export function ScaleIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.88, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.6, delay, ease: EASE_SMOOTH }}
    >
      {children}
    </motion.div>
  )
}

// ─── SlideIn ──────────────────────────────────────────────────────────────────
// Slide latéral avec spring et blur — idéal pour les deux colonnes Before/After
export function SlideIn({
  children,
  delay = 0,
  from = 'left',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  from?: 'left' | 'right'
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: from === 'left' ? -48 : 48, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay, ease: EASE_SMOOTH }}
    >
      {children}
    </motion.div>
  )
}

// ─── RevealLine ───────────────────────────────────────────────────────────────
// Ligne décorative qui s'étire en largeur au scroll — pour les séparateurs
export function RevealLine({ delay = 0, className = '' }: { delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ scaleX: 0, originX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: EASE_SMOOTH }}
    />
  )
}

// ─── FloatCard ────────────────────────────────────────────────────────────────
// Card qui flotte en continu (boucle infinie) — pour les éléments hero décoratifs
export function FloatCard({
  children,
  amplitude = 8,
  duration = 4,
  className = '',
}: {
  children: React.ReactNode
  amplitude?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// ─── CountUp ──────────────────────────────────────────────────────────────────
// Compteur animé qui monte jusqu'à la valeur cible quand visible
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1.4,
  className = '',
}: {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const start = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const end = start + duration * 1000
    const tick = () => {
      const now = Date.now()
      const progress = Math.min((now - start) / (duration * 1000), 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}

// ─── GlowPulse ────────────────────────────────────────────────────────────────
// Wrapper qui pulse un glow violet autour de son enfant au scroll reveal
export function GlowPulse({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={
        isInView
          ? {
              opacity: 1,
              scale: 1,
              boxShadow: [
                '0 0 0px rgba(139,92,246,0)',
                '0 0 40px rgba(139,92,246,0.25)',
                '0 0 0px rgba(139,92,246,0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.7, delay, ease: EASE_SMOOTH }}
    >
      {children}
    </motion.div>
  )
}

// ─── TextReveal ───────────────────────────────────────────────────────────────
// Chaque mot apparaît en cascade avec blur → idéal pour les titres de section
export function TextReveal({
  text,
  delay = 0,
  className = '',
  wordClassName = '',
}: {
  text: string
  delay?: number
  className?: string
  wordClassName?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const words = text.split(' ')

  return (
    <motion.span
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: 0.06, delayChildren: delay } },
        hidden: {},
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className={`inline-block mr-[0.25em] ${wordClassName}`}
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.5, ease: EASE_SMOOTH },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}

// ─── ParallaxSection ──────────────────────────────────────────────────────────
// Section dont le contenu bouge légèrement au scroll (effet profondeur)
export function ParallaxSection({
  children,
  speed = 0.15,
  className = '',
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const raw = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`])
  const y = useSpring(raw, { stiffness: 80, damping: 20 })

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  )
}

// ─── AnimatedBadge ────────────────────────────────────────────────────────────
// Badge qui bounce à l'entrée dans le viewport
export function AnimatedBadge({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay }}
    >
      {children}
    </motion.div>
  )
}
