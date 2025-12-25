import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Play, Pause, RotateCcw } from 'lucide-react'

/**
 * TimerTab - Timer display and controls (stopwatch, countdown, or split mode)
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
    attackerColor,
    defenderColor,
    onStartSharedTimer,
    onPauseSharedTimer,
    onResetSharedTimer,
    onSetCountdownDuration,
    onStartSplitTimer,
    onPauseSplitTimer,
    onVictory
}) {
    const gameInfo = territory?.game_info
    const liveState = territory?.live_state
    const timerMode = gameInfo?.timer_mode || 'stopwatch'
    const targetSeconds = gameInfo?.timer_duration_seconds || 100

    // Helper to parse hex color to RGB for transparent background
    const hexToRgba = (hexColor, alpha = 0.1) => {
        if (!hexColor) return `rgba(107, 114, 128, ${alpha})`
        const hex = hexColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    // Shared timer state
    const [sharedElapsed, setSharedElapsed] = useState(0)

    // Split timer states
    const [attackerElapsed, setAttackerElapsed] = useState(0)
    const [defenderElapsed, setDefenderElapsed] = useState(0)

    // Stopwatch/Countdown timer calculation (shared mechanism)
    useEffect(() => {
        if (timerMode !== 'stopwatch' && timerMode !== 'countdown') return

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

    // Local state for countdown duration input
    const [durationInput, setDurationInput] = useState('')
    const countdownDuration = liveState?.countdown_duration || 0
    const countdownRemaining = Math.max(0, countdownDuration - sharedElapsed)

    // Stopwatch Mode (count up)
    if (timerMode === 'stopwatch') {
        return (
            <div className="p-4">
                <Card>
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Stopwatch</CardTitle>
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

    // Countdown Mode (count down from set duration)
    if (timerMode === 'countdown') {
        const hasStarted = sharedElapsed > 0 || isSharedRunning
        const isFinished = countdownDuration > 0 && countdownRemaining <= 0

        const handleSetDuration = () => {
            const seconds = parseInt(durationInput, 10)
            if (!isNaN(seconds) && seconds > 0 && onSetCountdownDuration) {
                onSetCountdownDuration(seconds)
                setDurationInput('')
            }
        }

        return (
            <div className="p-4">
                <Card>
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Countdown</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        {/* Duration Setup (only when not started and no duration) */}
                        {!hasStarted && countdownDuration === 0 && role !== 'spectator' && (
                            <div className="space-y-3 mb-4">
                                <p className="text-sm text-muted-foreground">Set timer duration (seconds)</p>
                                <div className="flex gap-2 justify-center">
                                    <Input
                                        type="number"
                                        placeholder="e.g. 60"
                                        value={durationInput}
                                        onChange={(e) => setDurationInput(e.target.value)}
                                        className="w-24 text-center"
                                    />
                                    <Button onClick={handleSetDuration}>
                                        Set
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Timer Display */}
                        <p className={`text-6xl font-mono font-bold mb-6 ${isFinished ? 'text-destructive' : ''}`}>
                            {formatTime(countdownRemaining)}
                        </p>

                        {/* Show set duration info */}
                        {countdownDuration > 0 && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Duration: {formatTime(countdownDuration)}
                            </p>
                        )}

                        {/* Controls */}
                        {role !== 'spectator' && countdownDuration > 0 && (
                            <div className="flex gap-2 justify-center">
                                {!isSharedRunning ? (
                                    <Button onClick={onStartSharedTimer} className="gap-2" disabled={isFinished}>
                                        <Play className="h-4 w-4" />
                                        {hasStarted ? 'Resume' : 'Start'}
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
            <Card
                className="border"
                style={{
                    borderColor: attackerColor ? hexToRgba(attackerColor, 0.5) : 'rgba(239, 68, 68, 0.5)',
                    backgroundColor: attackerColor ? hexToRgba(attackerColor, 0.05) : 'rgba(239, 68, 68, 0.05)'
                }}
            >
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-sm" style={{ color: attackerColor || '#EF4444' }}>
                        ⚔️ {attackerName}
                    </CardTitle>
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
                                    className="gap-2"
                                    style={{ backgroundColor: attackerColor || '#EF4444' }}
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
            <Card
                className="border"
                style={{
                    borderColor: defenderColor ? hexToRgba(defenderColor, 0.5) : 'rgba(59, 130, 246, 0.5)',
                    backgroundColor: defenderColor ? hexToRgba(defenderColor, 0.05) : 'rgba(59, 130, 246, 0.05)'
                }}
            >
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-sm" style={{ color: defenderColor || '#3B82F6' }}>
                        🛡️ {defenderName}
                    </CardTitle>
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
                                    className="gap-2"
                                    style={{ backgroundColor: defenderColor || '#3B82F6' }}
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
