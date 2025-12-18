import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useGameData } from '@/hooks/useGameData'
import { useTeamData } from '@/hooks/useTeamData'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useAttackTransaction } from '@/hooks/useAttackTransaction'
import { getGameRules } from '@/services/challengeService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameCard } from '@/components/game/GameCard'
import { AttackChallengeModal } from '@/components/game/AttackChallengeModal'
import { getTerritoryStatus } from '@/lib/territoryStatus'
import { formatNumber } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'


export default function Attack() {
    const { teamId } = useAuth()
    const { territories, defendingTeams, loading: territoriesLoading } = useGameData()
    const { team, loading: teamLoading } = useTeamData(teamId)
    const { teamsMap, loading: teamsLoading } = useAllTeams()
    const { starCosts, calculateCost, initiateAttack, loading: attackLoading } = useAttackTransaction()
    const navigate = useNavigate()

    // Modal state
    const [selectedTerritory, setSelectedTerritory] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    // Filter and sort state
    const [filterTeams, setFilterTeams] = useState([]) // Array of teamIds
    const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'

    // Real-time ticker state - use lazy initializer to avoid purity issues
    const [now, setNow] = useState(() => Date.now())
    const [challengeTimeout, setChallengeTimeout] = useState(120)

    const loading = territoriesLoading || teamLoading || teamsLoading

    // Fetch game rules for timeout duration
    useEffect(() => {
        getGameRules().then(rules => {
            setChallengeTimeout(rules.challengeTimeoutSeconds || 120)
        })
    }, [])

    // Local ticker - updates every second for real-time countdowns
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Check if user already has a pending outgoing challenge
    const activeOutgoingChallenge = territories.find(t =>
        t.current_attacker_id === teamId &&
        t.challenge_status === 'requesting'
    )

    // Redirect to waiting page if user has pending challenge
    useEffect(() => {
        if (activeOutgoingChallenge) {
            console.log('[Attack] User has pending challenge, redirecting to waiting page...')
            navigate(`/waiting/${activeOutgoingChallenge.id}`, { replace: true })
        }
    }, [activeOutgoingChallenge, navigate])

    // Handle territory selection
    const handleSelectTerritory = (territory) => {
        setSelectedTerritory(territory)
        setModalOpen(true)
    }

    // Handle attack confirmation
    const handleConfirmAttack = async () => {
        if (!selectedTerritory || !teamId) return

        const cost = calculateCost(selectedTerritory.stars)
        const result = await initiateAttack(selectedTerritory.id, teamId, cost)

        if (result.success) {
            toast.success(`Challenge sent to ${selectedTerritory.name}!`)
            setModalOpen(false)
            // Navigate to waiting page - uses URL params instead of local state
            navigate(`/waiting/${selectedTerritory.id}`)
        } else {
            toast.error(result.error || 'Failed to initiate attack')
        }
    }

    // Calculate cost for selected territory
    const attackCost = selectedTerritory ? calculateCost(selectedTerritory.stars) : 0

    // Helper: hex to RGB
    const hexToRgb = (hexColor) => {
        if (!hexColor) return { r: 107, g: 114, b: 128 }
        const hex = hexColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return { r, g, b }
    }

    // Toggle team in filter
    const toggleTeamFilter = (teamId) => {
        setFilterTeams(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading territories...</p>
            </div>
        )
    }

    // Filter and sort territories
    const filteredTerritories = territories.filter(t => {
        if (filterTeams.length === 0) return true
        return filterTeams.includes(t.owner_id)
    })

    const sortedTerritories = [...filteredTerritories].sort((a, b) => {
        if (sortOrder === 'desc') {
            return b.stars - a.stars
        }
        return a.stars - b.stars
    })

    return (
        <div className="min-h-screen bg-background pb-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b p-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Attack Territory</h1>
                        <p className="text-sm text-muted-foreground">
                            Balance: {team ? formatNumber(team.followers) : '...'} followers
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col gap-4 p-4 pb-0">
                {/* Sort Section */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Sort:</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="shrink-0"
                    >
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        Stars
                        {sortOrder === 'desc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />}
                    </Button>
                </div>

                {/* Filter Section */}
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Filter by Team:</span>
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "cursor-pointer",
                                filterTeams.length === 0 && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => setFilterTeams([])}
                        >
                            All
                        </Badge>
                        {Object.values(teamsMap).map(tm => {
                            const isSelected = filterTeams.includes(tm.id)
                            const { r, g, b } = hexToRgb(tm.color)
                            return (
                                <Badge
                                    key={tm.id}
                                    variant="outline"
                                    className={cn("cursor-pointer transition-all", isSelected ? "border-2 font-bold shadow-sm" : "border opacity-80")}
                                    style={isSelected
                                        ? { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.20)`, borderColor: tm.color, color: tm.color }
                                        : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
                                    }
                                    onClick={() => toggleTeamFilter(tm.id)}
                                >
                                    {tm.name}
                                </Badge>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Territory List */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTerritories.map((territory) => {
                    const status = getTerritoryStatus(territory, teamId, defendingTeams, now, challengeTimeout)
                    const ownerTeam = teamsMap[territory.owner_id]

                    return (
                        <GameCard
                            key={territory.id}
                            territory={territory}
                            status={status}
                            ownerTeam={ownerTeam}
                            onAction={() => handleSelectTerritory(territory)}
                        />
                    )
                })}
            </div>

            {/* Attack Confirmation Modal */}
            <AttackChallengeModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                territory={selectedTerritory}
                ownerTeam={teamsMap[selectedTerritory?.owner_id]}
                team={team}
                attackCost={attackCost}
                starCosts={starCosts}
                loading={attackLoading}
                onConfirm={handleConfirmAttack}
            />
        </div>
    )
}
