'use client'

import { ShoppingCart, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react'
import type { CartItem } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { searchProducts } from '@/lib/api'
import type { Product } from '@/lib/api'
import toast from 'react-hot-toast'

interface CartProps {
  items: CartItem[]
  onUpdateQty: (barcode: string, qty: number) => void
  onRemove: (barcode: string) => void
  onCheckout: () => void
  gstPercent?: number
}

export default function Cart({
  items, onUpdateQty, onRemove, onCheckout, gstPercent = 5,
}: CartProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const tax = subtotal * (gstPercent / 100)
  const total = subtotal + tax

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const results = await searchProducts(q)
      setSearchResults(results.slice(0, 5))
    } finally {
      setSearching(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingCart size={24} className="text-gray-300" />
        </div>
        <p className="text-gray-400 text-sm font-medium">Cart is empty</p>
        <p className="text-gray-300 text-xs mt-1">Scan a product to start billing</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          <span className="font-semibold text-gray-800 text-sm">Cart</span>
          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {items.length}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {items.reduce((s, i) => s + i.quantity, 0)} items total
        </span>
      </div>

      {/* Quick search add */}
      <div className="px-4 pt-3 pb-2 relative">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search & add more products..."
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary transition-colors"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {searchResults.length > 0 && searchQuery.length > 0 && (
          <div className="absolute left-4 right-4 top-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden mt-1">
            {searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.price === 0) { toast.error('Set price first'); return }
                  onUpdateQty(p.barcode, (items.find(i => i.product.barcode === p.barcode)?.quantity || 0) + 1)
                  setSearchQuery('')
                  setSearchResults([])
                  if (!items.find(i => i.product.barcode === p.barcode)) {
                    toast.success(`${p.name} added`)
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-800 truncate flex-1">{p.name}</span>
                <span className="text-xs font-bold text-primary ml-2">{formatCurrency(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <div key={item.product.barcode} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
              <p className="text-xs text-gray-400">{formatCurrency(item.product.price)} × {item.quantity}</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => onUpdateQty(item.product.barcode, item.quantity - 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ChevronDown size={12} className="text-gray-600" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
              <button
                onClick={() => onUpdateQty(item.product.barcode, item.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ChevronUp size={12} className="text-gray-600" />
              </button>
            </div>
            <span className="text-sm font-bold text-gray-900 w-16 text-right">
              {formatCurrency(item.product.price * item.quantity)}
            </span>
            <button
              onClick={() => onRemove(item.product.barcode)}
              className="text-gray-300 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>GST ({gstPercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="text-primary text-base">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <button
          onClick={onCheckout}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors active:scale-95"
        >
          Proceed to Payment →
        </button>
      </div>
    </div>
  )
}
