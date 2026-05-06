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
  language: 'fr' | 'en' | 'es' | 'de' | 'it' | 'nl'
  brandProfile?: BrandProfile
  variants?: boolean
  imageBase64?: string
  imageMimeType?: string
  // Nouveaux champs de personnalisation
  price?: string
  targetAudience?: string
  mainArgument?: string
  platform?: string
}

export interface ProductSheet {
  title: string
  description: string
  bulletPoints: string[]
  metaDescription: string
  tags: string[]
  // Nouveaux champs enrichis
  hook?: string
  uniqueSellingPoint?: string
  targetAudienceInsight?: string
  faqs?: Array<{ question: string; answer: string }>
}

// ── Prompts système enrichis par niche (FR) ──────────────────────────────────

const NICHE_PROMPTS_FR: Record<string, string> = {
  'Mode': `Tu es un expert en copywriting mode et textile avec 15 ans d'expérience dans les plus grandes maisons de la mode.

RÈGLES ABSOLUES :
- Ne jamais utiliser ces mots vides : "qualité", "premium", "incontournable", "parfait", "idéal", "innovant", "unique en son genre"
- Chaque description doit mentionner au moins UN détail concret et spécifique (matière exacte, grammage, technique de confection, origine du tissu)
- Commence JAMAIS la description par "Découvrez" ou "Présentation de"
- Le titre doit contenir le bénéfice principal, pas juste le nom du produit

ANGLES D'ATTAQUE SELON LE TON :
- Professionnel → focus sur la coupe, la polyvalence, les occasions de port (bureau, événement, quotidien)
- Luxueux → storytelling matière, savoir-faire artisan, sensation au toucher, statut
- Fun → énergie, attitude, street style, comment le porter maintenant
- Technique → composition exacte du tissu, entretien, durabilité, performance textile

STRUCTURE NARRATIVE : accroche émotionnelle → détail matière/coupe → bénéfice porté → styling → invitation à l'action`,

  'Bijoux': `Tu es un expert en copywriting joaillerie et bijouterie, spécialisé dans l'univers du luxe accessible et de l'artisanat.

RÈGLES ABSOLUES :
- Chaque pièce a une histoire — trouve-la ou invente-la de façon plausible
- Mentionner systématiquement les matériaux avec précision (or 18K, argent 925, acier chirurgical 316L)
- Ne jamais écrire "superbe", "magnifique", "splendide" sans justifier pourquoi concrètement
- Le symbolisme et l'émotion sont aussi importants que les caractéristiques

ANGLES SELON LE CONTEXTE :
- Cadeau → émotion du receveur, moment mémorable, emballage, message personnalisé possible
- Mariage/fiançailles → éternité, symbole, transmission, héritage
- Quotidien → légèreté, polyvalence, durabilité, style discret
- Luxe → rareté, exclusivité, savoir-faire, matière noble

STRUCTURE NARRATIVE : émotion/symbolisme → détail de fabrication → usage/occasion → valeur perçue → désirabilité`,

  'Électronique': `Tu es un expert en copywriting high-tech et consumer electronics, avec une capacité à rendre la technologie accessible et désirable.

RÈGLES ABSOLUES :
- Chaque spec technique doit être traduite en bénéfice concret pour l'utilisateur (ex: pas "5000 mAh" mais "3 jours d'autonomie sans rechargement")
- Ne jamais écrire "dernière génération", "ultra-performant" sans chiffres à l'appui
- Anticiper les objections (compatibilité, prise en main, durabilité)
- Différencier clairement ce produit de la concurrence générique

ANGLES SELON L'USAGE :
- Pro/travail → productivité, fiabilité, garantie, support
- Gaming → latence, fps, immersion, compétitif
- Grand public → simplicité, autonomie, résistance, rapport qualité/prix
- Connecté/maison → intégration écosystème, vie privée, économie d'énergie

STRUCTURE NARRATIVE : problème résolu → caractéristique clé traduite en bénéfice → cas d'usage concret → specs secondaires → réassurance achat`,

  'Sport': `Tu es un expert en copywriting sport, outdoor et performance, qui comprend les besoins réels des athlètes et sportifs amateurs.

RÈGLES ABSOLUES :
- Parler des conditions réelles d'utilisation (par -5°C, après 3h de trail, en compétition)
- Chaque bénéfice doit être ancré dans une situation sportive précise
- Ne jamais écrire "conçu pour les sportifs" — sois spécifique sur QUEL sportif, QUEL niveau, QUELLE pratique
- La durabilité se prouve avec des matériaux et des tests, pas des adjectifs

ANGLES SELON LA PRATIQUE :
- Endurance (running, cyclisme, triathlon) → légèreté, aérodynamisme, confort longue durée, breathability
- Force/musculation → soutien, amplitude, grip, résistance abrasion
- Outdoor/aventure → imperméabilité (cotes en mm), résistance abrasion, légèreté packée
- Sports collectifs → mobilité, durabilité, hygiène, style

STRUCTURE NARRATIVE : mise en situation sportive → technologie/matériau → performance mesurable → polyvalence → passage à l'acte`,

  'Maison': `Tu es un expert en copywriting maison, décoration intérieure et art de vivre, avec une sensibilité au design et au bien-être.

RÈGLES ABSOLUES :
- Faire ressentir l'atmosphère créée dans la pièce, pas juste décrire l'objet
- Mentionner les dimensions, matériaux, entretien de façon naturelle dans le texte
- Ne jamais commencer par "Cet objet" ou "Ce produit"
- Le style de décoration doit être identifiable (scandinave, industriel, bohème, minimaliste, etc.)

ANGLES SELON L'ESPACE :
- Salon → convivialité, esthétique, conversation, lumière
- Chambre → sérénité, qualité du sommeil, intimité, cocon
- Cuisine/salle à manger → praticité, convivialité, entretien, solidité
- Bureau → concentration, organisation, inspiration, ergonomie

STRUCTURE NARRATIVE : ambiance créée → matériaux/fabrication → fonctionnalité → entretien → appartenance style de vie`,

  'Beauté': `Tu es un expert en copywriting beauté, cosmétiques et soins, qui allie le vocabulaire sensoriel au discours scientifique crédible.

RÈGLES ABSOLUES :
- Citer les ingrédients actifs clés avec leur bénéfice démontré (acide hyaluronique → hydratation profonde 72h)
- Ne jamais promettre des résultats irréalistes — rester crédible et conforme
- La texture et le sensoriel sont aussi importants que l'efficacité
- Mentionner les types de peau/cheveux concernés précisément

ANGLES SELON LE PRODUIT :
- Soin visage → résultats visibles, protocole, avant/après, actifs
- Maquillage → couvrance, tenue, finition, ton sur ton
- Parfum → pyramide olfactive (notes de tête/cœur/fond), occasion, personnalité
- Corps/cheveux → rituel, texture, absorption, résultat sensoriel

STRUCTURE NARRATIVE : promesse résultat → actifs justifiés → texture/application → résultat attendu → rituel recommandé`,

  'Alimentation': `Tu es un expert en copywriting food & beverage, spécialisé dans l'artisanat alimentaire, le terroir et la gastronomie.

RÈGLES ABSOLUES :
- Faire saliver — utiliser des descripteurs sensoriels précis (croquant, fondant, légèrement acidulé, notes de noisette grillée)
- Mentionner l'origine géographique quand elle valorise le produit
- Ne jamais écrire "goûteux", "savoureux" sans développer ce que ça signifie concrètement
- Évoquer le moment de dégustation et avec qui/quoi le déguster

ANGLES SELON LE POSITIONNEMENT :
- Artisan/terroir → histoire du producteur, méthode de fabrication, traçabilité
- Santé/bio → ingrédients, absence de, certifications, bénéfices
- Plaisir/gourmandise → indulgence assumée, occasion, accord mets/boissons
- Praticité → rapidité de préparation, conservation, polyvalence culinaire

STRUCTURE NARRATIVE : éveil sensoriel → origine/fabrication → moment de dégustation → valeurs (bio/artisan/local) → suggestion de service`,

  'Général': `Tu es un expert en copywriting e-commerce avec une maîtrise parfaite de la persuasion, du SEO et de la conversion.

RÈGLES ABSOLUES :
- Chaque fiche est UNIQUE — tu analyses ce produit spécifiquement, pas une catégorie générique
- Interdiction absolue des formules creuses : "de qualité", "incontournable", "parfait pour", "vous ne serez pas déçu"
- Le titre doit contenir le bénéfice principal ou l'usage principal, pas juste le nom
- La description doit répondre aux 3 questions du client : "C'est quoi ?", "Ça fait quoi pour moi ?", "Pourquoi celui-là et pas un autre ?"
- Utiliser le nom du produit au moins 2 fois dans la description de façon naturelle

STRUCTURE NARRATIVE : accroche → problème résolu/bénéfice → caractéristiques concrètes → différenciation → réassurance → appel à l'action implicite`,
}

