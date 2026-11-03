import { openDB, type IDBPDatabase } from 'idb'
import type { Product } from './api'

const DB_NAME = 'kirana-pos'
const DB_VERSION = 1

interface KiranaDB {
  products: {
    key: string
    value: Product & { syncedAt: number }
    indexes: { barcode: string; name: string }
  }
  offlineBills: {
    key: string
    value: {
      id: string
      data: unknown
      createdAt: number
      synced: boolean
    }
  }
}

let dbPromise: Promise<IDBPDatabase<KiranaDB>> | null = null

function getDB(): Promise<IDBPDatabase<KiranaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KiranaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' })
        productStore.createIndex('barcode', 'barcode', { unique: true })
        productStore.createIndex('name', 'name')
        db.createObjectStore('offlineBills', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function cacheProduct(product: Product): Promise<void> {
  try {
    const db = await getDB()
    await db.put('products', { ...product, syncedAt: Date.now() })
  } catch (err) {
    console.error('Cache product error:', err)
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const db = await getDB()
    const result = await db.getFromIndex('products', 'barcode', barcode)
    if (!result) return null
    const { syncedAt: _, ...product } = result
    return product
  } catch {
    return null
  }
}

export async function searchOfflineProducts(query: string): Promise<Product[]> {
  try {
    const db = await getDB()
    const all = await db.getAll('products')
    const lower = query.toLowerCase()
    return all
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.brand.toLowerCase().includes(lower) ||
          p.barcode.includes(query)
      )
      .slice(0, 10)
      .map(({ syncedAt: _, ...p }) => p)
  } catch {
    return []
  }
}

export async function saveOfflineBill(id: string, data: unknown): Promise<void> {
  try {
    const db = await getDB()
    await db.put('offlineBills', { id, data, createdAt: Date.now(), synced: false })
  } catch (err) {
    console.error('Save offline bill error:', err)
  }
}

export async function getPendingBills(): Promise<{ id: string; data: unknown }[]> {
  try {
    const db = await getDB()
    const all = await db.getAll('offlineBills')
    return all.filter((b) => !b.synced)
  } catch {
    return []
  }
}

export async function markBillSynced(id: string): Promise<void> {
  try {
    const db = await getDB()
    const bill = await db.get('offlineBills', id)
    if (bill) await db.put('offlineBills', { ...bill, synced: true })
  } catch (err) {
    console.error('Mark bill synced error:', err)
  }
                                 }
