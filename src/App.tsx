import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { DashboardLayout } from './components/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'

// Lazy-loaded: only fetched once a user is authenticated, keeping the public
// landing/login bundle small for first-time visitors on mobile data.
const Accounts = lazy(() => import('./pages/Accounts').then((m) => ({ default: m.Accounts })))
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Debts = lazy(() => import('./pages/Debts').then((m) => ({ default: m.Debts })))
const Goals = lazy(() => import('./pages/Goals').then((m) => ({ default: m.Goals })))
const Notifications = lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications })),
)
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Transactions = lazy(() =>
  import('./pages/Transactions').then((m) => ({ default: m.Transactions })),
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