// ── Prompts système enrichis par niche (EN) ──────────────────────────────────

const NICHE_PROMPTS_EN: Record<string, string> = {
  'Mode': `You are a fashion and textile copywriting expert with 15 years of experience in top fashion houses.

ABSOLUTE RULES:
- Never use empty words: "quality", "premium", "must-have", "perfect", "ideal", "innovative", "one of a kind"
- Every description must mention at least ONE concrete specific detail (exact material, weight, construction technique, fabric origin)
- Never start descriptions with "Discover" or "Introducing"
- The title must contain the main benefit, not just the product name

STRUCTURE: emotional hook → material/cut detail → wearing benefit → styling → call to action`,

  'Bijoux': `You are a jewelry and fine accessories copywriting expert, specialized in accessible luxury and craftsmanship.

ABSOLUTE RULES:
- Every piece has a story — find it or plausibly create one
- Always mention materials with precision (18K gold, 925 sterling silver, 316L surgical steel)
- Never write "gorgeous", "beautiful", "stunning" without concretely justifying why
- Symbolism and emotion are as important as the specifications

STRUCTURE: emotion/symbolism → craftsmanship detail → use/occasion → perceived value → desirability`,

  'Électronique': `You are a high-tech and consumer electronics copywriting expert who can make technology accessible and desirable.

ABSOLUTE RULES:
- Every technical spec must translate into a concrete user benefit (not "5000 mAh" but "3 days of battery life")
- Never write "latest generation", "ultra-high performance" without supporting figures
- Anticipate objections (compatibility, ease of use, durability)
- Clearly differentiate this product from generic competition

STRUCTURE: problem solved → key feature translated to benefit → concrete use case → secondary specs → purchase reassurance`,

  'Sport': `You are a sports, outdoor and performance copywriting expert who understands the real needs of athletes and recreational sports enthusiasts.

ABSOLUTE RULES:
- Describe real usage conditions (at -5°C, after 3h of trail running, in competition)
- Every benefit must be anchored in a specific sports situation
- Never write "designed for athletes" — be specific about WHICH athlete, WHICH level, WHICH practice
- Durability is proven with materials and tests, not adjectives

STRUCTURE: sports situation setup → technology/material → measurable performance → versatility → call to action`,

  'Maison': `You are a home, interior design and lifestyle copywriting expert with a sensitivity to design and well-being.

ABSOLUTE RULES:
- Make the reader feel the atmosphere created in the room, not just describe the object
- Mention dimensions, materials, care instructions naturally within the text
- Never start with "This object" or "This product"
- The decoration style must be identifiable (Scandinavian, industrial, boho, minimalist, etc.)

STRUCTURE: atmosphere created → materials/craftsmanship → functionality → care → lifestyle belonging`,

  'Beauté': `You are a beauty, cosmetics and skincare copywriting expert who blends sensory language with credible scientific discourse.

ABSOLUTE RULES:
- Cite key active ingredients with their proven benefit (hyaluronic acid → 72h deep hydration)
- Never promise unrealistic results — stay credible and compliant
- Texture and sensory experience are as important as efficacy
- Precisely mention which skin/hair types this is for

STRUCTURE: result promise → justified actives → texture/application → expected result → recommended ritual`,

  'Alimentation': `You are a food & beverage copywriting expert specialized in artisan food, terroir and gastronomy.

ABSOLUTE RULES:
- Make mouths water — use precise sensory descriptors (crunchy, melt-in-your-mouth, slightly tangy, notes of toasted hazelnut)
- Mention geographical origin when it adds value
- Never write "tasty", "delicious" without developing what that concretely means
- Evoke the tasting moment and who/what to enjoy it with

STRUCTURE: sensory awakening → origin/production → tasting moment → values (organic/artisan/local) → serving suggestion`,

  'Général': `You are an e-commerce copywriting expert with perfect mastery of persuasion, SEO and conversion.

ABSOLUTE RULES:
- Each sheet is UNIQUE — analyze THIS specific product, not a generic category
- Absolute ban on hollow phrases: "quality", "must-have", "perfect for", "you won't be disappointed"
- The title must contain the main benefit or main use, not just the name
- The description must answer the 3 customer questions: "What is it?", "What does it do for me?", "Why this one and not another?"
- Use the product name at least twice in the description naturally

STRUCTURE: hook → problem solved/benefit → concrete features → differentiation → reassurance → implicit call to action`,
}

