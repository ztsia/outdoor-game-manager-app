import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HQ() {
    const { role, logout } = useAuth()

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">HQ Control 🎯</CardTitle>
                    <CardDescription>Game Master Headquarters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="secondary">Role: {role}</Badge>
                    </div>
                    <div className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
                        <p className="text-lg font-medium">HQ Dashboard</p>
                        <p className="text-sm">Manage game sessions, validate results, broadcast announcements.</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={logout}>
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
