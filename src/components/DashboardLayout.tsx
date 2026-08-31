import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord' },
  { to: '/accounts', label: 'Comptes' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Objectifs' },
]

export function DashboardLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.user_metadata?.first_name as string | undefined
  const displayName = firstName || user?.email

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-6 sm:flex">
        <span className="text-lg font-semibold text-slate-900">Finza</span>
        <nav className="mt-8 flex flex-col gap-1 text-sm font-medium text-slate-600">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Bonjour{displayName ? `, ${displayName}` : ''}
          </h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Se déconnecter
          </button>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
