import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useTeams } from '@/hooks/useTeams'
import { useAllTerritories } from '@/hooks/useAllTerritories'
import { useLocations } from '@/hooks/useLocations'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import {
    createTeam,
    updateTeam,
    deleteTeam,
    assignTerritoryToTeam
} from '@/services/teamService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RankBadge } from '@/components/game/RankBadge'
import { TeamModal } from '@/components/admin/TeamModal'
import { toast } from 'sonner'
import { determineBaseRank } from '@/services/rankService'

/**
 * AdminTeamCard - Card for displaying team in admin list
 */
function AdminTeamCard({ team, territories, systemConfig, onClick }) {
    const teamTerritories = territories.filter(t => t.owner_id === team.id)
    const totalStars = teamTerritories.reduce((sum, t) => sum + (t.stars || 0), 0)
    const rank = determineBaseRank(team, teamTerritories, systemConfig || {})

    return (
        <Card
            className="overflow-hidden p-0 gap-0 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all"
            onClick={onClick}
        >
            {/* Color Header */}
            <div
                className="h-16 relative"
                style={{ backgroundColor: team.color || '#888888' }}
            >
                <div className="absolute bottom-2 left-3">
                    <div className="flex items-center gap-2 bg-black/50 text-white px-2 py-1 rounded-md">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-bold">{(team.followers || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-4">
                {/* Team Name */}
                <h3 className="font-semibold text-lg line-clamp-1">{team.name}</h3>

                {/* Rank Badge */}
                <div className="mt-2">
                    {rank ? (
                        <RankBadge rank={rank} />
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">No Rank</Badge>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>🏰 {teamTerritories.length} territories</span>
                    <span>⭐ {totalStars} stars</span>
                </div>

                {/* ID */}
                <p className="text-xs text-muted-foreground mt-2">ID: {team.id}</p>
            </CardContent>
        </Card>
    )
}

export function TeamsTab() {
    const { teams, loading: teamsLoading } = useTeams()
    const { territories, loading: territoriesLoading } = useAllTerritories()
    const { locationsMap, loading: locationsLoading } = useLocations()
    const { config, loading: configLoading } = useSystemConfig()

    const [modalOpen, setModalOpen] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState(null)

    const loading = teamsLoading || territoriesLoading || locationsLoading || configLoading

    const handleCardClick = (team) => {
        setSelectedTeam(team)
        setModalOpen(true)
    }

    const handleAddClick = () => {
        setSelectedTeam(null)
        setModalOpen(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedTeam) {
                await updateTeam(selectedTeam.id, data)
                toast.success('Team updated!')
            } else {
                const newId = await createTeam(data)
                toast.success(`Team created: ${newId}`)
            }
        } catch (error) {
            console.error('Error saving team:', error)
            toast.error('Failed to save team')
            throw error
        }
    }

    const handleDelete = async () => {
        if (!selectedTeam) return
        try {
            await deleteTeam(selectedTeam.id)
            toast.success('Team deleted!')
        } catch (error) {
            console.error('Error deleting team:', error)
            toast.error('Failed to delete team')
            throw error
        }
    }

    const handleAssignTerritory = async (territoryId, teamId) => {
        try {
            await assignTerritoryToTeam(territoryId, teamId)
        } catch (error) {
            console.error('Error assigning territory:', error)
            toast.error('Failed to assign territory')
            throw error
        }
    }

    const handleRemoveTerritory = async (territoryId) => {
        try {
            await assignTerritoryToTeam(territoryId, null)
        } catch (error) {
            console.error('Error removing territory:', error)
            toast.error('Failed to remove territory')
            throw error
        }
    }

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Loading teams...</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">👥 Teams</h2>
                    <p className="text-sm text-muted-foreground">Manage teams ({teams.length})</p>
                </div>
                <Button onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team
                </Button>
            </div>

            {/* Teams Grid */}
            {teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <AdminTeamCard
                            key={team.id}
                            team={team}
                            territories={territories}
                            systemConfig={config}
                            onClick={() => handleCardClick(team)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No teams yet. Click "Add Team" to create one.
                </p>
            )}

            {/* Modal */}
            <TeamModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                team={selectedTeam}
                allTeams={teams}
                allTerritories={territories}
                locationsMap={locationsMap}
                systemConfig={config}
                onSave={handleSave}
                onDelete={handleDelete}
                onAssignTerritory={handleAssignTerritory}
                onRemoveTerritory={handleRemoveTerritory}
            />
        </div>
    )
}
