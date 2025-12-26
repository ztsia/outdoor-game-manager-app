import { useState } from 'react'
import { Plus, Star, MapPin } from 'lucide-react'
import { useAllTerritories } from '@/hooks/useAllTerritories'
import { useLocations } from '@/hooks/useLocations'
import { useTeams } from '@/hooks/useTeams'
import {
    createTerritory,
    updateTerritory,
    deleteTerritory,
    resetTerritoryState,
    updateLocation
} from '@/services/gameService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import { TerritoryModal } from '@/components/admin/TerritoryModal'
import { toast } from 'sonner'

/**
 * AdminTerritoryCard - Card for displaying territory in admin list
 */
function AdminTerritoryCard({ territory, location, ownerTeam, onClick }) {
    const challengeStatusColors = {
        idle: 'bg-green-500',
        requesting: 'bg-yellow-500',
        accepted: 'bg-red-500'
    }

    return (
        <Card
            className="overflow-hidden p-0 gap-0 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all"
            onClick={onClick}
        >
            {/* Cover Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {location?.image_url ? (
                    <img
                        src={location.image_url}
                        alt={location.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute right-2 top-2">
                    <Badge className={`${challengeStatusColors[territory.challenge_status] || 'bg-gray-500'} text-white`}>
                        {territory.challenge_status}
                    </Badge>
                </div>

                {/* Stars Badge */}
                <div className="absolute left-2 top-2 flex items-center gap-1 bg-black/50 text-yellow-400 px-2 py-1 rounded-md">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">{territory.stars}</span>
                </div>
            </div>

            <CardContent className="p-4">
                {/* Location Name */}
                <h3 className="font-semibold text-lg line-clamp-1">
                    {location?.name || 'Unknown Location'}
                </h3>

                {/* Game Name */}
                <p className="text-sm text-muted-foreground mb-2">{territory.name}</p>

                {/* Owner */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Owner:</span>
                    {ownerTeam ? (
                        <TeamChip name={ownerTeam.name} color={ownerTeam.color} />
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Unowned</span>
                    )}
                </div>

                {/* ID */}
                <p className="text-xs text-muted-foreground mt-2">ID: {territory.id}</p>
            </CardContent>
        </Card>
    )
}

export function TerritoriesTab() {
    const { territories, loading: territoriesLoading } = useAllTerritories()
    const { locations, locationsMap, loading: locationsLoading } = useLocations()
    const { teamsMap, loading: teamsLoading } = useTeams()

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedTerritory, setSelectedTerritory] = useState(null)

    const loading = territoriesLoading || locationsLoading || teamsLoading

    const handleCardClick = (territory) => {
        setSelectedTerritory(territory)
        setModalOpen(true)
    }

    const handleAddClick = () => {
        setSelectedTerritory(null)
        setModalOpen(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedTerritory) {
                // Update existing
                await updateTerritory(selectedTerritory.id, data)

                // Update location assignment if changed
                const oldLocationId = selectedTerritory.location_id
                const newLocationId = data.location_id

                if (oldLocationId !== newLocationId) {
                    // Clear old location assignment
                    if (oldLocationId) {
                        await updateLocation(oldLocationId, { assigned_game_id: null })
                    }
                    // Set new location assignment
                    if (newLocationId) {
                        await updateLocation(newLocationId, { assigned_game_id: selectedTerritory.id })
                    }
                }

                toast.success('Territory updated!')
            } else {
                // Create new
                const newId = await createTerritory(data)

                // Update location assignment
                if (data.location_id) {
                    await updateLocation(data.location_id, { assigned_game_id: newId })
                }

                toast.success(`Territory created: ${newId}`)
            }
        } catch (error) {
            console.error('Error saving territory:', error)
            toast.error('Failed to save territory')
            throw error
        }
    }

    const handleDelete = async () => {
        if (!selectedTerritory) return
        try {
            // Clear location assignment
            if (selectedTerritory.location_id) {
                await updateLocation(selectedTerritory.location_id, { assigned_game_id: null })
            }

            await deleteTerritory(selectedTerritory.id)
            toast.success('Territory deleted!')
        } catch (error) {
            console.error('Error deleting territory:', error)
            toast.error('Failed to delete territory')
            throw error
        }
    }

    const handleReset = async () => {
        if (!selectedTerritory) return
        try {
            await resetTerritoryState(selectedTerritory.id)
        } catch (error) {
            console.error('Error resetting territory:', error)
            toast.error('Failed to reset territory state')
            throw error
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Loading territories...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">🏰 Territories</h2>
                    <p className="text-sm text-muted-foreground">Manage game territories ({territories.length})</p>
                </div>
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Territory
                </Button>
            </div>

            {/* Territories Grid */}
            {territories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {territories.map((territory) => (
                        <AdminTerritoryCard
                            key={territory.id}
                            territory={territory}
                            location={locationsMap[territory.location_id]}
                            ownerTeam={teamsMap[territory.owner_id]}
                            onClick={() => handleCardClick(territory)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No territories yet. Click "Add Territory" to create one.
                </p>
            )}

            {/* Modal */}
            <TerritoryModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                territory={selectedTerritory}
                locations={locations}
                territories={territories}
                onSave={handleSave}
                onDelete={handleDelete}
                onReset={handleReset}
            />
        </div>
    )
}
