import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { detectProductFromImage, detectBarcodeFromImage } from '../lib/groq'
import { fetchFromOpenFoodFacts } from '../lib/openFoodFacts'

const detectSchema = z.object({
  image: z.string().min(50, 'Invalid image data'),
})

export async function detectProduct(req: Request, res: Response): Promise<void> {
  const parsed = detectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid image data' })
    return
  }

  const { image } = parsed.data

  try {
    // Step 1: Try to read barcode from image
    const barcodeFromImage = await detectBarcodeFromImage(image)

    if (barcodeFromImage) {
      // Check local DB
      const local = await prisma.product.findUnique({ where: { barcode: barcodeFromImage } })
      if (local) {
        res.status(200).json({ product: local, method: 'barcode_local' })
        return
      }

      // Try Open Food Facts
      const off = await fetchFromOpenFoodFacts(barcodeFromImage)
      if (off) {
        const saved = await prisma.product.upsert({
          where: { barcode: barcodeFromImage },
          update: {},
          create: {
            barcode: barcodeFromImage,
            name: off.name,
            brand: off.brand,
            price: 0,
            unit: off.unit,
            category: off.category,
            imageUrl: off.imageUrl,
            stock: 100,
            source: 'openfoodfacts',
          },
        })
        res.status(200).json({ product: saved, method: 'barcode_off', needsPrice: true })
        return
      }
    }

    // Step 2: Visual AI detection
    const aiProduct = await detectProductFromImage(image)
    if (!aiProduct || aiProduct.confidence < 0.3) {
      res.status(404).json({ message: 'Could not detect product from image' })
      return
    }

    // Check if similar product exists
    const existing = await prisma.product.findFirst({
      where: {
        AND: [
          { name: { contains: aiProduct.name.split(' ')[0], mode: 'insensitive' } },
          aiProduct.brand ? { brand: { contains: aiProduct.brand, mode: 'insensitive' } } : {},
        ],
      },
    })

    if (existing) {
      res.status(200).json({ product: existing, method: 'ai_matched', confidence: aiProduct.confidence })
      return
    }

    // Return unsaved AI product — frontend saves after price confirm
    const tempBarcode = aiProduct.barcode || `AI-${Date.now()}`
    res.status(200).json({
      product: {
        id: '',
        barcode: tempBarcode,
        name: aiProduct.name,
        brand: aiProduct.brand,
        price: 0,
        unit: aiProduct.unit,
        category: aiProduct.category,
        imageUrl: '',
        stock: 100,
        source: 'ai',
      },
      method: 'ai_visual',
      confidence: aiProduct.confidence,
      needsPrice: true,
    })
  } catch (err) {
    console.error('AI detect error:', err)
    res.status(500).json({ message: 'AI detection failed' })
  }
}
