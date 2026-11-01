'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseScannerOptions {
  onDetected: (barcode: string) => void
  active: boolean
}

export function useScanner({ onDetected, active }: UseScannerOptions) {
  const videoRef = useRef<HTMLDivElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastCode = useRef('')
  const lastTime = useRef(0)
  const quaggaRef = useRef<typeof import('quagga') | null>(null)

  const stopScanner = useCallback(() => {
    if (quaggaRef.current) {
      try { quaggaRef.current.stop() } catch { /* ignore */ }
      setScanning(false)
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return
    setError(null)

    try {
      const Quagga = (await import('quagga')).default
      quaggaRef.current = Quagga

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment',
          },
        },
        locator: { patchSize: 'medium', halfSample: true },
        numOfWorkers: typeof navigator !== 'undefined'
          ? Math.min(navigator.hardwareConcurrency || 2, 4)
          : 2,
        frequency: 12,
        decoder: {
          readers: [
            'ean_reader', 'ean_8_reader',
            'code_128_reader', 'code_39_reader',
            'upc_reader', 'upc_e_reader',
          ],
        },
        locate: true,
      }, (err: Error | null) => {
        if (err) {
          setError('Camera access denied. Use manual entry.')
          return
        }
        Quagga.start()
        setScanning(true)
      })

      Quagga.onDetected((result: { codeResult: { code: string; format: string } }) => {
        const code = result.codeResult.code
        const now = Date.now()
        if (code && (code !== lastCode.current || now - lastTime.current > 2500)) {
          lastCode.current = code
          lastTime.current = now
          onDetected(code)
        }
      })
    } catch {
      setError('Camera not available.')
    }
  }, [onDetected])

  useEffect(() => {
    if (active) startScanner()
    else stopScanner()
    return () => stopScanner()
  }, [active, startScanner, stopScanner])

  return { videoRef, scanning, error }
}
