/**
 * Source unique de vérité pour les quotas et labels des plans.
 * Importé partout : dashboard, success, webhook, checkout.
 */

export const PLAN_GENERATIONS: Record<string, number> = {
  free: 3,
  starter: 25,
  pro: 100,
  business: 500,
}

export const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

export const VALID_PLANS = ['free', 'starter', 'pro', 'business'] as const
export type PlanKey = typeof VALID_PLANS[number]
