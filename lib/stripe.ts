import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  free: {
    name: 'Gratuit',
    nameEn: 'Free',
    price: 0,
    generations: 10,
    stripePriceId: null,
  },
  pro: {
    name: 'Pro',
    nameEn: 'Pro',
    price: 19,
    generations: 500,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  business: {
    name: 'Business',
    nameEn: 'Business',
    price: 49,
    generations: -1, // illimité
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || null,
  },
}
