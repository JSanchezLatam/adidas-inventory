'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseScannerOptions {
  onScan: (code: string) => void
  onError?: (error: Error) => void
}

export function useScanner({ onScan, onError }: UseScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readerRef = useRef<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return

    try {
      // Dynamic import so it only loads on client
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Get available cameras via MediaDevices API
      let deviceId: string | undefined
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')
        // Prefer back camera on mobile
        const backCamera = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment')
        )
        deviceId = backCamera?.deviceId ?? videoDevices[0]?.deviceId
      } catch {
        // If enumerateDevices fails, let ZXing pick the default
      }

      setIsScanning(true)
      setHasPermission(true)

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            if (navigator.vibrate) navigator.vibrate(100)
            const audio = new Audio('/sounds/beep.mp3')
            audio.play().catch(() => {})
            onScan(result.getText())
          }
          if (err) {
            // NotFoundException fires on every empty frame — ignore it
            if (err.name !== 'NotFoundException') {
              onError?.(err as Error)
            }
          }
        }
      )
    } catch (err) {
      setHasPermission(false)
      setIsScanning(false)
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        onError?.(new Error('Permiso de camara denegado'))
      } else {
        onError?.(error)
      }
    }
  }, [onScan, onError])

  const stopScanning = useCallback(() => {
    readerRef.current?.reset()
    readerRef.current = null
    setIsScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      readerRef.current?.reset()
    }
  }, [])

  return { videoRef, isScanning, hasPermission, startScanning, stopScanning }
}
