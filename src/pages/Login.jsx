import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function Login() {
    const [accessCode, setAccessCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const { login, isAuthenticated, role } = useAuth()
    const location = useLocation()

    // If already authenticated, redirect to appropriate page
    if (isAuthenticated) {
        const roleHomeMap = {
            'MANAGER': '/dashboard',
            'HQ': '/hq',
            'ADMIN': '/admin'
        }
        let redirectTo = location.state?.from?.pathname || roleHomeMap[role] || '/dashboard'

        // If Admin is being sent to Dashboard (e.g. from redirect), send to Admin panel instead
        if (role === 'ADMIN' && redirectTo === '/dashboard') {
            redirectTo = '/admin'
        }

        return <Navigate to={redirectTo} replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login(accessCode)
            toast.success('Login successful!')
        } catch (error) {
            toast.error(error.message || 'Login failed')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Outdoor Game</CardTitle>
                    <CardDescription>Enter your access code to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="accessCode">Access Code</Label>
                            <div className="relative">
                                <Input
                                    id="accessCode"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your secret code"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    autoComplete="off"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
