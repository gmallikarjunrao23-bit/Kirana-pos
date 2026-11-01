'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Smartphone, Banknote, CheckCircle, Copy, Printer, MessageCircle, Share2 } from 'lucide-react'
import type { CartItem } from '@/lib/api'
import { formatCurrency, generateBillNumber, generateUPIString, generateWhatsAppText } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  items: CartItem[]
  onComplete: (method: 'cash' | 'upi') => void
  onClose: () => void
  upiId: string
  shopName: string
  gstPercent?: number
}

export default function PaymentModal({
  items, onComplete, onClose, upiId, shopName, gstPercent = 5,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'cash' | 'upi'>('upi')
  const [cashGiven, setCashGiven] = useState('')
  const [completed, setCompleted] = useState(false)
  const [billNumber] = useState(generateBillNumber)

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const tax = subtotal * (gstPercent / 100)
  const total = subtotal + tax
  const change = parseFloat(cashGiven || '0') - total

  const upiString = generateUPIString(total, upiId, shopName)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}&color=16a34a&bgcolor=ffffff&margin=10`

  const handleComplete = useCallback(() => {
    if (method === 'cash' && parseFloat(cashGiven || '0') < total) {
      toast.error(`Need ₹${(total - parseFloat(cashGiven || '0')).toFixed(2)} more`)
      return
    }
    setCompleted(true)
    setTimeout(() => onComplete(method), 1800)
  }, [method, cashGiven, total, onComplete])

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    const url = generateWhatsAppText(
      billNumber,
      items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      total,
      shopName
    )
    window.open(url, '_blank')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !completed) handleComplete()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, completed, handleComplete])

  // Print bill HTML
  const PrintBill = () => (
    <div id="print-bill" style={{ display: 'none' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>{shopName}</strong>
        <br /><span style={{ fontSize: 11 }}>Bill: {billNumber}</span>
        <br /><span style={{ fontSize: 10 }}>{new Date().toLocaleString('en-IN')}</span>
      </div>
      <hr />
      {items.map((i) => (
        <div key={i.product.barcode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, margin: '3px 0' }}>
          <span>{i.product.name} x{i.quantity}</span>
          <span>₹{(i.product.price * i.quantity).toFixed(2)}</span>
        </div>
      ))}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span>GST ({gstPercent}%)</span><span>₹{tax.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>
        <span>TOTAL</span><span>₹{total.toFixed(2)}</span>
      </div>
      <hr />
      <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>
        Thank you! Visit again 🙏
      </div>
    </div>
  )

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <PrintBill />
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Done! 🎉</h2>
          <p className="text-gray-400 text-sm font-mono">{billNumber}</p>
          <p className="text-primary font-bold text-2xl mt-3">{formatCurrency(total)}</p>
          {method === 'cash' && change > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 text-sm font-bold">
                Return change: {formatCurrency(change)}
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-5">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <PrintBill />
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Checkout</h2>
            <p className="text-xs text-gray-400 font-mono">{billNumber}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Amount */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-5 py-5 text-center">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Amount</p>
          <p className="text-5xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-400 mt-1.5">
            {items.reduce((s, i) => s + i.quantity, 0)} items • GST {formatCurrency(tax)}
          </p>
        </div>

        {/* Payment method toggle */}
        <div className="flex mx-5 mt-4 bg-gray-100 rounded-xl p-1 gap-1">
          {(['upi', 'cash'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === m ? 'bg-white shadow-sm text-primary' : 'text-gray-400'
              }`}
            >
              {m === 'upi' ? <Smartphone size={16} /> : <Banknote size={16} />}
              {m === 'upi' ? 'UPI / QR' : 'Cash'}
            </button>
          ))}
        </div>

        <div className="px-5 py-4">
          {method === 'upi' ? (
            <div className="text-center">
              <div className="w-52 h-52 mx-auto rounded-2xl overflow-hidden border-4 border-primary/10 shadow-sm">
                <img src={qrUrl} alt="UPI QR" className="w-full h-full" />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <p className="text-sm font-semibold text-gray-700">{upiId}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(upiId); toast.success('Copied!') }}
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  <Copy size={13} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">PhonePe • GPay • Paytm • Any UPI</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Cash received
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    autoFocus
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-4 py-3 text-xl font-bold outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500, 1000, 2000].slice(0, 4).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashGiven(String(amt))}
                    className="border border-gray-200 rounded-lg py-2 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-all active:scale-95"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {cashGiven && parseFloat(cashGiven) >= total && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-green-700 text-sm font-medium">Return change</span>
                  <span className="text-green-700 font-bold text-lg">{formatCurrency(change)}</span>
                </div>
              )}
              {cashGiven && parseFloat(cashGiven) < total && parseFloat(cashGiven) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-red-600 text-sm font-semibold">
                    ₹{(total - parseFloat(cashGiven)).toFixed(2)} short
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleComplete}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition-colors active:scale-95"
          >
            {method === 'upi' ? '✓ Payment Received' : '✓ Complete Sale'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 py-2 rounded-xl text-xs font-medium hover:bg-gray-50"
            >
              <Printer size={13} /> Print Bill
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 border border-green-200 text-green-600 py-2 rounded-xl text-xs font-medium hover:bg-green-50"
            >
              <MessageCircle size={13} /> WhatsApp
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Bill', text: `Bill: ${billNumber}\nTotal: ${formatCurrency(total)}` })
                } else {
                  navigator.clipboard.writeText(`${shopName}\nBill: ${billNumber}\nTotal: ${formatCurrency(total)}`)
                  toast.success('Bill details copied!')
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 py-2 rounded-xl text-xs font-medium hover:bg-blue-50"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
