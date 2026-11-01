import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const products = [
  { barcode: '8901063052581', name: 'Maggi 2-Minute Noodles', brand: 'Nestle', price: 14, unit: '70g', category: 'food', imageUrl: '', stock: 50, source: 'local' },
  { barcode: '8901030869145', name: 'Parle-G Biscuits', brand: 'Parle', price: 10, unit: '100g', category: 'snacks', imageUrl: '', stock: 100, source: 'local' },
  { barcode: '8906002350018', name: 'Tata Salt', brand: 'Tata', price: 24, unit: '1kg', category: 'food', imageUrl: '', stock: 80, source: 'local' },
  { barcode: '8901719110146', name: 'Amul Butter', brand: 'Amul', price: 56, unit: '100g', category: 'dairy', imageUrl: '', stock: 30, source: 'local' },
  { barcode: '8901063013926', name: 'KitKat 4 Finger', brand: 'Nestle', price: 40, unit: '41.5g', category: 'snacks', imageUrl: '', stock: 40, source: 'local' },
  { barcode: '8901058851427', name: 'Lifebuoy Total Soap', brand: 'HUL', price: 42, unit: '150g', category: 'personal care', imageUrl: '', stock: 70, source: 'local' },
  { barcode: '8901764001869', name: 'Surf Excel Easy Wash', brand: 'HUL', price: 52, unit: '500g', category: 'household', imageUrl: '', stock: 45, source: 'local' },
  { barcode: '8901030036271', name: 'Hide & Seek Chocolate Chip', brand: 'Parle', price: 30, unit: '120g', category: 'snacks', imageUrl: '', stock: 60, source: 'local' },
  { barcode: '8902102330019', name: 'Aashirvaad Atta', brand: 'ITC', price: 280, unit: '5kg', category: 'food', imageUrl: '', stock: 25, source: 'local' },
  { barcode: '8901207002090', name: 'Fortune Sunflower Oil', brand: 'Adani Wilmar', price: 185, unit: '1L', category: 'food', imageUrl: '', stock: 35, source: 'local' },
  { barcode: '8906008350057', name: 'Colgate StrongTeeth', brand: 'Colgate', price: 55, unit: '200g', category: 'personal care', imageUrl: '', stock: 50, source: 'local' },
  { barcode: '8901138507252', name: 'Dettol Soap', brand: 'Reckitt', price: 48, unit: '125g', category: 'personal care', imageUrl: '', stock: 55, source: 'local' },
]

async function main() {
  console.log('🌱 Seeding Kirana POS v2...\n')
  let created = 0
  let skipped = 0

  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { barcode: product.barcode } })
    if (existing) { skipped++; continue }
    await prisma.product.create({ data: product })
    console.log(`✅ ${product.name}`)
    created++
  }

  console.log(`\n✅ Seeded: ${created} products`)
  if (skipped > 0) console.log(`⏭️  Skipped: ${skipped} (already exist)`)
  console.log('\n🚀 Ready! Start billing.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
