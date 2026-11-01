import axios from 'axios'
import {
  cacheProduct,
  getProductByBarcode,
  searchOfflineProducts,
  saveOfflineBill,
  getPendingBills,
  markBillSynced,
} from './offlineDB'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 12000,
})

export interface Product {
  id: string
  barcode: string
  name: string
  brand: string
  price: number
  unit: string
  category: string
  imageUrl: string
  stock: number
  source: 'local' | 'openfoodfacts' | 'ai'
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface BillData {
  billNumber: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'upi'
  createdAt: string
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function lookupBarcode(barcode: string): Promise<{
  product: Product | null
  needsPrice?: boolean
  offline?: boolean
}> {
  // Always check offline DB first (fast)
  const cached = await getProductByBarcode(barcode)
  if (cached) return { product: cached }

  if (!isOnline()) {
    return { product: null, offline: true }
  }

  try {
    const res = await API.get(`/api/products/barcode/${barcode}`)
    const product: Product = res.data.product
    if (product) await cacheProduct(product)
    return { product, needsPrice: res.data.needsPrice }
  } catch {
    return { product: null }
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  // Offline search first
  const offlineResults = await searchOfflineProducts(query)

  if (!isOnline()) return offlineResults

  try {
    const res = await API.get(`/api/products/search?q=${encodeURIComponent(query)}`)
    const products: Product[] = res.data.products
    products.forEach((p) => cacheProduct(p))

    // Merge: online results first, then offline-only ones
    const onlineIds = new Set(products.map((p) => p.id))
    const offlineOnly = offlineResults.filter((p) => !onlineIds.has(p.id))
    return [...products, ...offlineOnly]
  } catch {
    return offlineResults
  }
}

export async function detectProductFromImage(
  imageBase64: string
): Promise<{ product: Product | null; confidence?: number }> {
  if (!isOnline()) return { product: null }

  try {
    const res = await API.post('/api/ai/detect', { image: imageBase64 })
    if (res.data.product && res.data.product.id) {
      await cacheProduct(res.data.product)
    }
    return { product: res.data.product, confidence: res.data.confidence }
  } catch {
    return { product: null }
  }
}

export async function saveProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const res = await API.post('/api/products', product)
  const saved: Product = res.data.product
  await cacheProduct(saved)
  return saved
}

export async function updateProductPrice(id: string, price: number): Promise<Product> {
  const res = await API.patch(`/api/products/${id}`, { price })
  const updated: Product = res.data.product
  await cacheProduct(updated)
  return updated
}

export async function saveBill(
  bill: Omit<BillData, 'billNumber' | 'createdAt'>
): Promise<BillData> {
  if (!isOnline()) {
    const offlineId = `offline-${Date.now()}`
    await saveOfflineBill(offlineId, bill)
    return {
      ...bill,
      billNumber: offlineId,
      createdAt: new Date().toISOString(),
    }
  }

  try {
    const res = await API.post('/api/bills', bill)
    return res.data.bill
  } catch {
    const offlineId = `offline-${Date.now()}`
    await saveOfflineBill(offlineId, bill)
    return {
      ...bill,
      billNumber: offlineId,
      createdAt: new Date().toISOString(),
    }
  }
}

export async function syncPendingBills(): Promise<number> {
  if (!isOnline()) return 0

  const pending = await getPendingBills()
  let synced = 0

  for (const bill of pending) {
    try {
      await API.post('/api/bills', bill.data)
      await markBillSynced(bill.id)
      synced++
    } catch {
      break
    }
  }

  return synced
}

export async function getBills(
  page = 1
): Promise<{ bills: BillData[]; total: number }> {
  const res = await API.get(`/api/bills?page=${page}`)
  return res.data
}

export async function getStats(): Promise<{
  todaySales: number
  totalBills: number
  topProducts: { name: string; count: number }[]
  weekSales: { day: string; amount: number }[]
}> {
  const res = await API.get('/api/stats')
  return res.data
}

export async function getAllProducts(page = 1): Promise<{
  products: Product[]
  total: number
  totalPages: number
}> {
  const res = await API.get(`/api/products?page=${page}`)
  return res.data
}

export async function deleteProduct(id: string): Promise<void> {
  await API.delete(`/api/products/${id}`)
}
