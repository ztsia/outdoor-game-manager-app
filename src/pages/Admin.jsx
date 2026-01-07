import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LocationsTab } from '@/components/admin/LocationsTab'
import { TerritoriesTab } from '@/components/admin/TerritoriesTab'
import { WorldTourTab } from '@/components/admin/WorldTourTab'
import { TeamsTab } from '@/components/admin/TeamsTab'
import { SystemConfigTab } from '@/components/admin/SystemConfigTab'
import { BlindBoxTab } from '@/components/admin/BlindBoxTab'

export default function Admin() {
    const { role, logout } = useAuth()

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div>
                        <h1 className="text-xl font-bold">Admin Panel 🔧</h1>
                        <p className="text-sm text-muted-foreground">Role: {role}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto p-4">
                <Tabs defaultValue="locations" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="locations">Locations</TabsTrigger>
                        <TabsTrigger value="territories">Territories</TabsTrigger>
                        <TabsTrigger value="worldtour">World Tour</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                        <TabsTrigger value="config">Config</TabsTrigger>
                        <TabsTrigger value="blindbox">Blind Box</TabsTrigger>
                    </TabsList>

                    <TabsContent value="locations" className="mt-4">
                        <LocationsTab />
                    </TabsContent>

                    <TabsContent value="territories" className="mt-4">
                        <TerritoriesTab />
                    </TabsContent>

                    <TabsContent value="worldtour" className="mt-4">
                        <WorldTourTab />
                    </TabsContent>

                    <TabsContent value="teams" className="mt-4">
                        <TeamsTab />
                    </TabsContent>

                    <TabsContent value="config" className="mt-4">
                        <SystemConfigTab />
                    </TabsContent>

                    <TabsContent value="blindbox" className="mt-4">
                        <BlindBoxTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
