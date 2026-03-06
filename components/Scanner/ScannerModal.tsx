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

  const { videoRef, hasPermission, loading, startScanning, stopScanning } = useScanner({
    onScan: handleScan,
  })

  useEffect(() => {
    startScanning()
    return () => stopScanning()
  }, [startScanning, stopScanning])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    onScan(code)
    onClose()
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

        {/* Loading polyfill (iOS first open) */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <div className="w-10 h-10 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Iniciando escáner...</p>
          </div>
        )}

        {/* Camera permission denied */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-8">
              <div className="text-5xl mb-4">📷</div>
              <p className="text-lg font-semibold mb-2">Cámara no disponible</p>
              <p className="text-sm text-gray-400">
                Permite el acceso a la cámara en los ajustes del navegador.
              </p>
            </div>
          </div>
        )}

        {!loading && hasPermission !== false && <ScannerReticle />}
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
              className="bg-white text-black font-bold px-4 rounded-xl text-sm"
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
