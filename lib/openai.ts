import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerateProductSheetParams {
  productName: string
  keywords: string
  category: string
  tone: string
  language: 'fr' | 'en'
}

export async function generateProductSheet(params: GenerateProductSheetParams) {
  const { productName, keywords, category, tone, language } = params

  const systemPrompt = language === 'fr'
    ? `Tu es un expert en copywriting e-commerce. Tu génères des fiches produits optimisées pour le SEO et la conversion. Tes descriptions sont accrocheuses, précises et adaptées au ton demandé.`
    : `You are an e-commerce copywriting expert. You generate SEO-optimized and conversion-focused product sheets. Your descriptions are catchy, precise and adapted to the requested tone.`

  const userPrompt = language === 'fr'
    ? `Génère une fiche produit complète pour :
- Nom du produit : ${productName}
- Mots-clés : ${keywords}
- Catégorie : ${category}
- Ton : ${tone}

Retourne un JSON avec exactement cette structure :
{
  "title": "titre accrocheur optimisé SEO (max 80 caractères)",
  "description": "description longue et persuasive (150-200 mots)",
  "bulletPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "metaDescription": "meta description SEO (max 160 caractères)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
    : `Generate a complete product sheet for:
- Product name: ${productName}
- Keywords: ${keywords}
- Category: ${category}
- Tone: ${tone}

Return a JSON with exactly this structure:
{
  "title": "catchy SEO-optimized title (max 80 characters)",
  "description": "long persuasive description (150-200 words)",
  "bulletPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "metaDescription": "SEO meta description (max 160 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No content returned from OpenAI')

  return JSON.parse(content)
}
