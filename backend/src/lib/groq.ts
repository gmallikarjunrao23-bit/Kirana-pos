import Groq from 'groq-sdk'

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set in Railway environment variables')
  return new Groq({ apiKey })
}

export interface DetectedProduct {
  name: string
  brand: string
  category: string
  unit: string
  barcode: string
  confidence: number
}

export async function detectProductFromImage(
  imageBase64: string
): Promise<DetectedProduct | null> {
  try {
    const client = getClient()

    const response = await client.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 512,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `You are a product detection AI for an Indian Kirana (grocery) store POS system.

Analyze this product image carefully.

Respond ONLY with a single valid JSON object, no other text:
{
  "name": "exact product name",
  "brand": "brand name or empty string",
  "category": "food|beverage|snacks|personal care|household|dairy|bakery|general",
  "unit": "package size like 500g or 1L or 100ml or 1 pc",
  "barcode": "barcode digits if visible else empty string",
  "confidence": 0.0
}

Rules:
- name: specific (Maggi 2-Minute Noodles not just noodles)
- category: exactly one of the listed values
- confidence: 0.8+ very sure, 0.5-0.8 fairly sure, below 0.5 unsure
- If no product detected: set name to empty string and confidence to 0
- No markdown, no explanation, ONLY the JSON object`,
            },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as DetectedProduct
    if (!parsed.name || parsed.confidence < 0.3) return null

    return {
      name: parsed.name.trim(),
      brand: parsed.brand?.trim() || '',
      category: parsed.category || 'general',
      unit: parsed.unit?.trim() || '1 pc',
      barcode: parsed.barcode?.trim() || '',
      confidence: parsed.confidence,
    }
  } catch (err) {
    console.error('Groq vision detect error:', err)
    return null
  }
}

export async function detectBarcodeFromImage(
  imageBase64: string
): Promise<string | null> {
  try {
    const client = getClient()

    const response = await client.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 64,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `Look at this image. Find any barcode or QR code.
If you see a barcode number, respond with ONLY those digits, nothing else.
If no barcode is visible, respond with exactly: NONE`,
            },
          ],
        },
      ],
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    if (!text || text === 'NONE') return null

    const digits = text.replace(/[^0-9]/g, '')
    return digits.length >= 6 ? digits : null
  } catch {
    return null
  }
}

export async function searchProductByName(
  query: string
): Promise<{ name: string; brand: string; category: string; unit: string } | null> {
  try {
    const client = getClient()

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `You are a product database for Indian Kirana stores.

Product query: "${query}"

If this matches a known Indian grocery/FMCG product, respond with ONLY this JSON:
{
  "name": "full product name",
  "brand": "brand name",
  "category": "food|beverage|snacks|personal care|household|dairy|bakery|general",
  "unit": "standard package size"
}

If unknown, respond with: NONE`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content?.trim() || ''
    if (!text || text === 'NONE') return null

    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}
