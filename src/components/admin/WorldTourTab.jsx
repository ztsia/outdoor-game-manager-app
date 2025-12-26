import { useState } from 'react'
import { Plus, MapPin, Trophy } from 'lucide-react'
import { useWorldTourGames } from '@/hooks/useWorldTourGames'
import { useLocations } from '@/hooks/useLocations'
import { useTeams } from '@/hooks/useTeams'
import {
    createWorldTourGame,
    updateWorldTourGame,
    deleteWorldTourGame,
    resetWorldTourState,
    cleanupWorldTourStats,
    updateLocation
} from '@/services/gameService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import { WorldTourModal } from '@/components/admin/WorldTourModal'
import { toast } from 'sonner'

/**
 * AdminWorldTourCard - Card for displaying World Tour game in admin list
 */
function AdminWorldTourCard({ game, location, highScoreTeam, onClick }) {
    const isActive = !!game.current_team_id

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
                    <Badge className={`${isActive ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                        {isActive ? 'In Progress' : 'Available'}
                    </Badge>
                </div>

                {/* High Score Badge */}
                {game.high_score > 0 && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 bg-black/50 text-yellow-400 px-2 py-1 rounded-md">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-bold">{game.high_score}</span>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                {/* Location Name with Emoji */}
                <h3 className="font-semibold text-lg line-clamp-1">
                    {location?.emoji && `${location.emoji} `}
                    {location?.name || 'Unknown Location'}
                </h3>

                {/* Game Name */}
                <p className="text-sm text-muted-foreground mb-2">{game.name}</p>

                {/* High Score Holder */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Fan Favourite:</span>
                    {highScoreTeam ? (
                        <TeamChip name={highScoreTeam.name} color={highScoreTeam.color} />
                    ) : (
                        <span className="text-xs text-muted-foreground italic">None yet</span>
                    )}
                </div>

                {/* ID */}
                <p className="text-xs text-muted-foreground mt-2">ID: {game.id}</p>
            </CardContent>
        </Card>
    )
}

export function WorldTourTab() {
    const { games, loading: gamesLoading } = useWorldTourGames()
    const { locations, locationsMap, loading: locationsLoading } = useLocations()
    const { teamsMap, loading: teamsLoading } = useTeams()

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedGame, setSelectedGame] = useState(null)

    const loading = gamesLoading || locationsLoading || teamsLoading

    const handleCardClick = (game) => {
        setSelectedGame(game)
        setModalOpen(true)
    }

    const handleAddClick = () => {
        setSelectedGame(null)
        setModalOpen(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedGame) {
                // Update existing
                await updateWorldTourGame(selectedGame.id, data)

                // Update location assignment if changed
                const oldLocationId = selectedGame.location_id
                const newLocationId = data.location_id

                if (oldLocationId !== newLocationId) {
                    // Clear old location assignment
                    if (oldLocationId) {
                        await updateLocation(oldLocationId, { assigned_game_id: null })
                    }
                    // Set new location assignment
                    if (newLocationId) {
                        await updateLocation(newLocationId, { assigned_game_id: selectedGame.id })
                    }
                }

                toast.success('World Tour game updated!')
            } else {
                // Create new
                const newId = await createWorldTourGame(data)

                // Update location assignment
                if (data.location_id) {
                    await updateLocation(data.location_id, { assigned_game_id: newId })
                }

                toast.success(`World Tour game created: ${newId}`)
            }
        } catch (error) {
            console.error('Error saving World Tour game:', error)
            toast.error('Failed to save World Tour game')
            throw error
        }
    }

    const handleDelete = async () => {
        if (!selectedGame) return
        try {
            // Clear location assignment
            if (selectedGame.location_id) {
                await updateLocation(selectedGame.location_id, { assigned_game_id: null })
            }

            await deleteWorldTourGame(selectedGame.id)
            toast.success('World Tour game deleted!')
        } catch (error) {
            console.error('Error deleting World Tour game:', error)
            toast.error('Failed to delete World Tour game')
            throw error
        }
    }

    const handleReset = async () => {
        if (!selectedGame) return
        try {
            await resetWorldTourState(selectedGame.id)
        } catch (error) {
            console.error('Error resetting World Tour game:', error)
            toast.error('Failed to reset game state')
            throw error
        }
    }

    const handleCleanup = async () => {
        if (!selectedGame) return
        try {
            await cleanupWorldTourStats(selectedGame.id)
        } catch (error) {
            console.error('Error cleaning up World Tour stats:', error)
            toast.error('Failed to clear stats')
            throw error
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Loading World Tour games...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">🌍 World Tour Games</h2>
                    <p className="text-sm text-muted-foreground">Manage World Tour games ({games.length})</p>
                </div>
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add World Tour
                </Button>
            </div>

            {/* Games Grid */}
            {games.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map((game) => (
                        <AdminWorldTourCard
                            key={game.id}
                            game={game}
                            location={locationsMap[game.location_id]}
                            highScoreTeam={teamsMap[game.high_score_holder_id]}
                            onClick={() => handleCardClick(game)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No World Tour games yet. Click "Add World Tour" to create one.
                </p>
            )}

            <WorldTourModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                game={selectedGame}
                locations={locations}
                onSave={handleSave}
                onDelete={handleDelete}
                onReset={handleReset}
                onCleanup={handleCleanup}
            />
        </div>
    )
}
