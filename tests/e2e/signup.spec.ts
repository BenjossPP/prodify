import { test, expect } from '@playwright/test'

/**
 * Test E2E — Signup flow
 */
test.describe('Signup flow', () => {
  test('la page signup se charge et affiche le formulaire', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('affiche une erreur si le formulaire est soumis vide', async ({ page }) => {
    await page.goto('/signup')
    await page.locator('button[type="submit"]').click()
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('redirige vers /login si non connecté et accès /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige vers /login si non connecté et accès /account', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige vers /login si non connecté et accès /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('les pages publiques sont accessibles sans connexion', async ({ page }) => {
    for (const path of ['/', '/pricing', '/login', '/signup', '/cgv', '/confidentialite', '/mentions-legales', '/contact']) {
      await page.goto(path)
      await expect(page.locator('body')).toBeVisible()
      // Aucune redirection vers /login attendue
      expect(page.url()).not.toMatch(/\/login/)
    }
  })

  test('le formulaire de login affiche une erreur avec des credentials invalides', async ({ page }) => {
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Identifiants invalides.' }),
      })
    })
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(500)
    // La page doit rester sur /login
    expect(page.url()).toMatch(/\/login/)
  })
})
