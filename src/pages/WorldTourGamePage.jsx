import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { subscribeToWorldTourGame } from '@/services/gameService'
import { getAcceptedChallenge } from '@/services/challengeService'
import { evaluateScoreFormula } from '@/lib/formulaEvaluator'
import { useAuth } from '@/contexts/AuthProvider'
import { useLocations } from '@/hooks/useLocations'
import { useWorldTourHost } from '@/hooks/useWorldTourHost'
import { useTeamData } from '@/hooks/useTeamData'
import { useTeams } from '@/hooks/useTeams'
import { useRank } from '@/hooks/useRank'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Loader2, MapPin, Play, Square, Trophy, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

// Tab components
import { RulesTab } from '@/components/game/RulesTab'
import { WorldTourToolTab } from '@/components/game/WorldTourToolTab'

// World Tour specific components
import { LeaderboardModal } from '@/components/game/LeaderboardModal'
import { DifficultyModal } from '@/components/game/DifficultyModal'
import { WorldTourResultModal } from '@/components/game/WorldTourResultModal'
import { RedirectToChallengeModal } from '@/components/game/RedirectToChallengeModal'
import { RankNotification } from '@/components/game/RankNotification'

/**
 * WorldTourGamePage - Single-player World Tour Game Host Mode
 * Features difficulty selection, tabs, score calculation, and leaderboard
 */
