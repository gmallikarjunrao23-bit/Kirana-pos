import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { fetchFromOpenFoodFacts } from '../lib/openFoodFacts'
import { searchProductByName } from '../lib/groq'

export async function lookupBarcode(req: Request, res: Response): Promise<void> {
  const { barcode } = req.params

  if (!barcode || barcode.length < 3) {
    res.status(400).json({ message: 'Invalid barcode' })
    return
  }

  try {
    // 1. Local DB — fastest
    const local = await prisma.product.findUnique({ where: { barcode } })
    if (local) {
      res.status(200).json({ product: local, source: 'local' })
      return
    }

    // 2. Open Food Facts
    const off = await fetchFromOpenFoodFacts(barcode)
    if (off) {
      const saved = await prisma.product.upsert({
        where: { barcode },
        update: { name: off.name, brand: off.brand, imageUrl: off.imageUrl, unit: off.unit, category: off.category },
        create: {
          barcode,
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
      res.status(200).json({ product: saved, needsPrice: true, source: 'openfoodfacts' })
      return
    }

    // 3. Not found
    res.status(404).json({ message: 'Product not found', barcode })
  } catch (err) {
    console.error('Barcode lookup error:', err)
    res.status(500).json({ message: 'Lookup failed' })
  }
}

const saveProductSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1, 'Name required').max(200),
  brand: z.string().max(100).default(''),
  price: z.number().min(0),
  unit: z.string().max(50).default('1 pc'),
  category: z.string().max(50).default('general'),
  imageUrl: z.string().max(500).default(''),
  stock: z.number().int().min(0).default(100),
  source: z.enum(['local', 'openfoodfacts', 'ai']).default('local'),
})

export async function createProduct(req: Request, res: Response): Promise<void> {
  const parsed = saveProductSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const product = await prisma.product.upsert({
      where: { barcode: parsed.data.barcode },
      update: {
        name: parsed.data.name,
        brand: parsed.data.brand,
        price: parsed.data.price,
        unit: parsed.data.unit,
        category: parsed.data.category,
        imageUrl: parsed.data.imageUrl,
        stock: parsed.data.stock,
        source: parsed.data.source,
      },
      create: parsed.data,
    })
    res.status(201).json({ product })
  } catch (err) {
    console.error('Create product error:', err)
    res.status(500).json({ message: 'Failed to save product' })
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const updateSchema = z.object({
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    name: z.string().min(1).optional(),
    brand: z.string().optional(),
    unit: z.string().optional(),
    category: z.string().optional(),
  })

  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed' })
    return
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    })
    res.status(200).json({ product })
  } catch (err) {
    console.error('Update product error:', err)
    res.status(500).json({ message: 'Failed to update product' })
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  try {
    await prisma.product.delete({ where: { id } })
    res.status(200).json({ message: 'Deleted' })
  } catch (err) {
    console.error('Delete product error:', err)
    res.status(500).json({ message: 'Failed to delete' })
  }
}

export async function searchProducts(req: Request, res: Response): Promise<void> {
  const query = String(req.query.q || '').trim()
  if (!query || query.length < 2) {
    res.status(400).json({ message: 'Query too short' })
    return
  }

  try {
    // DB search first
    const dbResults = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    })

    if (dbResults.length > 0) {
      res.status(200).json({ products: dbResults })
      return
    }

    // Groq AI fallback for unknown products
    const aiResult = await searchProductByName(query)
    if (aiResult) {
      res.status(200).json({
        products: [],
        aiSuggestion: aiResult,
      })
      return
    }

    res.status(200).json({ products: [] })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ message: 'Search failed' })
  }
}

export async function getAllProducts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1')))
  const limit = 50
  const skip = (page - 1) * limit

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip, take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count(),
    ])
    res.status(200).json({ products, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('Get all products error:', err)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}
