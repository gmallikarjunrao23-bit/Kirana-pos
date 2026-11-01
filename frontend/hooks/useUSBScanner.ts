'use client'

import { useEffect, useCallback, useRef } from 'react'

export function useUSBScanner(onDetected: (barcode: string) => void, active: boolean) {
  const buffer = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScan = useRef(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (e.key === 'Enter') {
      const code = buffer.current.trim()
      const now = Date.now()
      if (code.length >= 6 && now - lastScan.current > 1000) {
        lastScan.current = now
        onDetected(code)
      }
      buffer.current = ''
      if (timer.current) clearTimeout(timer.current)
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      buffer.current += e.key
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => { buffer.current = '' }, 150)
    }
  }, [active, onDetected])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [handleKeyDown])
}
