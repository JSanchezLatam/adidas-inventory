'use client'

import { useEffect, useState } from 'react'
import { useScanner } from '@/hooks/useScanner'
import { ScannerReticle } from './ScannerReticle'
import { Button } from '@/components/ui/Button'

interface ScannerModalProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function ScannerModal({ onScan, onClose }: ScannerModalProps) {
  const [manualCode, setManualCode] = useState('')

  const handleScan = (code: string) => {
    onScan(code)
    onClose()
  }

  const { videoRef, hasPermission, isSupported, startScanning, stopScanning } = useScanner({
    onScan: handleScan,
  })

  useEffect(() => {
    if (isSupported) startScanning()
    return () => stopScanning()
  }, [isSupported, startScanning, stopScanning])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    onScan(code)
    onClose()
  }

  // Fallback for browsers without BarcodeDetector (iOS Safari, Firefox)
  if (!isSupported) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center text-white mb-8">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-lg font-semibold mb-2">Escáner no disponible</p>
          <p className="text-sm text-gray-400">
            Tu navegador no soporta el escáner automático. Ingresa el código manualmente.
          </p>
        </div>
        <form onSubmit={handleManualSubmit} className="w-full max-w-sm flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Código de barras..."
            className="w-full rounded-xl bg-gray-800 text-white placeholder:text-gray-500 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <Button type="submit" size="lg" className="w-full" disabled={!manualCode.trim()}>
            Buscar
          </Button>
          <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </form>
      </div>
    )
  }

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
              <p className="text-lg font-semibold mb-2">Cámara no disponible</p>
              <p className="text-sm text-gray-400 mb-6">
                Permite el acceso a la cámara en los ajustes del navegador y vuelve a intentarlo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — manual input + cancel */}
      <div className="bg-black px-6 py-5 flex flex-col gap-3">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="O ingresa el código manualmente..."
            className="flex-1 rounded-xl bg-gray-800 text-white placeholder:text-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {manualCode.trim() && (
            <button
              type="submit"
              className="bg-white text-black font-semibold px-4 rounded-xl text-sm"
            >
              OK
            </button>
          )}
        </form>
        <Button variant="secondary" size="lg" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
