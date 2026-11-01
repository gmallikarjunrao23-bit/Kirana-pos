'use client'

import { useState } from 'react'
import { Plus, Minus, Edit2, Check, X, AlertCircle } from 'lucide-react'
import type { Product } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, quantity: number) => void
  onUpdatePrice?: (id: string, price: number) => Promise<void>
  needsPrice?: boolean
}

const categoryEmoji: Record<string, string> = {
  food: '🍚', beverage: '🥤', snacks: '🍿',
  dairy: '🥛', bakery: '🍞',
  'personal care': '🧴', household: '🧹', general: '📦',
}

const sourceBadge = {
  local: { label: 'Local', color: 'bg-green-100 text-green-700 border-green-200' },
  openfoodfacts: { label: 'Food DB', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ai: { label: '🤖 AI', color: 'bg-purple-100 text-purple-700 border-purple-200' },
}

export default function ProductCard({
  product, onAddToCart, onUpdatePrice, needsPrice,
}: ProductCardProps) {
  const [qty, setQty] = useState(1)
  const [editingPrice, setEditingPrice] = useState(needsPrice || product.price === 0)
  const [newPrice, setNewPrice] = useState(product.price > 0 ? String(product.price) : '')
  const [savingPrice, setSavingPrice] = useState(false)

  const badge = sourceBadge[product.source]
  const emoji = categoryEmoji[product.category] || '📦'

  const handleSavePrice = async () => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price <= 0) return
    setSavingPrice(true)
    try {
      await onUpdatePrice?.(product.id, price)
      product.price = price
      setEditingPrice(false)
    } finally {
      setSavingPrice(false)
    }
  }

  const canAdd = product.price > 0 && !editingPrice

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
      <div className="flex gap-3 p-4">
        {/* Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-none flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-1"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <span className="text-2xl">{emoji}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{product.brand}</p>
              )}
            </div>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border flex-none', badge.color)}>
              {badge.label}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-1">{product.unit} • {product.category}</p>

          {/* Price needs setting */}
          {(editingPrice || product.price === 0) ? (
            <div className="mt-2">
              {needsPrice && (
                <div className="flex items-center gap-1 mb-1.5">
                  <AlertCircle size={12} className="text-amber-500" />
                  <p className="text-xs text-amber-600 font-medium">Price set cheyyi</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()}
                    placeholder="0.00"
                    className="w-full border-2 border-amber-300 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none focus:border-primary font-semibold"
                  />
                </div>
                <button
                  onClick={handleSavePrice}
                  disabled={savingPrice}
                  className="bg-primary text-white p-1.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
                >
                  <Check size={14} />
                </button>
                {!needsPrice && (
                  <button onClick={() => setEditingPrice(false)} className="text-gray-400 p-1.5">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary text-lg">
                  {formatCurrency(product.price)}
                </span>
                <button
                  onClick={() => { setNewPrice(String(product.price)); setEditingPrice(true) }}
                  className="text-gray-300 hover:text-gray-500 transition-colors p-0.5"
                >
                  <Edit2 size={11} />
                </button>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-gray-800">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => { onAddToCart(product, qty); setQty(1) }}
                  disabled={!canAdd}
                  className="bg-primary text-white h-7 px-3 rounded-lg hover:bg-primary-dark transition-colors text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
