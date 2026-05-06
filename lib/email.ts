import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'ShopScribe <support@shopscribe-ai.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shopscribe-ai.com'

export async function sendWelcomeEmail(to: string, firstName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Bienvenue sur ShopScribe 🎉',
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">ShopScribe</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Fiches produits propulsées par l'IA</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">Bonjour ${firstName} 👋</p>
              <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                Ton compte ShopScribe est prêt. Tu peux dès maintenant générer tes premières fiches produits optimisées pour le SEO en quelques secondes.
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Tu bénéficies de <strong style="color:#0f172a;">3 générations gratuites</strong> pour tester la plateforme, sans carte bancaire.
              </p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f172a;border-radius:8px;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Accéder au dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Divider -->
              <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0;" />
              <!-- Features -->
              <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ce que tu peux faire avec ShopScribe</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">✦ &nbsp;Générer des fiches produits SEO en moins de 10 secondes</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">✦ &nbsp;Créer 3 variantes A/B d'un même produit</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">✦ &nbsp;Importer jusqu'à 100 produits via CSV en masse</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#475569;font-size:14px;">✦ &nbsp;Adapter le ton et la langue à ta boutique</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Tu reçois cet email car tu viens de créer un compte sur ShopScribe.<br />
                © ${new Date().getFullYear()} ShopScribe. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })
  } catch (err) {
    console.error('[Resend] sendWelcomeEmail error:', err)
  }
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

export async function sendPurchaseConfirmationEmail(
  to: string,
  firstName: string,
  plan: string,
  generationsLimit: number
) {
  const planLabel = PLAN_LABELS[plan] || plan
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Confirmation de ton achat — Plan ${planLabel}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">ShopScribe</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Fiches produits propulsées par l'IA</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">Merci pour ton achat, ${firstName} 🎉</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Ton paiement a bien été reçu. Ton plan <strong style="color:#0f172a;">${planLabel}</strong> est maintenant actif.
              </p>
              <!-- Plan card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#475569;font-size:14px;">Plan activé</td>
                        <td align="right" style="color:#0f172a;font-size:14px;font-weight:600;">${planLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:10px;color:#475569;font-size:14px;">Générations disponibles</td>
                        <td align="right" style="padding-top:10px;color:#0f172a;font-size:14px;font-weight:600;">${generationsLimit} générations</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f172a;border-radius:8px;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Commencer à générer →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Divider -->
              <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0;" />
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Une question ? Réponds directement à cet email, on est là pour t'aider.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} ShopScribe. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    })
  } catch (err) {
    console.error('[Resend] sendPurchaseConfirmationEmail error:', err)
  }
}
