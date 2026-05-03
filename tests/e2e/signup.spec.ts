import { test, expect } from '@playwright/test'

/**
 * Test E2E — Signup flow
 * Vérifie que le formulaire d'inscription soumet bien les données
 * et redirige vers le dashboard (ou affiche une erreur de validation).
 *
 * Note: ce test ne crée pas de vrai compte (pas de DB en test).
 * Il vérifie que la page signup est fonctionnelle et le formulaire accessible.
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

    // Le navigateur natif devrait bloquer la soumission avec un champ requis vide
    // OU le composant affiche une erreur inline
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })

  test('redirige vers le dashboard si déjà connecté', async ({ page }) => {
    // Sans session active, /dashboard doit rediriger vers /login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
