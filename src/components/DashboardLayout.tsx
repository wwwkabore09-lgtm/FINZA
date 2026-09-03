import {
  Bell,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PiggyBank,
  Plus,
  Repeat,
  Target,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/accounts', label: 'Comptes', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: Repeat },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Objectifs', icon: Target },
  { to: '/debts', label: 'Dettes', icon: HandCoins },
]

const MOBILE_MENU_ITEMS = [
  { to: '/transactions', label: 'Transactions', icon: Repeat },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Objectifs', icon: Target },
  { to: '/debts', label: 'Dettes', icon: HandCoins },
  { to: '/subscription', label: 'Abonnement', icon: CreditCard },
]

export function DashboardLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const firstName = user?.user_metadata?.first_name as string | undefined
  const displayName = firstName || user?.email
  const initial = (firstName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-6 sm:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1 text-sm font-medium text-slate-600">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`
            }
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
              {initial}
            </span>
            Profil
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <LogOut size={18} strokeWidth={2} />
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 pb-16 sm:pb-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 sm:hidden">
            <Logo showText={false} />
          </div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            Bonjour{displayName ? `, ${displayName}` : ''}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:block"
            >
              Se déconnecter
            </button>
            <Link
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white sm:hidden"
              aria-label="Profil"
            >
              {initial}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 sm:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-x-0 bottom-16 rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col">
              {MOBILE_MENU_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <item.icon size={18} strokeWidth={2} className="text-slate-400" />
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                <LogOut size={18} strokeWidth={2} className="text-slate-400" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center border-t border-slate-200 bg-white sm:hidden">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-emerald-700' : 'text-slate-500'
            }`
          }
        >
          <LayoutDashboard size={19} strokeWidth={2} />
          Accueil
        </NavLink>
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-emerald-700' : 'text-slate-500'
            }`
          }
        >
          <Wallet size={19} strokeWidth={2} />
          Comptes
        </NavLink>

        <div className="flex flex-1 justify-center">
          <Link
            to="/transactions"
            aria-label="Ajouter une transaction"
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
          >
            <Plus size={24} strokeWidth={2.5} />
          </Link>
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-emerald-700' : 'text-slate-500'
            }`
          }
        >
          <User size={19} strokeWidth={2} />
          Profil
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? 'text-emerald-700' : 'text-slate-500'
            }`
          }
        >
          <Bell size={19} strokeWidth={2} />
          Alertes
        </NavLink>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium text-slate-500"
        >
          <MenuIcon size={19} strokeWidth={2} />
          Menu
        </button>
      </nav>
    </div>
  )
}
