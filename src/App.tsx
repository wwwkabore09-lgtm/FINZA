import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { DashboardLayout } from './components/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Accounts } from './pages/Accounts'
import { Budgets } from './pages/Budgets'
import { Dashboard } from './pages/Dashboard'
import { Debts } from './pages/Debts'
import { Goals } from './pages/Goals'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { Subscription } from './pages/Subscription'
import { Transactions } from './pages/Transactions'

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
            <Route path="/subscription" element={<Subscription />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
