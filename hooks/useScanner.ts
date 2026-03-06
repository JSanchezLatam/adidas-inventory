'use client'

import { useCallback, useRef, useState } from 'react'

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

  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    detectedRef.current = false

    try {
      // Load polyfill for browsers without native BarcodeDetector (iOS Safari, Firefox)
      if (!('BarcodeDetector' in window)) {
        setLoading(true)
        await import('barcode-detector/polyfill')
        setLoading(false)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setHasPermission(true)
      setIsScanning(true)

      const detector = new window.BarcodeDetector!({ formats: BARCODE_FORMATS })

      const scan = async () => {
        if (!videoRef.current || !streamRef.current || detectedRef.current) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0 && !detectedRef.current) {
            detectedRef.current = true
            navigator.vibrate?.(100)
            new Audio('/sounds/beep.mp3').play().catch(() => {})
            onScan(barcodes[0].rawValue)
            return
          }
        } catch {
          // Ignore per-frame detection errors
        }
        rafRef.current = requestAnimationFrame(scan)
      }

      rafRef.current = requestAnimationFrame(scan)
    } catch (err) {
      setLoading(false)
      setHasPermission(false)
      setIsScanning(false)
      const error = err as Error
      onError?.(
        error.name === 'NotAllowedError'
          ? new Error('Permiso de cámara denegado')
          : error
      )
    }
  }, [onScan, onError])

  const stopScanning = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsScanning(false)
    setLoading(false)
  }, [])

  return { videoRef, isScanning, hasPermission, loading, startScanning, stopScanning }
}
