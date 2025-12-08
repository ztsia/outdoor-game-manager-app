import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function LoginForm() {
  const [accessCode, setAccessCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

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
  )
}


function Dashboard() {
  const { user, role, teamId, logout } = useAuth()

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Hello World! 🎉</CardTitle>
        <CardDescription>Welcome to Outdoor Game</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary">Role: {role}</Badge>
          {teamId && <Badge variant="outline">Team: {teamId}</Badge>}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Firebase User ID: <code className="text-xs">{user?.uid?.slice(0, 8)}...</code>
        </p>
        <div className="rounded-lg bg-primary p-4 text-primary-foreground text-center font-bold">
          Team Color Verification
        </div>
        <Button variant="outline" className="w-full" onClick={logout}>
          Logout
        </Button>
      </CardContent>
    </Card>
  )
}

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {isAuthenticated ? <Dashboard /> : <LoginForm />}
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default App
