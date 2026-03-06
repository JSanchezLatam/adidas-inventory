export function ScannerReticle() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dimmed overlay with cutout */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Cutout area */}
      <div className="relative w-64 h-40 z-10">
        {/* Clear window */}
        <div className="absolute inset-0 bg-transparent border-0" />
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
        {/* Scanning line animation */}
        <div className="absolute inset-x-0 h-0.5 bg-red-500 animate-scan" />
      </div>
      <p className="absolute bottom-24 text-white text-sm text-center px-8">
        Apunta el codigo de barras o QR al recuadro
      </p>
    </div>
  )
}
