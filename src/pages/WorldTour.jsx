import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WorldTour() {
    const { role, teamId, logout } = useAuth()

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">World Tour 🌍</CardTitle>
                    <CardDescription>Complete challenges around the world</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Badge variant="secondary">Role: {role}</Badge>
                        {teamId && <Badge variant="outline">Team: {teamId}</Badge>}
                    </div>
                    <div className="rounded-lg bg-muted p-8 text-center text-muted-foreground">
                        <p className="text-lg font-medium">Coming Soon</p>
                        <p className="text-sm">World Tour games will be listed here.</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={logout}>
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
