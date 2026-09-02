export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 ${className}`}
    />
  )
}

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
