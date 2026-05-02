import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  free: {
    name: 'Gratuit',
    nameEn: 'Free',
    price: 0,
    generations: 3,
    stripePriceId: null,
  },
  starter: {
    name: 'Starter',
    nameEn: 'Starter',
    price: 9,
    generations: 25,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || null,
  },
  pro: {
    name: 'Pro',
    nameEn: 'Pro',
    price: 29,
    generations: 100,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  business: {
    name: 'Business',
    nameEn: 'Business',
    price: 59,
    generations: 500,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || null,
  },
}
