import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw } from 'lucide-react'

/**
 * TimerTab - Timer display and controls (shared or split mode)
 * 
 * @param {Object} props
 * @param {Object} props.territory - Territory data with live_state and game_info
 * @param {'attacker' | 'defender' | 'spectator'} props.role - Current user's role
 * @param {Function} props.onStartSharedTimer
 * @param {Function} props.onPauseSharedTimer
 * @param {Function} props.onResetSharedTimer
 * @param {Function} props.onStartSplitTimer - (role) => void
 * @param {Function} props.onPauseSplitTimer - (role, elapsed) => void
 * @param {Function} props.onVictory - (winner) => void
 */
export function TimerTab({
    territory,
    role,
    onStartSharedTimer,
    onPauseSharedTimer,
    onResetSharedTimer,
    onStartSplitTimer,
    onPauseSplitTimer,
    onVictory
}) {
    const gameInfo = territory?.game_info
    const liveState = territory?.live_state
    const timerMode = gameInfo?.timer_mode || 'shared'
    const targetSeconds = gameInfo?.timer_duration_seconds || 100

    // Shared timer state
    const [sharedElapsed, setSharedElapsed] = useState(0)

    // Split timer states
    const [attackerElapsed, setAttackerElapsed] = useState(0)
    const [defenderElapsed, setDefenderElapsed] = useState(0)

    // Shared timer calculation
    useEffect(() => {
        if (timerMode !== 'shared') return

        const storedElapsed = liveState?.shared_elapsed_seconds || 0
        const timerStarted = liveState?.timer_started_at

        if (!timerStarted) {
            setSharedElapsed(storedElapsed)
            return
        }

        const interval = setInterval(() => {
            const startTime = timerStarted?.toDate?.() || new Date(timerStarted)
            const runningElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            setSharedElapsed(storedElapsed + runningElapsed)
        }, 100)

        return () => clearInterval(interval)
    }, [liveState?.timer_started_at, liveState?.shared_elapsed_seconds, timerMode])

    // Split timer calculation - Attacker
    useEffect(() => {
        if (timerMode !== 'split') return

        const storedElapsed = liveState?.attacker_elapsed_seconds || 0
        const timerStarted = liveState?.attacker_timer_started_at

        if (!timerStarted) {
            setAttackerElapsed(storedElapsed)
            return
        }

        const interval = setInterval(() => {
            const startTime = timerStarted?.toDate?.() || new Date(timerStarted)
            const runningElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const total = storedElapsed + runningElapsed
            setAttackerElapsed(total)

            // Check victory
            if (total >= targetSeconds && onVictory) {
                onVictory('attacker')
            }
        }, 100)

        return () => clearInterval(interval)
    }, [liveState?.attacker_timer_started_at, liveState?.attacker_elapsed_seconds, timerMode, targetSeconds, onVictory])

    // Split timer calculation - Defender
    useEffect(() => {
        if (timerMode !== 'split') return

        const storedElapsed = liveState?.defender_elapsed_seconds || 0
        const timerStarted = liveState?.defender_timer_started_at

        if (!timerStarted) {
            setDefenderElapsed(storedElapsed)
            return
        }

        const interval = setInterval(() => {
            const startTime = timerStarted?.toDate?.() || new Date(timerStarted)
            const runningElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            const total = storedElapsed + runningElapsed
            setDefenderElapsed(total)

            // Check victory
            if (total >= targetSeconds && onVictory) {
                onVictory('defender')
            }
        }, 100)

        return () => clearInterval(interval)
    }, [liveState?.defender_timer_started_at, liveState?.defender_elapsed_seconds, timerMode, targetSeconds, onVictory])

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const isSharedRunning = !!liveState?.timer_started_at
    const isAttackerRunning = !!liveState?.attacker_timer_started_at
    const isDefenderRunning = !!liveState?.defender_timer_started_at

    if (timerMode === 'shared') {
        return (
            <div className="p-4">
                <Card>
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Timer</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-6xl font-mono font-bold mb-6">
                            {formatTime(sharedElapsed)}
                        </p>

                        {role !== 'spectator' && (
                            <div className="flex gap-2 justify-center">
                                {!isSharedRunning ? (
                                    <Button onClick={onStartSharedTimer} className="gap-2">
                                        <Play className="h-4 w-4" />
                                        Start
                                    </Button>
                                ) : (
                                    <Button onClick={() => onPauseSharedTimer(sharedElapsed)} variant="secondary" className="gap-2">
                                        <Pause className="h-4 w-4" />
                                        Pause
                                    </Button>
                                )}
                                <Button onClick={onResetSharedTimer} variant="outline" className="gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Split Timer Mode
    const attackerName = territory?.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory?.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    return (
        <div className="p-4 space-y-4">
            {/* Target info */}
            <p className="text-center text-sm text-muted-foreground">
                First to {targetSeconds} seconds wins!
            </p>

            {/* Attacker Timer */}
            <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-sm text-red-500">⚔️ {attackerName}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-mono font-bold mb-4">
                        {formatTime(attackerElapsed)}
                    </p>

                    {role === 'attacker' && (
                        <div className="flex gap-2 justify-center">
                            {!isAttackerRunning ? (
                                <Button
                                    onClick={() => onStartSplitTimer('attacker')}
                                    className="gap-2 bg-red-500 hover:bg-red-600"
                                >
                                    <Play className="h-4 w-4" />
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => onPauseSplitTimer('attacker', attackerElapsed)}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    <Pause className="h-4 w-4" />
                                    Pause
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Defender Timer */}
            <Card className="border-blue-500/50 bg-blue-500/5">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-sm text-blue-500">🛡️ {defenderName}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-mono font-bold mb-4">
                        {formatTime(defenderElapsed)}
                    </p>

                    {role === 'defender' && (
                        <div className="flex gap-2 justify-center">
                            {!isDefenderRunning ? (
                                <Button
                                    onClick={() => onStartSplitTimer('defender')}
                                    className="gap-2 bg-blue-500 hover:bg-blue-600"
                                >
                                    <Play className="h-4 w-4" />
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => onPauseSplitTimer('defender', defenderElapsed)}
                                    variant="secondary"
                                    className="gap-2"
                                >
                                    <Pause className="h-4 w-4" />
                                    Pause
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
