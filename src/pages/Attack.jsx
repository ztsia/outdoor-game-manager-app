import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useGameData } from '@/hooks/useGameData'
import { useTeamData } from '@/hooks/useTeamData'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useAttackTransaction } from '@/hooks/useAttackTransaction'
import { getGameRules } from '@/services/challengeService'
import { Button } from '@/components/ui/button'
import { GameCard } from '@/components/game/GameCard'
import { AttackChallengeModal } from '@/components/game/AttackChallengeModal'
import { getTerritoryStatus } from '@/lib/territoryStatus'
import { formatNumber } from '@/lib/formatters'
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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading territories...</p>
            </div>
        )
    }

    // Sort territories by name
    const sortedTerritories = [...territories].sort((a, b) =>
        a.name.localeCompare(b.name)
    )

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

            {/* Territory List */}
            <div className="p-4 space-y-3">
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
