'use client'

import { useState, useCallback, useEffect } from 'react'
import { Settings, BarChart3, WifiOff, RefreshCw, Package } from 'lucide-react'
import Link from 'next/link'
import Scanner from '@/components/Scanner'
import ProductCard from '@/components/ProductCard'
import Cart from '@/components/Cart'
import PaymentModal from '@/components/PaymentModal'
import ManualProductForm from '@/components/ManualProductForm'
import {
  lookupBarcode,
  detectProductFromImage,
  saveProduct,
  updateProductPrice,
  saveBill,
  syncPendingBills,
  type Product,
  type CartItem,
} from '@/lib/api'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import toast from 'react-hot-toast'

type AppState =
  | { step: 'scanning' }
  | { step: 'product_found'; product: Product; needsPrice?: boolean }
  | { step: 'product_not_found'; barcode: string }
  | { step: 'ai_detected'; product: Product }
  | { step: 'ai_detecting' }
  | { step: 'checkout' }

export default function POSPage() {
  const [state, setState] = useState<AppState>({ step: 'scanning' })
  const [cart, setCart] = useState<CartItem[]>([])
  const [processing, setProcessing] = useState(false)
  const online = useOnlineStatus()

  const shopName = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('kirana_settings') || '{}').shopName || 'Kirana Store'
    : 'Kirana Store'
  const upiId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('kirana_settings') || '{}').upiId || 'shop@upi'
    : 'shop@upi'
  const gstPercent = typeof window !== 'undefined'
    ? Number(JSON.parse(localStorage.getItem('kirana_settings') || '{}').gstPercent || 5)
    : 5

  // Sync pending offline bills when back online
  useEffect(() => {
    if (online) {
      syncPendingBills().then((count) => {
        if (count > 0) toast.success(`${count} offline bills synced!`)
      })
    }
  }, [online])

  const handleBarcode = useCallback(async (barcode: string) => {
    if (processing) return
    setProcessing(true)
    try {
      const { product, needsPrice, offline } = await lookupBarcode(barcode)
      if (product) {
        setState({ step: 'product_found', product, needsPrice })
        if (offline) toast('Offline mode — cached product', { icon: '📦' })
      } else {
        setState({ step: 'product_not_found', barcode })
        if (offline) {
          toast('Offline — product not in local DB', { icon: '📵' })
        } else {
          toast('Product not found — add manually', { icon: '🔍' })
        }
      }
    } finally {
      setProcessing(false)
    }
  }, [processing])

  const handleImageCapture = useCallback(async (base64: string) => {
    setState({ step: 'ai_detecting' })
    const { product } = await detectProductFromImage(base64)
    toast.dismiss('ai-detect')
    if (product) {
      if (product.price === 0) {
        setState({ step: 'ai_detected', product })
        toast.success(`🤖 AI detected: ${product.name}`)
      } else {
        setState({ step: 'product_found', product })
        toast.success(`🤖 AI detected: ${product.name}`)
      }
    } else {
      setState({ step: 'product_not_found', barcode: `AI-${Date.now()}` })
      toast('AI could not detect — add manually', { icon: '🤖' })
    }
  }, [])

  const addToCart = useCallback((product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.barcode === product.barcode)
      if (existing) {
        toast.success(`${product.name} (+${quantity})`)
        return prev.map((i) =>
          i.product.barcode === product.barcode
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      toast.success(`${product.name} added`)
      return [...prev, { product, quantity }]
    })
    setState({ step: 'scanning' })
  }, [])

  const updateCartQty = useCallback((barcode: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.barcode !== barcode))
    } else {
      setCart((prev) =>
        prev.map((i) => i.product.barcode === barcode ? { ...i, quantity: qty } : i)
      )
    }
  }, [])

  // Also handle search-add (qty 0 means new item)
  const handleCartUpdate = useCallback((barcode: string, qty: number) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.barcode === barcode)
      if (!exists && qty > 0) return prev
      return prev.map((i) =>
        i.product.barcode === barcode ? { ...i, quantity: qty } : i
      ).filter((i) => i.quantity > 0)
    })
  }, [])

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const saved = await saveProduct(productData)
      addToCart(saved, 1)
      toast.success('Product saved & added!')
    } catch {
      toast.error('Failed to save product')
    }
  }

  const handlePaymentComplete = async (method: 'cash' | 'upi') => {
    const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
    const tax = subtotal * (gstPercent / 100)
    const total = subtotal + tax

    try {
      await saveBill({ items: cart, subtotal, tax, total, paymentMethod: method })
    } catch {
      console.error('Bill save failed')
    }

    setCart([])
    setState({ step: 'scanning' })
  }

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">{shopName}</p>
              <p className="text-[10px] text-gray-400 font-mono">Smart POS v2</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!online && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-xs font-medium">
                <WifiOff size={11} /> Offline
              </div>
            )}
            {cart.length > 0 && (
              <div className="bg-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {totalItems}
              </div>
            )}
            <Link href="/dashboard" className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors">
              <BarChart3 size={18} />
            </Link>
            <Link href="/settings" className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors">
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* Scanner */}
        <Scanner
          onBarcode={handleBarcode}
          onImageCapture={handleImageCapture}
          disabled={processing || state.step === 'ai_detecting'}
        />

        {/* AI detecting */}
        {state.step === 'ai_detecting' && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-none">
              <RefreshCw size={18} className="text-purple-600 animate-spin" />
            </div>
            <div>
              <p className="text-purple-800 font-semibold text-sm">AI Analyzing...</p>
              <p className="text-purple-500 text-xs">Groq Vision detecting product</p>
            </div>
          </div>
        )}

        {/* Product found */}
        {(state.step === 'product_found' || state.step === 'ai_detected') && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {state.step === 'ai_detected' ? '🤖 AI Detected' : '✅ Product Found'}
              </p>
              <button
                onClick={() => setState({ step: 'scanning' })}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Scan another
              </button>
            </div>
            <ProductCard
              product={state.product}
              onAddToCart={addToCart}
              needsPrice={state.step === 'ai_detected' || state.needsPrice || state.product.price === 0}
              onUpdatePrice={async (id, price) => {
                const updated = await updateProductPrice(id, price)
                setState((prev) =>
                  (prev.step === 'product_found' || prev.step === 'ai_detected')
                    ? { ...prev, product: updated, needsPrice: false }
                    : prev
                )
              }}
            />
          </div>
        )}

        {/* Product not found */}
        {state.step === 'product_not_found' && (
          <ManualProductForm
            barcode={state.barcode}
            onSave={handleSaveProduct}
            onCancel={() => setState({ step: 'scanning' })}
          />
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <Cart
            items={cart}
            onUpdateQty={handleCartUpdate}
            onRemove={(barcode) => {
              setCart((prev) => prev.filter((i) => i.product.barcode !== barcode))
              toast('Removed', { icon: '🗑️', duration: 1500 })
            }}
            onCheckout={() => setState({ step: 'checkout' })}
            gstPercent={gstPercent}
          />
        )}

        {/* Empty state */}
        {cart.length === 0 && state.step === 'scanning' && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Ready to scan</p>
            <p className="text-xs mt-1">Camera, USB, or AI photo — anni work avutaayi!</p>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {state.step === 'checkout' && (
        <PaymentModal
          items={cart}
          onComplete={handlePaymentComplete}
          onClose={() => setState({ step: 'scanning' })}
          upiId={upiId}
          shopName={shopName}
          gstPercent={gstPercent}
        />
      )}
    </div>
  )
}
