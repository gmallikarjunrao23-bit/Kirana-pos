import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const billItemSchema = z.object({
  product: z.object({
    id: z.string(),
    barcode: z.string(),
    name: z.string(),
    price: z.number(),
  }),
  quantity: z.number().int().min(1),
})

const createBillSchema = z.object({
  items: z.array(billItemSchema).min(1, 'At least one item required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  paymentMethod: z.enum(['cash', 'upi']),
})

function makeBillNumber(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `KP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(Math.random() * 9000) + 1000}`
}

export async function createBill(req: Request, res: Response): Promise<void> {
  const parsed = createBillSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors })
    return
  }

  const { items, subtotal, tax, total, paymentMethod } = parsed.data

  try {
    // Filter items that have valid productId
    const validItems = items.filter((i) => i.product.id && i.product.id.length > 0)

    const bill = await prisma.$transaction(async (tx) => {
      // Create bill
      const newBill = await tx.bill.create({
        data: {
          billNumber: makeBillNumber(),
          subtotal,
          tax,
          total,
          paymentMethod,
          items: {
            create: validItems.map((item) => ({
              quantity: item.quantity,
              price: item.product.price,
              productId: item.product.id,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      })

      // Auto-deduct stock for each item
      for (const item of validItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
          },
        })
      }

      return newBill
    })

    const formatted = {
      billNumber: bill.billNumber,
      subtotal: bill.subtotal,
      tax: bill.tax,
      total: bill.total,
      paymentMethod: bill.paymentMethod,
      createdAt: bill.createdAt.toISOString(),
      items: bill.items.map((item) => ({
        product: {
          id: item.productId,
          barcode: item.product.barcode,
          name: item.product.name,
          price: item.price,
          brand: item.product.brand,
          unit: item.product.unit,
          category: item.product.category,
          imageUrl: item.product.imageUrl,
          stock: item.product.stock,
          source: item.product.source as 'local' | 'openfoodfacts' | 'ai',
        },
        quantity: item.quantity,
      })),
    }

    res.status(201).json({ bill: formatted })
  } catch (err) {
    console.error('Create bill error:', err)
    res.status(500).json({ message: 'Failed to create bill' })
  }
}

export async function getBills(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1')))
  const limit = 20
  const skip = (page - 1) * limit

  try {
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { name: true, barcode: true } } },
          },
        },
      }),
      prisma.bill.count(),
    ])

    const formatted = bills.map((bill) => ({
      billNumber: bill.billNumber,
      subtotal: bill.subtotal,
      tax: bill.tax,
      total: bill.total,
      paymentMethod: bill.paymentMethod,
      createdAt: bill.createdAt.toISOString(),
      items: bill.items.map((item) => ({
        product: {
          id: item.productId,
          barcode: item.product.barcode,
          name: item.product.name,
          price: item.price,
          brand: '',
          unit: '',
          category: '',
          imageUrl: '',
          stock: 0,
          source: 'local' as const,
        },
        quantity: item.quantity,
      })),
    }))

    res.status(200).json({ bills: formatted, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('Get bills error:', err)
    res.status(500).json({ message: 'Failed to fetch bills' })
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Week dates
    const weekDays: { label: string; start: Date; end: Date }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      weekDays.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        start,
        end,
      })
    }

    const [todayBills, totalBills, topItemsRaw] = await Promise.all([
      prisma.bill.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        select: { total: true },
      }),
      prisma.bill.count(),
      prisma.billItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { bill: { createdAt: { gte: todayStart, lte: todayEnd } } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

    const todaySales = todayBills.reduce((sum, b) => sum + b.total, 0)

    // Week sales
    const weekSales = await Promise.all(
      weekDays.map(async (day) => {
        const dayBills = await prisma.bill.findMany({
          where: { createdAt: { gte: day.start, lte: day.end } },
          select: { total: true },
        })
        return {
          day: day.label,
          amount: dayBills.reduce((s, b) => s + b.total, 0),
        }
      })
    )

    // Top products
    const productIds = topItemsRaw.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })

    const topProducts = topItemsRaw.map((item) => ({
      name: products.find((p) => p.id === item.productId)?.name || 'Unknown',
      count: item._sum.quantity || 0,
    }))

    res.status(200).json({ todaySales, totalBills, topProducts, weekSales })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
