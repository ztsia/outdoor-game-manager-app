import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Attack from '@/pages/Attack'
import WorldTour from '@/pages/WorldTour'
import WaitingPage from '@/pages/WaitingPage'
import GamePage from '@/pages/GamePage'
import HQ from '@/pages/HQ'
import Admin from '@/pages/Admin'

// Global Components
import { DefenderNotification } from '@/components/game/DefenderNotification'

// Root Layout - wraps all routes with global components
function RootLayout() {
  return (
    <>
      <Outlet />
      <DefenderNotification />
      <Toaster position="top-center" richColors />
    </>
  )
}

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

// Create router with Data Router API
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Root redirect
      { path: '/', element: <RoleRedirect /> },

      // Public route
      { path: '/login', element: <Login /> },

      // Manager routes
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/attack',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <Attack />
          </ProtectedRoute>
        )
      },
      {
        path: '/world-tour',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <WorldTour />
          </ProtectedRoute>
        )
      },
      {
        path: '/waiting/:territoryId',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <WaitingPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/game/:territoryId',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <GamePage />
          </ProtectedRoute>
        )
      },
      {
        path: '/world-tour/:gameId',
        element: (
          <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
            <GamePage mode="world_tour" />
          </ProtectedRoute>
        )
      },

      // HQ route
      {
        path: '/hq',
        element: (
          <ProtectedRoute allowedRoles={['HQ', 'ADMIN']}>
            <HQ />
          </ProtectedRoute>
        )
      },

      // Admin route
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Admin />
          </ProtectedRoute>
        )
      },

      // Catch all - redirect to home
      { path: '*', element: <RoleRedirect /> }
    ]
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
