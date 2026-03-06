'use client'

import { useEffect } from 'react'
import { useScanner } from '@/hooks/useScanner'
import { ScannerReticle } from './ScannerReticle'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface ScannerModalProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function ScannerModal({ onScan, onClose }: ScannerModalProps) {
  const { showToast } = useToast()

  const handleScan = (code: string) => {
    onScan(code)
    onClose()
  }

  const handleError = (error: Error) => {
    showToast(error.message, 'error')
  }

  const { videoRef, hasPermission, startScanning, stopScanning } = useScanner({
    onScan: handleScan,
    onError: handleError,
  })

  useEffect(() => {
    startScanning()
    return () => stopScanning()
  }, [startScanning, stopScanning])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Camera feed */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {hasPermission !== false && <ScannerReticle />}

        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-8">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-lg font-semibold mb-2">Camara no disponible</p>
              <p className="text-sm text-gray-400 mb-6">
                Permite el acceso a la camara en los ajustes del navegador y vuelve a intentarlo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-black px-6 py-6 flex flex-col gap-3">
        <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
