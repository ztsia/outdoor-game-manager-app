import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { subscribeToTerritory } from '@/services/gameService'
import { useAuth } from '@/contexts/AuthProvider'
import { useGameHost } from '@/hooks/useGameHost'
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
import { Swords, Shield, ArrowLeft, Loader2, MapPin, Play, Square, Trophy } from 'lucide-react'

// Tab components
import { RulesTab } from '@/components/game/RulesTab'
import { ScoreboardTab } from '@/components/game/ScoreboardTab'
import { TimerTab } from '@/components/game/TimerTab'

/**
 * GamePage - Game Host Mode (Distributed View)
 * Supports Battle Mode (active game) and View Mode (territory info)
 */
export default function GamePage() {
    const { territoryId } = useParams()
    const navigate = useNavigate()
    const { teamId, role: userRole } = useAuth()
    const [territory, setTerritory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [confirmEndOpen, setConfirmEndOpen] = useState(false)
    const [victoryWinner, setVictoryWinner] = useState(null)

    // Game host controls
    const gameHost = useGameHost(territoryId)

    console.log('[GamePage] Mounted with territoryId:', territoryId)

    useEffect(() => {
        if (!territoryId) return

        const unsubscribe = subscribeToTerritory(
            territoryId,
            (territoryData) => {
                setTerritory(territoryData)
                setLoading(false)
            },
            (err) => {
                console.error('[GamePage] Error:', err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [territoryId])

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

    // Role detection
    const isAttacker = territory.current_attacker_id === teamId
    const isDefender = territory.owner_id === teamId
    const role = isAttacker ? 'attacker' : isDefender ? 'defender' : 'spectator'

    // Game state
    const gameStarted = territory.live_state?.game_started || false
    const gameInfo = territory.game_info || {}

    // Names
    const attackerName = territory.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    // Handle victory
    const handleVictory = (winner) => {
        if (!victoryWinner) {
            setVictoryWinner(winner)
        }
    }

    // Handle end game confirmation
    const handleEndGame = (winner) => {
        setConfirmEndOpen(false)
        gameHost.endGame(winner)
        navigate('/dashboard', { replace: true })
    }

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

                {/* Back Button Overlay */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 left-3"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </div>

            {/* Title & Status Banner */}
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold">{gameInfo.title || territory.name}</h1>
                <p className="text-sm text-muted-foreground mb-3">{territory.name}</p>

                {/* Status Banner */}
                {isBattleMode ? (
                    <Badge
                        className={`w-full justify-center py-2 text-sm ${isAttacker
                                ? 'bg-red-500 hover:bg-red-500'
                                : isDefender
                                    ? 'bg-blue-500 hover:bg-blue-500'
                                    : 'bg-gray-500 hover:bg-gray-500'
                            }`}
                    >
                        {isAttacker && <Swords className="mr-2 h-4 w-4" />}
                        {isDefender && <Shield className="mr-2 h-4 w-4" />}
                        {isAttacker
                            ? `⚔️ ATTACKING ${territory.name}`
                            : isDefender
                                ? `🛡️ DEFENDING ${territory.name}`
                                : '👁️ SPECTATING'
                        }
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="w-full justify-center py-2 text-sm">
                        <MapPin className="mr-2 h-4 w-4" />
                        📍 YOUR TERRITORY
                    </Badge>
                )}
            </div>

            {/* Tabs Content */}
            <div className="flex-1">
                {isViewMode ? (
                    // View Mode - Rules only
                    <RulesTab gameInfo={gameInfo} />
                ) : (
                    // Battle Mode - All tabs
                    <Tabs defaultValue="rules" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
                            <TabsTrigger
                                value="rules"
                                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                            >
                                Rules
                            </TabsTrigger>
                            {gameStarted && gameInfo.has_scoreboard && (
                                <TabsTrigger
                                    value="scoreboard"
                                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                                >
                                    Scoreboard
                                </TabsTrigger>
                            )}
                            {gameStarted && gameInfo.has_timer && (
                                <TabsTrigger
                                    value="timer"
                                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                                >
                                    Timer
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="rules" className="mt-0">
                            <RulesTab gameInfo={gameInfo} />
                        </TabsContent>

                        {gameStarted && gameInfo.has_scoreboard && (
                            <TabsContent value="scoreboard" className="mt-0">
                                <ScoreboardTab
                                    territory={territory}
                                    role={role}
                                    onIncrement={gameHost.incrementScore}
                                    onDecrement={gameHost.decrementScore}
                                />
                            </TabsContent>
                        )}

                        {gameStarted && gameInfo.has_timer && (
                            <TabsContent value="timer" className="mt-0">
                                <TimerTab
                                    territory={territory}
                                    role={role}
                                    onStartSharedTimer={gameHost.startSharedTimer}
                                    onPauseSharedTimer={gameHost.pauseSharedTimer}
                                    onResetSharedTimer={gameHost.resetSharedTimer}
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
                                onClick={() => setConfirmEndOpen(true)}
                            >
                                <Square className="mr-2 h-4 w-4" />
                                End Game
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* End Game Confirmation Dialog */}
            <Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End Game - Who Won?</DialogTitle>
                        <DialogDescription>
                            Select the winner to resolve the battle. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            className="flex-1 bg-red-500 hover:bg-red-600"
                            onClick={() => handleEndGame('attacker')}
                        >
                            <Swords className="mr-2 h-4 w-4" />
                            {attackerName} WON
                        </Button>
                        <Button
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleEndGame('defender')}
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            {defenderName} WON
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Victory Modal */}
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