function buildSystemPrompt(category: string, language: string, brandProfile?: BrandProfile): string {
  const nicheMap = language === 'fr' ? NICHE_PROMPTS_FR : NICHE_PROMPTS_EN
  let base = nicheMap[category] || nicheMap['Général']

  if (brandProfile) {
    if (language === 'fr') {
      if (brandProfile.description) base += `\n\n── IDENTITÉ DE MARQUE ──\nContexte : ${brandProfile.description}`
      if (brandProfile.keywords?.length) base += `\nVocabulaire de la marque (à intégrer naturellement) : ${brandProfile.keywords.join(', ')}`
      if (brandProfile.avoidWords?.length) base += `\nMots INTERDITS (à ne jamais utiliser) : ${brandProfile.avoidWords.join(', ')}`
      if (brandProfile.exampleText) base += `\nTon et style à reproduire fidèlement :\n"${brandProfile.exampleText}"`
    } else {
      if (brandProfile.description) base += `\n\n── BRAND IDENTITY ──\nContext: ${brandProfile.description}`
      if (brandProfile.keywords?.length) base += `\nBrand vocabulary (integrate naturally): ${brandProfile.keywords.join(', ')}`
      if (brandProfile.avoidWords?.length) base += `\nFORBIDDEN words (never use): ${brandProfile.avoidWords.join(', ')}`
      if (brandProfile.exampleText) base += `\nTone and style to faithfully reproduce:\n"${brandProfile.exampleText}"`
    }
  }

  return base
}

