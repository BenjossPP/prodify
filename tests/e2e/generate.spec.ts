import { test, expect } from '@playwright/test'

/**
 * Test E2E — Génération de fiche produit
 */
test.describe('Generate flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            title: 'Sac à dos imperméable 30L — Randonnée & Voyage',
            hook: 'Le compagnon idéal pour vos aventures.',
            description: 'Un sac à dos conçu pour les aventuriers exigeants. Tissu renforcé, bretelles ergonomiques et multiples compartiments pour une organisation optimale.',
            bulletPoints: [
              'Imperméable grâce au tissu renforcé',
              'Capacité 30L idéale pour un week-end',
              'Bretelles ergonomiques rembourrées',
              'Compartiments multiples organisés',
              'Design compact et léger 800g',
            ],
            metaDescription: 'Sac à dos imperméable 30L pour randonnée et voyage. Léger, ergonomique, résistant.',
            tags: ['randonnée', 'sac à dos', 'imperméable', 'voyage', 'outdoor'],
            uniqueSellingPoint: 'Le seul sac conçu pour durer 10 ans.',
            targetAudienceInsight: 'Randonneurs 25-45 ans cherchant fiabilité.',
            faqs: [
              { question: 'Est-il vraiment imperméable ?', answer: 'Oui, certifié IPX4.' },
            ],
          },
        }),
      })
    })
    await page.route('/api/brand-profile', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: null }) })
    })
  })

  test('redirige /dashboard vers /login sans session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('la page de login affiche bien les deux champs requis', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('la page pricing affiche les 3 plans payants', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('text=Starter').first()).toBeVisible()
    await expect(page.locator('text=Pro').first()).toBeVisible()
    await expect(page.locator('text=Business').first()).toBeVisible()
  })

  test("l'API /api/generate retourne une fiche valide (mock)", async ({ page }) => {
    const response = await page.request.post('/api/generate', {
      data: {
        productName: 'Sac à dos',
        keywords: 'imperméable, randonnée',
        category: 'Sport',
        tone: 'professionnel',
        language: 'fr',
      },
    })
    // Mock configuré — doit retourner 200
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(body.data.title).toBeTruthy()
    expect(Array.isArray(body.data.bulletPoints)).toBe(true)
    expect(body.data.bulletPoints.length).toBeGreaterThan(0)
    expect(body.data.tags.length).toBeGreaterThan(0)
  })

  test("l'API /api/generate rejette une requête sans productName", async ({ page }) => {
    // Retire le mock pour ce test spécifique afin de tester la vraie validation
    await page.unrouteAll()
    const response = await page.request.post('/api/generate', {
      data: { keywords: 'test', category: 'Général', tone: 'professionnel', language: 'fr' },
    })
    // Doit retourner 400 ou 401 (pas de session)
    expect([400, 401]).toContain(response.status())
  })
})
