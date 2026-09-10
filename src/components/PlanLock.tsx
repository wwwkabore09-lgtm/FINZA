import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PlanLockProps {
  title: string
  message: string
}

export function PlanLock({ title, message }: PlanLockProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <Lock size={20} strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{message}</p>
      <Link
        to="/subscription"
        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Voir les forfaits
      </Link>
    </div>
  )
}
