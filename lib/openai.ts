import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface BrandProfile {
  description?: string
  keywords?: string[]
  avoidWords?: string[]
  exampleText?: string
}

export interface GenerateProductSheetParams {
  productName: string
  keywords: string
  category: string
  tone: string
  language: 'fr' | 'en'
  brandProfile?: BrandProfile
  variants?: boolean
}

export interface ProductSheet {
  title: string
  description: string
  bulletPoints: string[]
  metaDescription: string
  tags: string[]
}

const NICHE_PROMPTS_FR: Record<string, string> = {
  'Mode': `Tu es expert en copywriting mode et textile. Mets en valeur les matières, la coupe, le style et les occasions de port. Utilise un vocabulaire fashion et inspirant.`,
  'Bijoux': `Tu es expert en copywriting bijoux et accessoires. Valorise l'artisanat, les matériaux précieux, l'émotion et le symbolisme. Évoque les cadeaux, les occasions spéciales, l'élégance.`,
  'Électronique': `Tu es expert en copywriting high-tech. Mets en avant les specs techniques, la compatibilité, les performances et la fiabilité. Sois précis et informatif.`,
  'Sport': `Tu es expert en copywriting sport et outdoor. Insiste sur la performance, la durabilité, le confort et les conditions d'utilisation. Inspire l'action et le dépassement de soi.`,
  'Maison': `Tu es expert en copywriting maison et décoration. Valorise le design, la fonctionnalité, les matériaux et l'atmosphère créée. Évoque le bien-être et l'esthétique intérieure.`,
  'Beauté': `Tu es expert en copywriting beauté et cosmétiques. Mets en avant les ingrédients, les bienfaits pour la peau, la texture et les résultats visibles. Utilise un vocabulaire sensoriel et scientifique.`,
  'Alimentation': `Tu es expert en copywriting alimentaire. Valorise les saveurs, les origines, les ingrédients naturels, les bienfaits nutritionnels et les moments de dégustation.`,
  'Général': `Tu es un expert en copywriting e-commerce. Tu génères des fiches produits optimisées pour le SEO et la conversion. Tes descriptions sont accrocheuses, précises et adaptées au ton demandé.`,
}

const NICHE_PROMPTS_EN: Record<string, string> = {
  'Mode': `You are a fashion and textile copywriting expert. Highlight materials, cut, style and occasions to wear. Use inspiring fashion vocabulary.`,
  'Bijoux': `You are a jewelry and accessories copywriting expert. Showcase craftsmanship, precious materials, emotion and symbolism. Evoke gifts, special occasions and elegance.`,
  'Électronique': `You are a tech copywriting expert. Highlight technical specs, compatibility, performance and reliability. Be precise and informative.`,
  'Sport': `You are a sports and outdoor copywriting expert. Emphasize performance, durability, comfort and use conditions. Inspire action and self-improvement.`,
  'Maison': `You are a home and decor copywriting expert. Highlight design, functionality, materials and atmosphere created. Evoke well-being and interior aesthetics.`,
  'Beauté': `You are a beauty and cosmetics copywriting expert. Highlight ingredients, skin benefits, texture and visible results. Use sensory and scientific vocabulary.`,
  'Alimentation': `You are a food copywriting expert. Highlight flavors, origins, natural ingredients, nutritional benefits and tasting moments.`,
  'Général': `You are an e-commerce copywriting expert. You generate SEO-optimized and conversion-focused product sheets. Your descriptions are catchy, precise and adapted to the requested tone.`,
}

function buildSystemPrompt(category: string, language: 'fr' | 'en', brandProfile?: BrandProfile): string {
  const nicheMap = language === 'fr' ? NICHE_PROMPTS_FR : NICHE_PROMPTS_EN
  let base = nicheMap[category] || nicheMap['Général']

  if (brandProfile) {
    if (language === 'fr') {
      if (brandProfile.description) base += `\n\nContexte de la marque : ${brandProfile.description}`
      if (brandProfile.keywords?.length) base += `\nMots qui définissent la marque (à utiliser naturellement) : ${brandProfile.keywords.join(', ')}`
      if (brandProfile.avoidWords?.length) base += `\nMots à éviter absolument : ${brandProfile.avoidWords.join(', ')}`
      if (brandProfile.exampleText) base += `\nStyle à reproduire (exemple de texte de la marque) :\n"${brandProfile.exampleText}"`
    } else {
      if (brandProfile.description) base += `\n\nBrand context: ${brandProfile.description}`
      if (brandProfile.keywords?.length) base += `\nBrand-defining words (use naturally): ${brandProfile.keywords.join(', ')}`
      if (brandProfile.avoidWords?.length) base += `\nWords to absolutely avoid: ${brandProfile.avoidWords.join(', ')}`
      if (brandProfile.exampleText) base += `\nStyle to reproduce (brand text example):\n"${brandProfile.exampleText}"`
    }
  }

  return base
}

function buildUserPrompt(params: GenerateProductSheetParams, variantIndex?: number): string {
  const { productName, keywords, category, tone, language, variants } = params
  const variantHint = variantIndex !== undefined
    ? (language === 'fr' ? ` (variante ${variantIndex + 1} sur 3 — approche différente)` : ` (variant ${variantIndex + 1} of 3 — different angle)`)
    : ''

  if (language === 'fr') {
    return `Génère une fiche produit complète${variantHint} pour :
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
  }

  return `Generate a complete product sheet${variantHint} for:
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
}

async function generateSingle(params: GenerateProductSheetParams, variantIndex?: number): Promise<ProductSheet> {
  const systemPrompt = buildSystemPrompt(params.category, params.language, params.brandProfile)
  const userPrompt = buildUserPrompt(params, variantIndex)

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
  return JSON.parse(content) as ProductSheet
}

export async function generateProductSheet(params: GenerateProductSheetParams): Promise<ProductSheet> {
  return generateSingle(params)
}

export async function generateProductSheetVariants(params: GenerateProductSheetParams): Promise<ProductSheet[]> {
  const results = await Promise.all([
    generateSingle(params, 0),
    generateSingle(params, 1),
    generateSingle(params, 2),
  ])
  return results
}
