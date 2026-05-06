import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page introuvable — ShopScribe',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Orbes de fond */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-12 ">
          <img src="/Logo SS.png" alt="ShopScribe" className="h-8 w-auto" />
        </Link>

        {/* 404 */}
        <div className="text-[120px] font-heading font-bold leading-none bg-gradient-to-br from-purple-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent mb-4 select-none">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-white mb-3">
          Page introuvable
        </h1>
        <p className="text-white/50 text-base mb-10 leading-relaxed">
          Cette page n&apos;existe pas ou a été déplacée.<br />
          Retournez à l&apos;accueil ou accédez à votre dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-900/30"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-white/80 hover:text-white font-medium text-sm transition-all duration-200"
          >
            Mon dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
