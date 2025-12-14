import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Shield, Clock, Home, Star, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useGameData } from '@/hooks/useGameData'
import { useTeamData } from '@/hooks/useTeamData'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useAttackTransaction } from '@/hooks/useAttackTransaction'
import { getGameRules } from '@/services/challengeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// Territory status calculation with real-time support
function getTerritoryStatus(territory, myTeamId, defendingTeams, now, challengeTimeout) {
    // Own territory - can't attack yourself
    if (territory.owner_id === myTeamId) {
        return {
            disabled: true,
            reason: 'owned',
            badge: { icon: Home, text: 'YOUR TERRITORY', variant: 'secondary' }
        }
    }

    // Currently under challenge or attack
    if (territory.challenge_status !== 'idle') {
        let statusText = territory.challenge_status === 'requesting' ? 'AWAITING RESPONSE' : 'BATTLE IN PROGRESS'

        // Add countdown for requesting status
        if (territory.challenge_status === 'requesting' && territory.challenged_at) {
            const challengedAt = territory.challenged_at.toDate?.() || new Date(territory.challenged_at)
            const expiresAt = new Date(challengedAt.getTime() + challengeTimeout * 1000)
            const remainingMs = expiresAt - now

            if (remainingMs > 0) {
                const remainingSecs = Math.ceil(remainingMs / 1000)
                const mins = Math.floor(remainingSecs / 60)
                const secs = remainingSecs % 60
                statusText = `AWAITING (${mins}:${secs.toString().padStart(2, '0')})`
            } else {
                statusText = 'TIMED OUT'
            }
        }

        return {
            disabled: true,
            reason: 'battle',
            badge: { icon: Swords, text: statusText, variant: 'destructive' }
        }
    }

    // On cooldown
    if (territory.cooldown_ends_at) {
        const cooldownEnd = territory.cooldown_ends_at.toDate?.() || territory.cooldown_ends_at
        const cooldownEndMs = typeof cooldownEnd === 'number' ? cooldownEnd : cooldownEnd.getTime()

        if (cooldownEndMs > now) {
            const remainingMs = cooldownEndMs - now
            const remainingSecs = Math.ceil(remainingMs / 1000)
            const mins = Math.floor(remainingSecs / 60)
            const secs = remainingSecs % 60
            return {
                disabled: true,
                reason: 'cooldown',
                badge: { icon: Clock, text: `COOLDOWN (${mins}:${secs.toString().padStart(2, '0')})`, variant: 'outline' }
            }
        }
    }

    // Team defense lock - owner is defending elsewhere
    if (defendingTeams.has(territory.owner_id)) {
        return {
            disabled: true,
            reason: 'defense_lock',
            badge: { icon: Shield, text: 'DEFENDING ELSEWHERE', variant: 'outline' }
        }
    }

    // Available for attack
    return { disabled: false, reason: null, badge: null }
}


// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
}

export default function Attack() {
    const { teamId } = useAuth()
    const { territories, defendingTeams, loading: territoriesLoading } = useGameData()
    const { team, loading: teamLoading } = useTeamData(teamId)
    const { teamsMap, loading: teamsLoading } = useAllTeams()
    const { starValue, calculateCost, initiateAttack, loading: attackLoading } = useAttackTransaction()
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
    const hasEnoughFunds = team ? team.followers >= attackCost : false

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
                        <Card
                            key={territory.id}
                            className={`overflow-hidden transition-opacity ${status.disabled ? 'opacity-50' : 'cursor-pointer hover:shadow-md'
                                }`}
                            onClick={() => {
                                if (!status.disabled) {
                                    handleSelectTerritory(territory)
                                }
                            }}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    {/* Territory Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{territory.name}</h3>
                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="text-sm font-bold">{territory.stars}</span>
                                            </div>
                                        </div>

                                        {/* Owner Badge */}
                                        <div className="mt-1">
                                            <TeamChip
                                                name={ownerTeam?.name}
                                                color={ownerTeam?.color}
                                            />
                                        </div>

                                        {/* Game Title */}
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {territory.game_info?.title || 'Unknown Game'}
                                        </p>
                                    </div>

                                    {/* Status Badge or Attack Icon */}
                                    <div className="shrink-0">
                                        {status.badge ? (
                                            <Badge variant={status.badge.variant} className="gap-1">
                                                <status.badge.icon className="h-3 w-3" />
                                                <span className="text-xs">{status.badge.text}</span>
                                            </Badge>
                                        ) : (
                                            <Button size="sm" className="gap-1">
                                                <Swords className="h-4 w-4" />
                                                ATTACK
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Attack Confirmation Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5" />
                            Challenge {selectedTerritory?.name}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2">
                            Owned by <TeamChip
                                name={teamsMap[selectedTerritory?.owner_id]?.name}
                                color={teamsMap[selectedTerritory?.owner_id]?.color}
                            />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Cost Calculation */}
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Battle Cost:</span>
                                <span className="font-mono">
                                    {selectedTerritory?.stars} ⭐ × {formatNumber(starValue)} = <strong>{formatNumber(attackCost)}</strong>
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Your Balance:</span>
                                <span className={`font-mono font-bold ${hasEnoughFunds ? 'text-green-500' : 'text-red-500'}`}>
                                    {team ? formatNumber(team.followers) : '...'} followers
                                </span>
                            </div>
                            <hr className="border-border" />
                            <div className="flex justify-between text-sm">
                                <span>Remaining (if you lose):</span>
                                <span className={`font-mono font-bold ${hasEnoughFunds ? '' : 'text-red-500'}`}>
                                    {team ? formatNumber(Math.max(0, team.followers - attackCost)) : '...'} followers
                                </span>
                            </div>
                        </div>

                        {/* Bet Return Note */}
                        <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                            <span className="text-lg">ℹ️</span>
                            <p className="text-sm">
                                This cost is placed as a <strong>bet</strong>. If you <strong>win</strong> the battle, it will be fully refunded!
                            </p>
                        </div>

                        {/* Insufficient Funds Warning */}
                        {!hasEnoughFunds && (
                            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium">Insufficient Followers</p>
                                    <p className="text-destructive/80">
                                        You need {formatNumber(attackCost - (team?.followers || 0))} more followers.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Game Info */}
                        <div className="text-sm text-muted-foreground">
                            <p><strong>Game:</strong> {selectedTerritory?.game_info?.title}</p>
                            <p><strong>Win Condition:</strong> {selectedTerritory?.game_info?.win_condition}</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmAttack}
                            disabled={!hasEnoughFunds || attackLoading}
                            className="gap-1"
                        >
                            {attackLoading ? 'Processing...' : 'CONFIRM & LOCK'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
