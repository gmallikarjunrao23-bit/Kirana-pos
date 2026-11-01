import axios from 'axios'

export interface OpenFoodProduct {
  name: string
  brand: string
  category: string
  imageUrl: string
  unit: string
}

export async function fetchFromOpenFoodFacts(
  barcode: string
): Promise<OpenFoodProduct | null> {
  try {
    const res = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        timeout: 7000,
        headers: { 'User-Agent': 'KiranaPOS/2.0 (kirana@pos.app)' },
      }
    )

    if (res.data.status !== 1 || !res.data.product) return null

    const p = res.data.product
    const name =
      p.product_name_en ||
      p.product_name ||
      p.abbreviated_product_name ||
      ''

    if (!name.trim()) return null

    return {
      name: name.trim(),
      brand: p.brands?.split(',')[0]?.trim() || '',
      category: mapCategory(
        p.categories_tags?.[0]?.replace('en:', '') ||
        p.main_category_en || ''
      ),
      imageUrl:
        p.image_front_small_url ||
        p.image_front_url ||
        p.image_url ||
        '',
      unit: p.quantity || p.net_weight || '1 pc',
    }
  } catch (err) {
    if (axios.isAxiosError(err) && err.code !== 'ECONNABORTED') {
      console.error('OpenFoodFacts error:', err.message)
    }
    return null
  }
}

function mapCategory(raw: string): string {
  const l = raw.toLowerCase()
  if (l.includes('beverage') || l.includes('drink') || l.includes('juice') || l.includes('water')) return 'beverage'
  if (l.includes('snack') || l.includes('chip') || l.includes('biscuit') || l.includes('cookie')) return 'snacks'
  if (l.includes('dairy') || l.includes('milk') || l.includes('cheese') || l.includes('yogurt')) return 'dairy'
  if (l.includes('bread') || l.includes('bakery') || l.includes('cake') || l.includes('rusk')) return 'bakery'
  if (l.includes('personal') || l.includes('soap') || l.includes('shampoo') || l.includes('toothpaste')) return 'personal care'
  if (l.includes('household') || l.includes('clean') || l.includes('detergent') || l.includes('wash')) return 'household'
  if (l.includes('food') || l.includes('noodle') || l.includes('rice') || l.includes('flour') || l.includes('oil')) return 'food'
  return 'general'
}
