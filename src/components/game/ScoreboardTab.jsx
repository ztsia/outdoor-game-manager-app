import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Minus } from 'lucide-react'

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
 * ScoreboardTab - Real-time scoreboard with role-based controls
 * 
 * @param {Object} props
 * @param {Object} props.territory - Territory/game data with live_state
 * @param {'attacker' | 'defender' | 'player' | 'spectator'} props.role - Current user's role
 * @param {'versus' | 'single'} [props.mode='versus'] - Display mode
 * @param {Function} props.onIncrement - Called when + button pressed (role parameter for versus)
 * @param {Function} props.onDecrement - Called when - button pressed (role parameter for versus)
 * @param {Function} [props.onScoreChange] - Called when score is typed directly (newScore, role)
 * @param {string} [props.attackerColor] - Hex color for attacker team
 * @param {string} [props.defenderColor] - Hex color for defender team
 * @param {string} [props.playerColor] - Hex color for single player mode
 * @param {string} [props.playerName] - Name for single player mode
 * @param {boolean} [props.allowOpponentControl=false] - Whether to allow controlling opponent's score
 */
export function ScoreboardTab({
    territory,
    role,
    mode = 'versus',
    onIncrement,
    onDecrement,
    onScoreChange,
    attackerColor = '#EF4444',
    defenderColor = '#3B82F6',
    playerColor = '#8B5CF6',
    playerName = 'PLAYER',
    allowOpponentControl = false
}) {
    const scoreUnit = territory?.game_info?.score_unit || 'Points'

    // For versus mode
    const attackerScore = territory?.live_state?.attacker_score || 0
    const defenderScore = territory?.live_state?.defender_score || 0
    const attackerName = territory?.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory?.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    // For single mode
    const singleScore = territory?.live_state?.score || 0

    // Local state for input values (to allow typing before blur)
    const [attackerInput, setAttackerInput] = useState(String(attackerScore))
    const [defenderInput, setDefenderInput] = useState(String(defenderScore))
    const [singleInput, setSingleInput] = useState(String(singleScore))

    // Sync input values when remote score changes
    useEffect(() => {
        setAttackerInput(String(attackerScore))
    }, [attackerScore])

    useEffect(() => {
        setDefenderInput(String(defenderScore))
    }, [defenderScore])

    useEffect(() => {
        setSingleInput(String(singleScore))
    }, [singleScore])

    const canControlAttacker = role === 'attacker' || allowOpponentControl
    const canControlDefender = role === 'defender' || allowOpponentControl
    const canControlSingle = role === 'player'

    // Handle input change
    const handleInputChange = (value, target) => {
        const numericValue = value.replace(/[^0-9]/g, '')
        if (target === 'attacker') setAttackerInput(numericValue)
        else if (target === 'defender') setDefenderInput(numericValue)
        else setSingleInput(numericValue)
    }

    // Handle input blur (commit value)
    const handleInputBlur = (value, target) => {
        const numValue = Math.max(0, parseInt(value, 10) || 0)
        if (onScoreChange) {
            onScoreChange(numValue, target)
        }
    }

    // Render a single score counter card
    const renderScoreCard = ({ name, color, canControl, target, inputValue, icon }) => (
        <div
            className="p-6 text-center"
            style={{ backgroundColor: `${color}15` }}
        >
            <p
                className="text-sm font-medium mb-2"
                style={{ color: color }}
            >
                {icon} {name}
            </p>

            {/* Editable Score Input */}
            <Input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value, target)}
                onBlur={(e) => handleInputBlur(e.target.value, target)}
                disabled={!canControl}
                className="text-5xl font-bold text-center bg-transparent border-0 focus:ring-2 focus:ring-offset-2 h-auto py-2 mb-2"
                style={{
                    fontSize: '3rem',
                    lineHeight: '1',
                    width: '100%',
                    maxWidth: '150px',
                    margin: '0 auto'
                }}
            />

            <p className="text-xs text-muted-foreground mb-4">{scoreUnit}</p>

            {canControl ? (
                <div className="flex gap-2 justify-center">
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-14 w-14"
                        onClick={() => onDecrement(target)}
                        disabled={parseInt(inputValue, 10) <= 0}
                    >
                        <Minus className="h-6 w-6" />
                    </Button>
                    <Button
                        size="lg"
                        className="h-14 w-14"
                        style={{
                            backgroundColor: color,
                            color: getContrastColor(color)
                        }}
                        onClick={() => onIncrement(target)}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            ) : (
                <p className="text-xs text-muted-foreground italic">
                    {role === 'spectator' ? 'Viewing only' : 'Opponent controls'}
                </p>
            )}
        </div>
    )

    // Single player mode
    if (mode === 'single') {
        return (
            <div className="p-4">
                <Card>
                    <CardContent className="p-0">
                        {renderScoreCard({
                            name: playerName,
                            score: singleScore,
                            color: playerColor,
                            canControl: canControlSingle,
                            target: 'player',
                            inputValue: singleInput,
                            setInputValue: setSingleInput,
                            icon: '🎮'
                        })}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Versus mode (default)
    return (
        <div className="p-4">
            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x">
                        {/* Attacker Side (Left) */}
                        {renderScoreCard({
                            name: attackerName,
                            score: attackerScore,
                            color: attackerColor,
                            canControl: canControlAttacker,
                            target: 'attacker',
                            inputValue: attackerInput,
                            setInputValue: setAttackerInput,
                            icon: '⚔️'
                        })}

                        {/* Defender Side (Right) */}
                        {renderScoreCard({
                            name: defenderName,
                            score: defenderScore,
                            color: defenderColor,
                            canControl: canControlDefender,
                            target: 'defender',
                            inputValue: defenderInput,
                            setInputValue: setDefenderInput,
                            icon: '🛡️'
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
