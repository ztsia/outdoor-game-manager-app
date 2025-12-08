import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @param {React.ReactNode} props.children - Child components to render if authorized
 */
export function ProtectedRoute({ allowedRoles, children }) {
    const { isAuthenticated, role, loading } = useAuth()
    const location = useLocation()

    // Show loading while auth state is being determined
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(role)) {
        // Redirect to appropriate home based on role
        const roleHomeMap = {
            'MANAGER': '/dashboard',
            'HQ': '/hq',
            'ADMIN': '/admin'
        }
        const redirectTo = roleHomeMap[role] || '/login'
        return <Navigate to={redirectTo} replace />
    }

    // Authorized -> render children
    return children
}
