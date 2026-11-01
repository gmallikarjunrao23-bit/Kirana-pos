'use client'

import { useState } from 'react'
import { Save, X, Camera } from 'lucide-react'
import type { Product } from '@/lib/api'
import toast from 'react-hot-toast'

interface ManualProductFormProps {
  barcode: string
  prefill?: Partial<Product>
  onSave: (product: Omit<Product, 'id'>) => Promise<void>
  onCancel: () => void
  isAI?: boolean
}

const categories = [
  'general', 'food', 'beverage', 'snacks',
  'personal care', 'household', 'dairy', 'bakery',
]

export default function ManualProductForm({
  barcode, prefill, onSave, onCancel, isAI,
}: ManualProductFormProps) {
  const [form, setForm] = useState({
    name: prefill?.name || '',
    brand: prefill?.brand || '',
    price: prefill?.price && prefill.price > 0 ? String(prefill.price) : '',
    unit: prefill?.unit || '1 pc',
    category: prefill?.category || 'general',
    imageUrl: prefill?.imageUrl || '',
    stock: '100',
  })
  const [saving, setSaving] = useState(false)

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Product name required'); return }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('Valid price required'); return }

    setSaving(true)
    try {
      await onSave({
        barcode,
        name: form.name.trim(),
        brand: form.brand.trim(),
        price: parseFloat(form.price),
        unit: form.unit.trim() || '1 pc',
        category: form.category,
        imageUrl: form.imageUrl.trim(),
        stock: parseInt(form.stock) || 100,
        source: isAI ? 'ai' : 'local',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div>
          <p className="font-semibold text-amber-800 text-sm">
            {isAI ? '🤖 AI Detected — Confirm Details' : '➕ New Product'}
          </p>
          <p className="text-amber-600 text-xs font-mono">{barcode}</p>
        </div>
        <button onClick={onCancel} className="text-amber-400 hover:text-amber-600">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <input
          autoFocus
          type="text"
          placeholder="Product name *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Brand"
            value={form.brand}
            onChange={(e) => set('brand', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
            <input
              type="number"
              min="0"
              step="0.50"
              placeholder="Price *"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm outline-none focus:border-primary font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Unit (500g, 1L...)"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save & Add to Cart'}
          </button>
        </div>
      </form>
    </div>
  )
}
