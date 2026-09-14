import { Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function AssistantButton() {
  const location = useLocation()
  if (location.pathname !== '/dashboard') return null

  return (
    <Link
      to="/assistant"
      aria-label="Assistant Finza"
      className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 sm:bottom-6 sm:right-6"
    >
      <Sparkles size={22} strokeWidth={2} />
    </Link>
  )
}