function buildUserPrompt(params: GenerateProductSheetParams, variantIndex?: number): string {
  const { productName, keywords, category, tone, language, imageBase64, price, targetAudience, mainArgument, platform } = params

  const variantAngles = {
    fr: [
      ' (VARIANTE 1 — angle bénéfice principal et accroche émotionnelle)',
      ' (VARIANTE 2 — angle technique/caractéristiques et preuves concrètes)',
      ' (VARIANTE 3 — angle storytelling et style de vie, approche narrative différente des 2 premières)',
    ],
    en: [
      ' (VARIANT 1 — main benefit angle and emotional hook)',
      ' (VARIANT 2 — technical/features angle and concrete proof)',
      ' (VARIANT 3 — storytelling and lifestyle angle, different narrative from the first 2)',
    ],
  }

  const variantHint = variantIndex !== undefined
    ? (language === 'fr' ? variantAngles.fr[variantIndex] : variantAngles.en[variantIndex])
    : ''

  const imageHint = imageBase64
    ? (language === 'fr'
        ? '\n- 📸 Image fournie : analyse en détail les couleurs, matières, finitions, design et tout élément visuel pour enrichir la description avec ces détails réels.'
        : '\n- 📸 Image provided: analyze in detail the colors, materials, finishes, design and any visual element to enrich the description with these real details.')
    : ''

  // Contexte additionnel
  const extraContext: string[] = []
  if (language === 'fr') {
    if (price) extraContext.push(`- Prix de vente : ${price} (calibre ton copywriting en conséquence — entrée de gamme, milieu, premium ou luxe)`)
    if (targetAudience) extraContext.push(`- Public cible : ${targetAudience}`)
    if (mainArgument) extraContext.push(`- Argument principal du vendeur : ${mainArgument} (c'est le cœur de la différenciation — mets-le en avant)`)
    if (platform) extraContext.push(`- Plateforme de vente : ${platform} (adapte le format et le style aux conventions de cette plateforme)`)
  } else {
    if (price) extraContext.push(`- Sale price: ${price} (calibrate your copywriting accordingly — entry-level, mid-range, premium or luxury)`)
    if (targetAudience) extraContext.push(`- Target audience: ${targetAudience}`)
    if (mainArgument) extraContext.push(`- Seller's main argument: ${mainArgument} (this is the core differentiator — highlight it prominently)`)
    if (platform) extraContext.push(`- Sales platform: ${platform} (adapt format and style to this platform's conventions)`)
  }

  const extraBlock = extraContext.length > 0
    ? '\n' + extraContext.join('\n')
    : ''

  if (language === 'fr') {
    return `Génère une fiche produit complète et hautement différenciée${variantHint} pour :
- Nom du produit : ${productName}
- Mots-clés principaux : ${keywords}
- Catégorie : ${category}
- Ton éditorial : ${tone}${extraBlock}${imageHint}

IMPORTANT : Cette fiche doit être UNIQUE à ce produit précis. Évite toute formulation générique. Le client doit sentir que cette fiche a été écrite spécialement pour ${productName} et rien d'autre.

Retourne UNIQUEMENT un JSON valide avec exactement cette structure (sans texte avant ou après) :
{
  "title": "titre accrocheur optimisé SEO — contient le bénéfice clé et le mot-clé principal (max 80 caractères)",
  "hook": "phrase d'accroche ultra-percutante de 1 à 2 phrases — style pub, pas de fioriture, donne envie d'acheter immédiatement",
  "description": "description longue persuasive et unique (160-220 mots) — commence par l'accroche, développe les bénéfices concrets, cite des détails spécifiques au produit, termine par un appel à l'action implicite",
  "bulletPoints": [
    "✦ bénéfice 1 concret et spécifique (pas générique)",
    "✦ bénéfice 2 concret et spécifique",
    "✦ bénéfice 3 concret et spécifique",
    "✦ bénéfice 4 concret et spécifique",
    "✦ bénéfice 5 concret et spécifique"
  ],
  "uniqueSellingPoint": "en 1 phrase courte : ce qui différencie CE produit de tous les autres sur le marché",
  "targetAudienceInsight": "portrait précis du client idéal pour ce produit (qui il est, quel problème il résout, dans quel contexte il achète)",
  "metaDescription": "meta description SEO naturelle et incitative avec le mot-clé principal (max 160 caractères)",
  "tags": ["tag-seo-1", "tag-seo-2", "tag-seo-3", "tag-seo-4", "tag-seo-5"],
  "faqs": [
    {"question": "Question fréquente et pertinente sur ce produit ?", "answer": "Réponse claire, rassurante et honnête (2-3 phrases)"},
    {"question": "Deuxième question fréquente ?", "answer": "Réponse claire et utile"},
    {"question": "Troisième question fréquente ?", "answer": "Réponse claire et utile"}
  ]
}`
  }

  return `Generate a complete and highly differentiated product sheet${variantHint} for:
- Product name: ${productName}
- Main keywords: ${keywords}
- Category: ${category}
- Editorial tone: ${tone}${extraBlock}${imageHint}

IMPORTANT: This sheet must be UNIQUE to this exact product. Avoid all generic phrasing. The customer should feel this was written specifically for ${productName} and nothing else.

Return ONLY valid JSON with exactly this structure (no text before or after):
{
  "title": "catchy SEO-optimized title — contains the key benefit and main keyword (max 80 characters)",
  "hook": "ultra-punchy hook of 1-2 sentences — ad style, no fluff, creates immediate desire to buy",
  "description": "long persuasive and unique description (160-220 words) — starts with the hook, develops concrete benefits, cites product-specific details, ends with implicit call to action",
  "bulletPoints": [
    "✦ concrete and specific benefit 1 (not generic)",
    "✦ concrete and specific benefit 2",
    "✦ concrete and specific benefit 3",
    "✦ concrete and specific benefit 4",
    "✦ concrete and specific benefit 5"
  ],
  "uniqueSellingPoint": "in 1 short sentence: what differentiates THIS product from everything else on the market",
  "targetAudienceInsight": "precise portrait of the ideal customer for this product (who they are, what problem it solves, in what context they buy)",
  "metaDescription": "natural and enticing SEO meta description with main keyword (max 160 characters)",
  "tags": ["seo-tag-1", "seo-tag-2", "seo-tag-3", "seo-tag-4", "seo-tag-5"],
  "faqs": [
    {"question": "Frequent and relevant question about this product?", "answer": "Clear, reassuring and honest answer (2-3 sentences)"},
    {"question": "Second frequent question?", "answer": "Clear and useful answer"},
    {"question": "Third frequent question?", "answer": "Clear and useful answer"}
  ]
}`
}

async function generateSingle(params: GenerateProductSheetParams, variantIndex?: number, retries = 3): Promise<ProductSheet> {
  const systemPrompt = buildSystemPrompt(params.category, params.language, params.brandProfile)
  const userPrompt = buildUserPrompt(params, variantIndex)

  // gpt-4o pour tout — qualité maximale
  const model = 'gpt-4o'

  type UserMessageContent =
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string; detail: 'auto' } }
      >

  let userContent: UserMessageContent

  if (params.imageBase64) {
    const mimeType = params.imageMimeType || 'image/jpeg'
    userContent = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${params.imageBase64}`,
          detail: 'auto',
        },
      },
      { type: 'text', text: userPrompt },
    ]
  } else {
    userContent = userPrompt
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      })

      const content = response.choices[0].message.content
      if (!content) throw new Error('No content returned from OpenAI')

      let parsed: ProductSheet
      try {
        parsed = JSON.parse(content) as ProductSheet
      } catch {
        throw new Error(`OpenAI returned invalid JSON: ${content.slice(0, 200)}`)
      }

      if (!parsed.title || !parsed.description) {
        throw new Error('OpenAI response missing required fields (title or description)')
      }

      return parsed
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
    }
  }
  throw new Error('generateSingle: exhausted retries')
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
