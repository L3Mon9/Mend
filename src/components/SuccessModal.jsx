export default function SuccessModal({ open, title, message, confirmLabel = 'Continue', onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div className="card relative w-full max-w-sm p-7 text-center animate-rise">
        <div className="wick text-candle text-4xl inline-block animate-flicker mb-4">🕯️</div>
        <h2 className="text-2xl font-display text-parchment">{title}</h2>
        <p className="text-parchment-muted text-sm mt-2 leading-relaxed">{message}</p>
        <button onClick={onConfirm} className="btn-primary w-full mt-6">
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}