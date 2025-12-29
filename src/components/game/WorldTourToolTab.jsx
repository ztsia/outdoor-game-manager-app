import { useState, useEffect } from 'react'
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
 * WorldTourToolTab - Combined Timer + Scoreboard for World Tour (single player) games
 */
export function WorldTourToolTab({
    game,
    host,
    teamColor = '#8B5CF6',
    teamName = 'PLAYER'
}) {
    const gameInfo = game?.game_info || {}
    const liveState = game?.live_state || {}

    const hasTimer = gameInfo.has_timer
    const hasScoreboard = gameInfo.has_scoreboard
    const timerMode = gameInfo.timer_mode || 'stopwatch'
    const defaultDuration = gameInfo.timer_duration_seconds || 60

    // Timer state
    const [elapsed, setElapsed] = useState(0)
    const [durationInput, setDurationInput] = useState(String(defaultDuration))

    const countdownDuration = liveState?.countdown_duration || 0
    const isTimerRunning = !!liveState?.timer_started_at

    // Calculate elapsed from Firestore state
    useEffect(() => {
        const storedElapsed = liveState?.elapsed_seconds || 0
        const timerStarted = liveState?.timer_started_at

        if (!timerStarted) {
            setElapsed(storedElapsed)
            return
        }

        const interval = setInterval(() => {
            const startTime = timerStarted?.toDate?.() || new Date(timerStarted)
            const runningElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
            setElapsed(storedElapsed + runningElapsed)
        }, 100)

        return () => clearInterval(interval)
    }, [liveState?.timer_started_at, liveState?.elapsed_seconds])

    // Scoreboard state
    const score = liveState?.score || 0
    const scoreUnit = gameInfo?.score_unit || 'Points'

    const [scoreInput, setScoreInput] = useState(String(score))
    useEffect(() => setScoreInput(String(score)), [score])

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(Math.abs(seconds) / 60)
        const secs = Math.abs(seconds) % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Countdown display
    const countdownRemaining = Math.max(0, countdownDuration - elapsed)
    const isCountdownFinished = timerMode === 'countdown' && countdownDuration > 0 && countdownRemaining <= 0

    // Handle set duration for countdown
    const handleSetDuration = () => {
        const seconds = parseInt(durationInput, 10)
        if (!isNaN(seconds) && seconds > 0 && host?.setCountdownDuration) {
            host.setCountdownDuration(seconds)
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
                        {timerMode === 'countdown' && countdownDuration === 0 && (
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
                        <p className={`text-6xl font-mono font-bold mb-4 ${isCountdownFinished ? 'text-destructive animate-pulse' : ''}`}>
                            {timerMode === 'countdown'
                                ? formatTime(countdownRemaining)
                                : formatTime(elapsed)
                            }
                        </p>

                        {/* Duration info for countdown */}
                        {timerMode === 'countdown' && countdownDuration > 0 && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Duration: {formatTime(countdownDuration)}
                            </p>
                        )}

                        {/* Timer Controls */}
                        {(timerMode === 'stopwatch' || countdownDuration > 0) && (
                            <div className="flex gap-2 justify-center">
                                {!isTimerRunning ? (
                                    <Button
                                        onClick={() => host?.startTimer?.()}
                                        className="gap-2"
                                        disabled={isCountdownFinished}
                                    >
                                        <Play className="h-4 w-4" />
                                        {elapsed > 0 ? 'Resume' : 'Start'}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => host?.pauseTimer?.(elapsed)}
                                        variant="secondary"
                                        className="gap-2"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Pause
                                    </Button>
                                )}
                                <Button onClick={() => host?.resetTimer?.()} variant="outline" className="gap-2">
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
                        <div
                            className="h-full p-6 flex flex-col items-center justify-center"
                            style={{ backgroundColor: `${teamColor}15` }}
                        >
                            <p className="text-sm font-medium mb-2" style={{ color: teamColor }}>
                                🎮 {teamName}
                            </p>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={scoreInput}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '')
                                    setScoreInput(val)
                                }}
                                onBlur={(e) => {
                                    const numVal = Math.max(0, parseInt(e.target.value, 10) || 0)
                                    host?.setScore?.(numVal)
                                }}
                                className="text-5xl font-bold text-center bg-transparent border-0 h-auto py-2 mb-1 w-32"
                            />
                            <p className="text-xs text-muted-foreground mb-4">{scoreUnit}</p>
                            <div className="flex gap-2">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 w-14"
                                    onClick={() => host?.decrementScore?.()}
                                    disabled={score <= 0}
                                >
                                    <Minus className="h-6 w-6" />
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-14 w-14"
                                    style={{ backgroundColor: teamColor, color: getContrastColor(teamColor) }}
                                    onClick={() => host?.incrementScore?.()}
                                >
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
