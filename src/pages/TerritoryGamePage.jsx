import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { subscribeToTerritory, getTeam } from '@/services/gameService'
import { useAuth } from '@/contexts/AuthProvider'
import { useLocations } from '@/hooks/useLocations'
import { useGameHost } from '@/hooks/useGameHost'
import { Button } from '@/components/ui/button'
import { TeamChip } from '@/components/ui/TeamChip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Swords, Shield, ArrowLeft, Loader2, MapPin, Play, Square, Trophy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Tab components
import { RulesTab } from '@/components/game/RulesTab'
import { ScoreboardTab } from '@/components/game/ScoreboardTab'
import { TimerTab } from '@/components/game/TimerTab'

// Helper function for text contrast on colored backgrounds
function getContrastTextColor(hexColor) {
    if (!hexColor) return '#FFFFFF'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * TerritoryGamePage - PvP Game Host Mode
 * Supports Battle Mode (active game) and View Mode (territory info)
 * Includes cooperative voting for game ending
 */
export default function TerritoryGamePage() {
    const { territoryId } = useParams()
    const navigate = useNavigate()
    const { teamId } = useAuth()
    const [territory, setTerritory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [victoryWinner, setVictoryWinner] = useState(null)

    // Track if we've resolved to prevent double resolution
    const [hasResolved, setHasResolved] = useState(false)

    // Track if we're navigating away (to prevent blocker interference)
    const isNavigatingAway = useRef(false)

    // Track previous challenge status for passive game end detection
    const prevChallengeStatus = useRef(null)

    // Max stars constant
    const MAX_STARS = 3

    // Locations for display
    const { locationsMap } = useLocations()

    // Game host controls
    const gameHost = useGameHost(territoryId)

    console.log('[TerritoryGamePage] Mounted with territoryId:', territoryId)

    // Block navigation when game is active (battle mode) - but not when navigating intentionally
    const shouldBlock = territory?.challenge_status === 'accepted' && !isNavigatingAway.current

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            shouldBlock && currentLocation.pathname !== nextLocation.pathname
    )

    // Handle blocker - show toast and reset (only if not intentional navigation)
    useEffect(() => {
        if (blocker.state === 'blocked' && !isNavigatingAway.current) {
            toast.error('Cannot exit active game')
            blocker.reset()
        }
    }, [blocker])

    // Warn on tab close/refresh during active game
    useEffect(() => {
        if (!shouldBlock) return

        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [shouldBlock])

    useEffect(() => {
        if (!territoryId) return

        const unsubscribe = subscribeToTerritory(
            territoryId,
            (data) => {
                setTerritory(data)
                setLoading(false)
            },
            (err) => {
                console.error('[TerritoryGamePage] Error:', err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [territoryId])

    // Fetch team data for attacker and defender
    const [attackerTeam, setAttackerTeam] = useState(null)
    const [defenderTeam, setDefenderTeam] = useState(null)

    useEffect(() => {
        if (!territory) return

        const fetchTeams = async () => {
            const [attacker, defender] = await Promise.all([
                getTeam(territory.current_attacker_id),
                getTeam(territory.owner_id)
            ])
            setAttackerTeam(attacker)
            setDefenderTeam(defender)
        }
        fetchTeams()
    }, [territory?.current_attacker_id, territory?.owner_id])

    // Voting state from territory
    const liveState = territory?.live_state || {}
    const endGameRequested = !!liveState.end_game_requested_at
    const attackerVote = liveState.attacker_vote
    const defenderVote = liveState.defender_vote
    const voteMismatch = liveState.vote_mismatch

    // Role detection
    const isAttacker = territory?.current_attacker_id === teamId
    const isDefender = territory?.owner_id === teamId
    const role = isAttacker ? 'attacker' : isDefender ? 'defender' : 'spectator'

    // My vote
    const myVote = isAttacker ? attackerVote : isDefender ? defenderVote : null
    const opponentVote = isAttacker ? defenderVote : isDefender ? attackerVote : null

    // Check for consensus and resolve (ACTIVE resolver - one client triggers this)
    useEffect(() => {
        if (!endGameRequested || !territory || hasResolved) return

        // Both voted
        if (attackerVote && defenderVote) {
            if (attackerVote === defenderVote) {
                // CONSENSUS - Resolve the game
                const winner = attackerVote
                // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: guarded by hasResolved check
                setHasResolved(true)
                isNavigatingAway.current = true

                console.log('[TerritoryGamePage] Consensus reached! Winner:', winner)

                // Calculate result data for dashboard
                const betAmount = territory.bet_amount || 0
                const isWinner =
                    (winner === 'attacker' && isAttacker) ||
                    (winner === 'defender' && isDefender)

                const currentStars = territory.stars || 1
                const canAddStar = currentStars < MAX_STARS
                const starsAdded = isWinner && canAddStar
                const newStars = canAddStar ? currentStars + 1 : currentStars

                const resultData = {
                    winner,
                    isWinner,
                    territoryName: territory.name,
                    territoryId: territory.id || territoryId,
                    stars: newStars,
                    starsAdded,
                    betAmount,
                    attackerName: territory.current_attacker_id?.replace('team_', '').toUpperCase(),
                    defenderName: territory.owner_id?.replace('team_', '').toUpperCase(),
                    outcome: isWinner ? 'victory' : 'defeat',
                    followersChange: isWinner
                        ? betAmount
                        : isAttacker
                            ? 0
                            : 0
                }

                // Resolve the game (only one client will succeed due to Firestore)
                gameHost.resolveGame(winner, territory).then(() => {
                    navigate('/dashboard', {
                        replace: true,
                        state: { gameResult: resultData }
                    })
                })
            } else {
                // MISMATCH - Set flag to show error
                console.log('[TerritoryGamePage] Vote mismatch:', attackerVote, 'vs', defenderVote)
                gameHost.setVoteMismatch()
            }
        }
    }, [attackerVote, defenderVote, endGameRequested, territory, gameHost, navigate, isAttacker, isDefender, territoryId, hasResolved, MAX_STARS])

    // PASSIVE game end watcher - detects when another client resolved the game
    useEffect(() => {
        const currentStatus = territory?.challenge_status
        const previousStatus = prevChallengeStatus.current

        // Update ref for next comparison
        prevChallengeStatus.current = currentStatus

        // Skip if already navigating or no meaningful transition
        if (isNavigatingAway.current || hasResolved) return
        if (!territory || !teamId) return

        // Detect transition from 'accepted' to 'idle'
        if (previousStatus === 'accepted' && currentStatus === 'idle') {
            console.log('[TerritoryGamePage] Passive game end detected - another client resolved')
            isNavigatingAway.current = true

            // Determine outcome based on final state
            const finalOwnerId = territory.owner_id
            const wasAttacker = isAttacker
            const wasDefender = isDefender

            const iAmWinner = teamId === finalOwnerId
            const winner = iAmWinner ? (wasAttacker ? 'attacker' : 'defender') : (wasAttacker ? 'defender' : 'attacker')

            const betAmount = territory.bet_amount || 0
            const currentStars = territory.stars || 1

            const resultData = {
                winner,
                isWinner: iAmWinner,
                territoryName: territory.name,
                territoryId: territory.id || territoryId,
                stars: currentStars,
                starsAdded: false,
                betAmount,
                attackerName: 'ATTACKER',
                defenderName: 'DEFENDER',
                outcome: iAmWinner ? 'victory' : 'defeat',
                followersChange: iAmWinner ? betAmount : 0
            }

            navigate('/dashboard', {
                replace: true,
                state: { gameResult: resultData }
            })
        }
    }, [territory?.challenge_status, territory, teamId, isAttacker, isDefender, territoryId, navigate, hasResolved])

    // Handle "End Game" button press
    const handleRequestEndGame = () => {
        gameHost.requestEndGame(teamId)
    }

    // Handle vote submission
    const handleVote = (selection) => {
        gameHost.submitVote(role, selection)
    }

    // Handle victory from timer
    const handleVictory = (winner) => {
        if (!victoryWinner) {
            setVictoryWinner(winner)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!territory) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Territory not found</p>
            </div>
        )
    }

    // Mode detection
    const isBattleMode = territory.challenge_status === 'accepted'
    const isViewMode = !isBattleMode

    // Game state
    const gameStarted = liveState.game_started || false
    const gameInfo = territory.game_info || {}

    // Names
    const attackerName = territory.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    // Determine voting modal state
    const showVotingModal = endGameRequested && !hasResolved
    const isWaitingForOpponent = myVote && !opponentVote && !voteMismatch

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero Header */}
            <div className="relative">
                {/* Hero Image */}
                {territory.location_image_url ? (
                    <img
                        src={territory.location_image_url}
                        alt={territory.name}
                        className="w-full h-40 object-cover"
                    />
                ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-primary/50" />
                    </div>
                )}

                {/* Back Button Overlay - hidden in battle mode */}
                {!isBattleMode && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 left-3"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Title & Status Banner */}
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold">
                    {locationsMap[territory.location_id]?.name || 'Unknown Location'}
                </h1>
                <p className="text-sm text-muted-foreground mb-3">{territory.name}</p>

                {/* Battle Header */}
                {isBattleMode && attackerTeam && defenderTeam ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center">
                            <TeamChip name={attackerTeam.name} color={attackerTeam.color} className="text-sm px-3 py-1" />
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Swords className="h-3 w-3" />
                                <span>Attacker</span>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-muted-foreground">VS</span>
                        <div className="flex flex-col items-center">
                            <TeamChip name={defenderTeam.name} color={defenderTeam.color} className="text-sm px-3 py-1" />
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                <span>Defender</span>
                            </div>
                        </div>
                    </div>
                ) : isBattleMode ? (
                    <p className="text-center text-sm text-muted-foreground">Loading teams...</p>
                ) : (
                    <p className="text-center text-sm text-muted-foreground">📍 Your Territory</p>
                )}
            </div>

            {/* Tabs Content */}
            <div className="flex-1">
                {isViewMode ? (
                    // View Mode - Rules only
                    <RulesTab gameInfo={gameInfo} defenderColor={defenderTeam?.color} />
                ) : (
                    // Battle Mode - All tabs
                    <Tabs defaultValue="rules" className="w-full">
                        <TabsList className="flex w-auto mx-4 my-2">
                            <TabsTrigger value="rules">
                                Rules
                            </TabsTrigger>
                            {gameStarted && gameInfo.has_scoreboard && (
                                <TabsTrigger value="scoreboard">
                                    Scoreboard
                                </TabsTrigger>
                            )}
                            {gameStarted && gameInfo.has_timer && (
                                <TabsTrigger value="timer">
                                    Timer
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="rules" className="mt-0">
                            <RulesTab gameInfo={gameInfo} defenderColor={defenderTeam?.color} />
                        </TabsContent>

                        {gameStarted && gameInfo.has_scoreboard && (
                            <TabsContent value="scoreboard" className="mt-0">
                                <ScoreboardTab
                                    territory={territory}
                                    role={role}
                                    onIncrement={gameHost.incrementScore}
                                    onDecrement={gameHost.decrementScore}
                                    attackerColor={attackerTeam?.color}
                                    defenderColor={defenderTeam?.color}
                                />
                            </TabsContent>
                        )}

                        {gameStarted && gameInfo.has_timer && (
                            <TabsContent value="timer" className="mt-0">
                                <TimerTab
                                    territory={territory}
                                    role={role}
                                    attackerColor={attackerTeam?.color}
                                    defenderColor={defenderTeam?.color}
                                    onStartSharedTimer={gameHost.startSharedTimer}
                                    onPauseSharedTimer={gameHost.pauseSharedTimer}
                                    onResetSharedTimer={gameHost.resetSharedTimer}
                                    onSetCountdownDuration={gameHost.setCountdownDuration}
                                    onStartSplitTimer={gameHost.startSplitTimer}
                                    onPauseSplitTimer={gameHost.pauseSplitTimer}
                                    onVictory={handleVictory}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 p-4 border-t bg-background">
                {isViewMode ? (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/dashboard')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                ) : (
                    // Battle Mode footer
                    <>
                        {!gameStarted ? (
                            <Button
                                className="w-full"
                                onClick={gameHost.startGame}
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Start Game
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleRequestEndGame}
                                disabled={endGameRequested}
                            >
                                <Square className="mr-2 h-4 w-4" />
                                {endGameRequested ? 'Voting in Progress...' : 'End Game'}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Voting Modal */}
            <Dialog open={showVotingModal} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>End Game - Who Won?</DialogTitle>
                        <DialogDescription>
                            {voteMismatch ? (
                                <span className="text-destructive flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    You and your opponent selected different winners. Please try again.
                                </span>
                            ) : isWaitingForOpponent ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Waiting for opponent to vote...
                                </span>
                            ) : (
                                'Both players must agree on the winner.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {(!myVote || voteMismatch) && (
                        <DialogFooter className="flex-col gap-2 sm:flex-row">
                            <Button
                                className={`flex-1 ${myVote === 'attacker' ? 'ring-2 ring-offset-2' : ''}`}
                                style={{
                                    backgroundColor: attackerTeam?.color || '#EF4444',
                                    color: getContrastTextColor(attackerTeam?.color)
                                }}
                                onClick={() => handleVote('attacker')}
                            >
                                <Swords className="mr-2 h-4 w-4" />
                                {attackerName} WON
                            </Button>
                            <Button
                                className={`flex-1 ${myVote === 'defender' ? 'ring-2 ring-offset-2' : ''}`}
                                style={{
                                    backgroundColor: defenderTeam?.color || '#3B82F6',
                                    color: getContrastTextColor(defenderTeam?.color)
                                }}
                                onClick={() => handleVote('defender')}
                            >
                                <Shield className="mr-2 h-4 w-4" />
                                {defenderName} WON
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* Victory Modal (from timer) */}
            <Dialog open={!!victoryWinner} onOpenChange={() => setVictoryWinner(null)}>
                <DialogContent className="text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center justify-center gap-2">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                            VICTORY!
                        </DialogTitle>
                        <DialogDescription className="text-lg">
                            {victoryWinner === 'attacker' ? attackerName : defenderName} reached the time limit!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setVictoryWinner(null)} className="w-full">
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
