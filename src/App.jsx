import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Attack from '@/pages/Attack'
import WorldTour from '@/pages/WorldTour'
import WaitingPage from '@/pages/WaitingPage'
import HQ from '@/pages/HQ'
import Admin from '@/pages/Admin'

// Global Components
import { DefenderNotification } from '@/components/game/DefenderNotification'

// Role-based redirect component for root route
function RoleRedirect() {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on role
  const roleHomeMap = {
    'MANAGER': '/dashboard',
    'HQ': '/hq',
    'ADMIN': '/admin'
  }

  return <Navigate to={roleHomeMap[role] || '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Manager routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attack"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <Attack />
            </ProtectedRoute>
          }
        />
        <Route
          path="/world-tour"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <WorldTour />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting/:territoryId"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <WaitingPage />
            </ProtectedRoute>
          }
        />

        {/* HQ route */}
        <Route
          path="/hq"
          element={
            <ProtectedRoute allowedRoles={['HQ', 'ADMIN']}>
              <HQ />
            </ProtectedRoute>
          }
        />

        {/* Admin route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
      <DefenderNotification />
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  )
}

export default App
