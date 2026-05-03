import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://ef72b6c2f5d56c1eceee046075d37c81@o4511327575015424.ingest.de.sentry.io/4511327578488912',
  tracesSampleRate: 0.2,
  debug: false,
})
