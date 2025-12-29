import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'

// Helper for text contrast on colored backgrounds
function getContrastColor(hexColor) {
    if (!hexColor) return '#FFFFFF'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

/**
 * TerritoryToolTab - Combined Timer + Scoreboard for Territory (PvP) games
 */
export function TerritoryToolTab({
    territory,
    role,
    attackerColor = '#EF4444',
    defenderColor = '#3B82F6',
    attackerName = 'ATTACKER',
    defenderName = 'DEFENDER',
    onStartSharedTimer,
    onPauseSharedTimer,
    onResetSharedTimer,
    onSetCountdownDuration,
    onIncrement,
    onDecrement
}) {
    const gameInfo = territory?.game_info || {}
    const liveState = territory?.live_state || {}

    const hasTimer = gameInfo.has_timer
    const hasScoreboard = gameInfo.has_scoreboard
    const timerMode = gameInfo.timer_mode || 'stopwatch'
    const defaultDuration = gameInfo.timer_duration_seconds || 60

    // Timer state
    const [sharedElapsed, setSharedElapsed] = useState(0)
    const [durationInput, setDurationInput] = useState(String(defaultDuration))

    const countdownDuration = liveState?.countdown_duration || 0
    const isTimerRunning = !!liveState?.timer_started_at

    // Calculate elapsed from Firestore state
    useEffect(() => {
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
    }, [liveState?.timer_started_at, liveState?.shared_elapsed_seconds])

    // Scoreboard state
    const attackerScore = liveState?.attacker_score || 0
    const defenderScore = liveState?.defender_score || 0
    const scoreUnit = gameInfo?.score_unit || 'Points'

    const [attackerInput, setAttackerInput] = useState(String(attackerScore))
    const [defenderInput, setDefenderInput] = useState(String(defenderScore))

    useEffect(() => setAttackerInput(String(attackerScore)), [attackerScore])
    useEffect(() => setDefenderInput(String(defenderScore)), [defenderScore])

    const canControlAttacker = role === 'attacker'
    const canControlDefender = role === 'defender'

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(Math.abs(seconds) / 60)
        const secs = Math.abs(seconds) % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Countdown display
    const countdownRemaining = Math.max(0, countdownDuration - sharedElapsed)
    const isCountdownFinished = timerMode === 'countdown' && countdownDuration > 0 && countdownRemaining <= 0

    // Handle set duration for countdown
    const handleSetDuration = () => {
        const seconds = parseInt(durationInput, 10)
        if (!isNaN(seconds) && seconds > 0 && onSetCountdownDuration) {
            onSetCountdownDuration(seconds)
        }
    }

    // Determine layout - center single item, split both
    const layoutClass = hasTimer && hasScoreboard
        ? 'flex flex-col h-full gap-2 p-4'
        : 'flex flex-col h-full gap-2 p-4 justify-center'

    return (
        <div className={layoutClass}>
            {/* Timer Section */}
            {hasTimer && (
                <Card className={hasScoreboard ? 'flex-1 flex flex-col' : ''}>
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            {timerMode === 'countdown' ? '⏱️ Countdown' : '⏱️ Stopwatch'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center">
                        {/* Countdown Setup (if not yet set) */}
                        {timerMode === 'countdown' && countdownDuration === 0 && role !== 'spectator' && (
                            <div className="space-y-3 mb-4">
                                <p className="text-sm text-muted-foreground text-center">Set timer duration (seconds)</p>
                                <div className="flex gap-2 justify-center">
                                    <Input
                                        type="number"
                                        value={durationInput}
                                        onChange={(e) => setDurationInput(e.target.value)}
                                        className="w-24 text-center"
                                    />
                                    <Button onClick={handleSetDuration}>Set</Button>
                                </div>
                            </div>
                        )}

                        {/* Timer Display */}
                        <p className={`text-6xl font-mono font-bold mb-4 ${isCountdownFinished ? 'text-destructive' : ''}`}>
                            {timerMode === 'countdown'
                                ? formatTime(countdownRemaining)
                                : formatTime(sharedElapsed)
                            }
                        </p>

                        {/* Duration info for countdown */}
                        {timerMode === 'countdown' && countdownDuration > 0 && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Duration: {formatTime(countdownDuration)}
                            </p>
                        )}

                        {/* Timer Controls */}
                        {role !== 'spectator' && (timerMode === 'stopwatch' || countdownDuration > 0) && (
                            <div className="flex gap-2 justify-center">
                                {!isTimerRunning ? (
                                    <Button
                                        onClick={onStartSharedTimer}
                                        className="gap-2"
                                        disabled={isCountdownFinished}
                                    >
                                        <Play className="h-4 w-4" />
                                        {sharedElapsed > 0 ? 'Resume' : 'Start'}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => onPauseSharedTimer(sharedElapsed)}
                                        variant="secondary"
                                        className="gap-2"
                                    >
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
            )}

            {/* Scoreboard Section */}
            {hasScoreboard && (
                <Card className={hasTimer ? 'flex-1 flex flex-col' : ''}>
                    <CardContent className="flex-1 p-0">
                        <div className="grid grid-cols-2 divide-x h-full">
                            {/* Attacker Side */}
                            <div
                                className="p-4 flex flex-col items-center justify-center"
                                style={{ backgroundColor: `${attackerColor}15` }}
                            >
                                <p className="text-sm font-medium mb-2" style={{ color: attackerColor }}>
                                    ⚔️ {attackerName}
                                </p>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={attackerInput}
                                    onChange={(e) => setAttackerInput(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={!canControlAttacker}
                                    className="text-4xl font-bold text-center bg-transparent border-0 h-auto py-2 mb-1 w-20"
                                />
                                <p className="text-xs text-muted-foreground mb-3">{scoreUnit}</p>
                                {canControlAttacker && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="h-12 w-12"
                                            onClick={() => onDecrement('attacker')}
                                            disabled={attackerScore <= 0}
                                        >
                                            <Minus className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="h-12 w-12"
                                            style={{ backgroundColor: attackerColor, color: getContrastColor(attackerColor) }}
                                            onClick={() => onIncrement('attacker')}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Defender Side */}
                            <div
                                className="p-4 flex flex-col items-center justify-center"
                                style={{ backgroundColor: `${defenderColor}15` }}
                            >
                                <p className="text-sm font-medium mb-2" style={{ color: defenderColor }}>
                                    🛡️ {defenderName}
                                </p>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={defenderInput}
                                    onChange={(e) => setDefenderInput(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={!canControlDefender}
                                    className="text-4xl font-bold text-center bg-transparent border-0 h-auto py-2 mb-1 w-20"
                                />
                                <p className="text-xs text-muted-foreground mb-3">{scoreUnit}</p>
                                {canControlDefender && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="h-12 w-12"
                                            onClick={() => onDecrement('defender')}
                                            disabled={defenderScore <= 0}
                                        >
                                            <Minus className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="h-12 w-12"
                                            style={{ backgroundColor: defenderColor, color: getContrastColor(defenderColor) }}
                                            onClick={() => onIncrement('defender')}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
