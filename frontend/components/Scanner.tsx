'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Keyboard, ImageIcon, X, Wifi, WifiOff, Zap } from 'lucide-react'
import { useScanner } from '@/hooks/useScanner'
import { useUSBScanner } from '@/hooks/useUSBScanner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ScannerProps {
  onBarcode: (barcode: string) => void
  onImageCapture: (base64: string) => void
  disabled?: boolean
}

export default function Scanner({ onBarcode, onImageCapture, disabled }: ScannerProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'manual'>('idle')
  const [manualInput, setManualInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const online = useOnlineStatus()

  const handleBarcode = useCallback((code: string) => {
    if (disabled) return
    toast.success(`Scanned: ${code}`, { duration: 1500 })
    onBarcode(code)
    setMode('idle')
  }, [disabled, onBarcode])

  const { videoRef, scanning, error } = useScanner({
    onDetected: handleBarcode,
    active: mode === 'camera',
  })

  useUSBScanner(handleBarcode, !disabled)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualInput.trim()
    if (code.length < 3) { toast.error('Enter valid barcode or product name'); return }
    handleBarcode(code)
    setManualInput('')
    setMode('idle')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image'); return }
    if (!online) { toast.error('AI detection needs internet'); return }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      onImageCapture(base64)
      toast.loading('AI detecting product...', { id: 'ai-detect', duration: 15000 })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <span className="font-semibold text-gray-800 text-sm">Scan Product</span>
        </div>
        <div className="flex items-center gap-2">
          {online ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Wifi size={12} /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-500">
              <WifiOff size={12} /> Offline
            </span>
          )}
          {mode !== 'idle' && (
            <button onClick={() => setMode('idle')} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Mode buttons */}
        {mode === 'idle' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('camera')}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all text-xs font-semibold',
                'border-primary/20 text-primary hover:bg-primary/5 hover:border-primary active:scale-95',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Camera size={22} />
              Camera
            </button>
            <button
              onClick={() => { setMode('manual'); setTimeout(() => document.getElementById('manual-input')?.focus(), 100) }}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all text-xs font-semibold',
                'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 active:scale-95',
                disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <Keyboard size={22} />
              Manual/USB
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || !online}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all text-xs font-semibold',
                'border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400 active:scale-95',
                (disabled || !online) && 'opacity-40 cursor-not-allowed'
              )}
            >
              <ImageIcon size={22} />
              AI Photo
            </button>
          </div>
        )}

        {/* Camera view */}
        {mode === 'camera' && (
          <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ height: '240px' }}>
            <div ref={videoRef} className="scanner-container w-full h-full" />
            {scanning && <div className="scan-line" />}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  'w-52 h-36 border-2 rounded-xl transition-colors duration-300',
                  scanning ? 'border-primary' : 'border-white/40'
                )}>
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                </div>
              </div>
            </div>
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
                <div className="text-center p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  <button
                    onClick={() => setMode('manual')}
                    className="mt-3 text-xs text-white/70 underline"
                  >
                    Use manual entry instead
                  </button>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full">
                {scanning ? '🟢 Scanning...' : 'Starting camera...'}
              </span>
            </div>
          </div>
        )}

        {/* Manual input */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <input
              id="manual-input"
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Barcode number ya product name type cheyyi..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Search & Add →
            </button>
            <p className="text-xs text-gray-400 text-center">
              USB scanner auto-works — just scan directly!
            </p>
          </form>
        )}

        {mode === 'idle' && (
          <p className="text-center text-xs text-gray-400 mt-3">
            USB scanner direct ga pani chestundi — plugin chesthe ready!
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}
