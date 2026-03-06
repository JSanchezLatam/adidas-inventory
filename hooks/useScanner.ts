'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseScannerOptions {
  onScan: (code: string) => void
  onError?: (error: Error) => void
}

type BarcodeFormat =
  | 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e'
  | 'code_128' | 'code_39' | 'qr_code'
  | 'data_matrix' | 'itf' | 'aztec' | 'pdf417'

interface BarcodeDetectorAPI {
  detect(image: HTMLVideoElement): Promise<Array<{ rawValue: string }>>
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: BarcodeFormat[] }) => BarcodeDetectorAPI
  }
}

const BARCODE_FORMATS: BarcodeFormat[] = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e',
  'code_128', 'code_39', 'qr_code', 'data_matrix', 'itf',
]

export function useScanner({ onScan, onError }: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const detectedRef = useRef(false)
  const activeRef = useRef(false)

  // Keep callbacks in refs so startScanning/stopScanning never need to change reference
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  })

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const startScanning = useCallback(async () => {
    if (!videoRef.current || activeRef.current) return
    activeRef.current = true
    detectedRef.current = false

    try {
      // Load polyfill once for browsers without native BarcodeDetector (iOS, Firefox)
      if (!('BarcodeDetector' in window)) {
        setLoading(true)
        await import('barcode-detector/polyfill')
        setLoading(false)
      }

      if (!activeRef.current) return // Was stopped while loading polyfill

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setHasPermission(true)

      const detector = new window.BarcodeDetector!({ formats: BARCODE_FORMATS })

      const scan = async () => {
        if (!videoRef.current || !activeRef.current || detectedRef.current) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0 && !detectedRef.current) {
            detectedRef.current = true
            navigator.vibrate?.(100)
            new Audio('/sounds/beep.mp3').play().catch(() => {})
            onScanRef.current(barcodes[0].rawValue)
            return
          }
        } catch {
          // Ignore per-frame errors
        }
        rafRef.current = requestAnimationFrame(scan)
      }

      rafRef.current = requestAnimationFrame(scan)
    } catch (err) {
      activeRef.current = false
      setLoading(false)
      setHasPermission(false)
      const error = err as Error
      onErrorRef.current?.(
        error.name === 'NotAllowedError'
          ? new Error('Permiso de cámara denegado')
          : error
      )
    }
  }, []) // Stable — callbacks accessed via refs

  const stopScanning = useCallback(() => {
    activeRef.current = false
    detectedRef.current = false

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setLoading(false)
  }, []) // Stable

  return { videoRef, hasPermission, loading, startScanning, stopScanning }
}
