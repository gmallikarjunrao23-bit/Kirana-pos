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
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopScanner = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream

      const video = document.createElement('video')
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.objectFit = 'cover'
      videoRef.current.innerHTML = ''
      videoRef.current.appendChild(video)
      await video.play()

      setScanning(true)

      // Use BarcodeDetector if available (Chrome/Android)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BarcodeDetectorAPI = (window as any).BarcodeDetector
      if (BarcodeDetectorAPI) {
        const detector = new BarcodeDetectorAPI({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
        })

        intervalRef.current = setInterval(async () => {
          if (!video.videoWidth) return
          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue
              const now = Date.now()
              if (code && (code !== lastCode.current || now - lastTime.current > 2500)) {
                lastCode.current = code
                lastTime.current = now
                onDetected(code)
              }
            }
          } catch { /* ignore frame errors */ }
        }, 200)
      } else {
        // BarcodeDetector not available — show message
        setError('Camera scan not supported on this browser. Use manual entry or AI photo.')
        stopScanner()
      }
    } catch {
      setError('Camera access denied. Use manual entry.')
    }
  }, [onDetected, stopScanner])

  useEffect(() => {
    if (active) startScanner()
    else stopScanner()
    return () => stopScanner()
  }, [active, startScanner, stopScanner])

  return { videoRef, scanning, error }
                                          }
