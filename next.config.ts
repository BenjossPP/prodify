import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig, {
  // Sentry organization and project settings (optional — only needed for source maps upload)
  // org: 'your-org',
  // project: 'shopscribe',

  // Silence Sentry CLI output during build
  silent: true,

  // Disable source maps upload if SENTRY_AUTH_TOKEN is not set
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automatically instrument Next.js routes
  autoInstrumentServerFunctions: true,
})
