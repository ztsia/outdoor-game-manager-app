import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useLocations } from '@/hooks/useLocations'
import { createLocation, updateLocation, deleteLocation } from '@/services/gameService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LocationCard } from '@/components/admin/LocationCard'
import { LocationModal } from '@/components/admin/LocationModal'
import { toast } from 'sonner'

export function LocationsTab() {
    const { locations, loading } = useLocations()
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Separate and filter locations by type
    const query = searchQuery.toLowerCase()
    const territories = locations
        .filter((loc) => loc.type === 'territory')
        .filter((loc) => loc.name?.toLowerCase().includes(query))
    const worldTourLocations = locations
        .filter((loc) => loc.type === 'world_tour')
        .filter((loc) => loc.name?.toLowerCase().includes(query))

    const handleCardClick = (location) => {
        setSelectedLocation(location)
        setModalOpen(true)
    }

    const handleAddClick = () => {
        setSelectedLocation(null)
        setModalOpen(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedLocation) {
                // Update existing
                await updateLocation(selectedLocation.id, data)
                toast.success('Location updated!')
            } else {
                // Create new
                const newId = await createLocation(data)
                toast.success(`Location created: ${newId}`)
            }
        } catch (error) {
            console.error('Error saving location:', error)
            toast.error('Failed to save location')
            throw error
        }
    }

    const handleDelete = async () => {
        if (!selectedLocation) return
        try {
            await deleteLocation(selectedLocation.id)
            toast.success('Location deleted!')
        } catch (error) {
            console.error('Error deleting location:', error)
            toast.error('Failed to delete location')
            throw error
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Loading locations...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">📍 Locations</h2>
                    <p className="text-sm text-muted-foreground">Manage game locations</p>
                </div>
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Territories Section */}
            <div className="space-y-3">
                <h3 className="text-lg font-medium">🏰 Territories ({territories.length})</h3>
                {territories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {territories.map((loc) => (
                            <LocationCard
                                key={loc.id}
                                location={loc}
                                onClick={() => handleCardClick(loc)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No territory locations yet.</p>
                )}
            </div>

            {/* World Tour Section */}
            <div className="space-y-3">
                <h3 className="text-lg font-medium">🌍 World Tour ({worldTourLocations.length})</h3>
                {worldTourLocations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {worldTourLocations.map((loc) => (
                            <LocationCard
                                key={loc.id}
                                location={loc}
                                onClick={() => handleCardClick(loc)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No world tour locations yet.</p>
                )}
            </div>

            {/* Modal */}
            <LocationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                location={selectedLocation}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    )
}
