import { Bell } from 'lucide-react'

export function Notifications() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tu seras prévenu ici pour les événements importants (budget dépassé, objectif atteint...).
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Bell size={28} strokeWidth={1.5} className="text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">Aucune notification pour l'instant.</p>
      </div>
    </div>
  )
}