export default function WorldTourGamePage() {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const { teamId } = useAuth()
    const { team } = useTeamData(teamId)
    const [game, setGame] = useState(null)
    const [loading, setLoading] = useState(true)

    // Modal states
    const [leaderboardOpen, setLeaderboardOpen] = useState(false)
    const [difficultyModalOpen, setDifficultyModalOpen] = useState(false)
    const [endGameConfirmOpen, setEndGameConfirmOpen] = useState(false)
    const [resultModalOpen, setResultModalOpen] = useState(false)
    const [gameResult, setGameResult] = useState(null)
    const [acceptedChallenge, setAcceptedChallenge] = useState(null)
    const [redirectModalOpen, setRedirectModalOpen] = useState(false)

    // Locations for display
    const { locationsMap } = useLocations()

    // All teams for leaderboard display
    const { teamsMap } = useTeams()

    // Game host controls
    const worldTourHost = useWorldTourHost(gameId)

    // Rank tracking for notifications
    const { rank, isLivingIcon, loading: rankLoading } = useRank(teamId)

    console.log('[WorldTourGamePage] Mounted with gameId:', gameId)

    // Subscribe to game data
    useEffect(() => {
        if (!gameId) return

        const unsubscribe = subscribeToWorldTourGame(
            gameId,
            (data) => {
                setGame(data)
                setLoading(false)
            },
            (err) => {
                console.error('[WorldTourGamePage] Error:', err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [gameId])

    // Game state
    const liveState = game?.live_state || {}
    const gameInfo = game?.game_info || {}
    const isPlaying = liveState.game_started && game?.current_team_id === teamId
    const isOtherTeamPlaying = game?.current_team_id && game?.current_team_id !== teamId

    // Block navigation when game is active
    const shouldBlock = isPlaying

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            shouldBlock && currentLocation.pathname !== nextLocation.pathname
    )

    // Handle blocker
    useEffect(() => {
        if (blocker.state === 'blocked') {
            toast.error('Cannot exit during active game')
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

    // Handle "Start Game" button - opens difficulty modal
    const handleStartGameClick = () => {
        setDifficultyModalOpen(true)
    }

    // Handle difficulty selection
    const handleDifficultySelect = async (difficulty) => {
        try {
            await worldTourHost.startGame(teamId, difficulty)
            toast.success(`Game started on ${difficulty.toUpperCase()} mode!`)
        } catch (err) {
            console.error('[WorldTourGamePage] Failed to start game:', err)
            toast.error('Failed to start game')
        }
    }

    // Handle "End Game" button - opens confirmation
    const handleEndGameClick = () => {
        setEndGameConfirmOpen(true)
    }

    // Handle end game confirmation
    const handleEndGameConfirm = async () => {
        setEndGameConfirmOpen(false)

        try {
            const baseScore = liveState.score || 0
            const difficulty = liveState.difficulty || 'normal'
            const multiplier = game?.multiplier_config?.[difficulty] || 1

            // Apply formula preprocessing
            const formula = game?.game_info?.score_formula || ''
            const { result: preprocessedScore, error: formulaError } = evaluateScoreFormula(formula, baseScore)

            if (formulaError) {
                console.warn('[WorldTourGamePage] Formula error, using raw score:', formulaError)
            }

            const finalScore = Math.floor(preprocessedScore * multiplier)

            // Followers gained = final score (1:1 ratio)
            const followersGained = finalScore

            const isNewHighScore = finalScore > (game?.high_score || 0)

            // Calculate rank: count attempts with higher scores + 1
            const currentAttempts = game?.attempts || []
            const rank = currentAttempts.filter(a => a.score > finalScore).length + 1

            // Get location details
            const location = locationsMap[game?.location_id]
            const locationName = location?.name || game?.name || 'Unknown Location'
            const locationEmoji = location?.emoji || game?.country_emoji || ''

            // Submit score and end game
            await worldTourHost.submitScore(finalScore, teamId, difficulty, followersGained)

            // Prepare result for modal
            setGameResult({
                baseScore,
                preprocessedScore,
                hasFormula: !!formula.trim(),
                difficulty,
                multiplier,
                finalScore,
                followersGained,
                isNewHighScore,
                isFanFavourite: isNewHighScore,
                rank,
                locationName,
                locationEmoji,
                gameName: game?.name
            })

            setResultModalOpen(true)
        } catch (err) {
            console.error('[WorldTourGamePage] Failed to end game:', err)
            toast.error('Failed to end game')
        }
    }

    // Handle result modal close - check for pending challenge or navigate to dashboard
    const handleResultClose = async () => {
        setResultModalOpen(false)

        // Check if there's an accepted challenge waiting
        const pendingChallenge = await getAcceptedChallenge(teamId)
        if (pendingChallenge) {
            setAcceptedChallenge(pendingChallenge)
            setRedirectModalOpen(true)
        } else {
            navigate('/dashboard', { replace: true })
        }
    }

    // Difficulty badge colors
    const difficultyColors = {
        normal: 'bg-green-500',
        hard: 'bg-orange-500',
        extreme: 'bg-red-500'
    }

    const difficultyEmojis = {
        normal: '🌱',
        hard: '🔥',
        extreme: '💀'
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!game) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Game not found</p>
            </div>
        )
    }

    const locationName = locationsMap[game.location_id]?.name || game.name

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Rank Change Notification Banner */}
            <RankNotification mode="banner" rank={rank} isLivingIcon={isLivingIcon} loading={rankLoading} />

            {/* Hero Header */}
            <div className="relative">
                {/* Hero Image */}
                {locationsMap[game.location_id]?.image_url ? (
                    <img
                        src={locationsMap[game.location_id].image_url}
                        alt={game.name}
                        className="w-full h-40 object-cover"
                    />
                ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-primary/50" />
                    </div>
                )}

                {/* Back Button Overlay - hidden when playing */}
                {!isPlaying && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 left-3"
                        onClick={() => navigate('/world-tour')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Title & Status */}
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold">
                    {locationsMap[game.location_id]?.emoji && `${locationsMap[game.location_id].emoji} `}
                    {locationName}
                </h1>
                <p className="text-sm text-muted-foreground mb-3">{game.name}</p>

                {/* High Score & Global Charts (when not playing) */}
                {!isPlaying && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <span className="text-sm font-medium">High Score</span>
                            </div>
                            <span className="text-lg font-bold">{game.high_score || 0}</span>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setLeaderboardOpen(true)}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Global Charts
                        </Button>

                        {isOtherTeamPlaying && (
                            <p className="text-center text-sm text-muted-foreground">
                                Another team is currently playing...
                            </p>
                        )}
                    </div>
                )}

                {/* Difficulty Badge (when playing) */}
                {isPlaying && liveState.difficulty && (
                    <div className="flex items-center justify-center">
                        <Badge className={`${difficultyColors[liveState.difficulty]} text-white text-lg px-4 py-2`}>
                            {difficultyEmojis[liveState.difficulty]} {liveState.difficulty.toUpperCase()} ({game?.multiplier_config?.[liveState.difficulty] || 1}x)
                        </Badge>
                    </div>
                )}
            </div>

            {/* Tabs Content */}
            <div className="flex-1">
                {!isPlaying ? (
                    // Not playing - Rules only
                    <RulesTab gameInfo={gameInfo} />
                ) : (
                    // Playing - Rules + Tool tabs
                    <Tabs defaultValue="tool" className="w-full h-full flex flex-col">
                        <TabsList className="flex w-auto mx-4 my-2">
                            <TabsTrigger value="rules">
                                Rules
                            </TabsTrigger>
                            {(gameInfo.has_scoreboard || gameInfo.has_timer) && (
                                <TabsTrigger value="tool">
                                    Tool
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="rules" className="mt-0">
                            <RulesTab gameInfo={gameInfo} />
                        </TabsContent>

                        {(gameInfo.has_scoreboard || gameInfo.has_timer) && (
                            <TabsContent value="tool" className="mt-0 flex-1">
                                <WorldTourToolTab
                                    game={game}
                                    host={worldTourHost}
                                    teamColor={team?.color}
                                    teamName={team?.name?.toUpperCase() || 'PLAYER'}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 p-4 border-t bg-background">
                {!isPlaying ? (
                    <Button
                        className="w-full"
                        onClick={handleStartGameClick}
                        disabled={isOtherTeamPlaying}
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Start Game
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleEndGameClick}
                    >
                        <Square className="mr-2 h-4 w-4" />
                        End Game
                    </Button>
                )}
            </div>

            {/* Difficulty Selection Modal */}
            <DifficultyModal
                open={difficultyModalOpen}
                onOpenChange={setDifficultyModalOpen}
                multiplierConfig={game?.multiplier_config}
                onSelect={handleDifficultySelect}
            />

            {/* End Game Confirmation */}
            <Dialog open={endGameConfirmOpen} onOpenChange={setEndGameConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>End Game?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to end the game? Your score will be submitted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEndGameConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEndGameConfirm}>
                            Yes, End Game
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Result Modal */}
            <WorldTourResultModal
                open={resultModalOpen}
                onOpenChange={setResultModalOpen}
                result={gameResult}
                onClose={handleResultClose}
            />

            {/* Leaderboard Modal */}
            <LeaderboardModal
                open={leaderboardOpen}
                onOpenChange={setLeaderboardOpen}
                attempts={game?.attempts || []}
                gameName={game?.name}
                teamsMap={teamsMap}
            />

            {/* Redirect to Challenge Modal */}
            <RedirectToChallengeModal
                open={redirectModalOpen}
                territory={acceptedChallenge}
            />
        </div>
    )
}
