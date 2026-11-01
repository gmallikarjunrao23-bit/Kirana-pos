'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Package } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Settings {
  shopName: string
  upiId: string
  gstPercent: string
  ownerPhone: string
  currency: string
}

const defaultSettings: Settings = {
  shopName: '',
  upiId: '',
  gstPercent: '5',
  ownerPhone: '',
  currency: 'INR',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kirana_settings')
      if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) })
    } catch { /* ignore */ }
  }, [])

  const set = (key: keyof Settings, val: string) =>
    setSettings((p) => ({ ...p, [key]: val }))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings.shopName.trim()) { toast.error('Shop name required'); return }
    if (!settings.upiId.trim()) { toast.error('UPI ID required'); return }
    localStorage.setItem('kirana_settings', JSON.stringify(settings))
    setSaved(true)
    toast.success('Settings saved!')
    setTimeout(() => setSaved(false), 2000)
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-bold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Shop info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Shop Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Shop Name *
              </label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => set('shopName', e.target.value)}
                placeholder="Ramu Kirana Store"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Owner Phone
              </label>
              <input
                type="tel"
                value={settings.ownerPhone}
                onChange={(e) => set('ownerPhone', e.target.value)}
                placeholder="9876543210"
                className={inputClass}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">💳 Payment Settings</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                UPI ID *
              </label>
              <input
                type="text"
                value={settings.upiId}
                onChange={(e) => set('upiId', e.target.value)}
                placeholder="shopname@ybl"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Customer QR scan chesi direct ga pay chesthadu
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                GST Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="1"
                  value={settings.gstPercent}
                  onChange={(e) => set('gstPercent', e.target.value)}
                  className={inputClass}
                />
                <span className="text-gray-500 font-bold text-lg">%</span>
              </div>
              <div className="flex gap-2 mt-2">
                {['0', '5', '12', '18', '28'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set('gstPercent', g)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      settings.gstPercent === g
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {g}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
            }`}
          >
            <Save size={16} />
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </form>
      </main>
    </div>
  )
}
