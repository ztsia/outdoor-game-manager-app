import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
 * @param {Object} props.territory - Territory data with live_state
 * @param {'attacker' | 'defender' | 'spectator'} props.role - Current user's role
 * @param {Function} props.onIncrement - Called when + button pressed
 * @param {Function} props.onDecrement - Called when - button pressed
 * @param {string} [props.attackerColor] - Hex color for attacker team
 * @param {string} [props.defenderColor] - Hex color for defender team
 * @param {boolean} [props.allowOpponentControl=false] - Whether to allow controlling opponent's score
 */
export function ScoreboardTab({
    territory,
    role,
    onIncrement,
    onDecrement,
    attackerColor = '#EF4444',
    defenderColor = '#3B82F6',
    allowOpponentControl = false
}) {
    const attackerScore = territory?.live_state?.attacker_score || 0
    const defenderScore = territory?.live_state?.defender_score || 0
    const scoreUnit = territory?.game_info?.score_unit || 'Points'

    const attackerName = territory?.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory?.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    const canControlAttacker = role === 'attacker' || allowOpponentControl
    const canControlDefender = role === 'defender' || allowOpponentControl

    return (
        <div className="p-4">
            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x">
                        {/* Attacker Side (Left) */}
                        <div
                            className="p-4 text-center"
                            style={{ backgroundColor: `${attackerColor}15` }}
                        >
                            <p
                                className="text-sm font-medium mb-2"
                                style={{ color: attackerColor }}
                            >
                                ⚔️ {attackerName}
                            </p>
                            <p className="text-5xl font-bold mb-4">{attackerScore}</p>
                            <p className="text-xs text-muted-foreground mb-4">{scoreUnit}</p>

                            {canControlAttacker ? (
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 w-14"
                                        onClick={() => onDecrement('attacker')}
                                        disabled={attackerScore <= 0}
                                    >
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="h-14 w-14"
                                        style={{
                                            backgroundColor: attackerColor,
                                            color: getContrastColor(attackerColor)
                                        }}
                                        onClick={() => onIncrement('attacker')}
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

                        {/* Defender Side (Right) */}
                        <div
                            className="p-4 text-center"
                            style={{ backgroundColor: `${defenderColor}15` }}
                        >
                            <p
                                className="text-sm font-medium mb-2"
                                style={{ color: defenderColor }}
                            >
                                🛡️ {defenderName}
                            </p>
                            <p className="text-5xl font-bold mb-4">{defenderScore}</p>
                            <p className="text-xs text-muted-foreground mb-4">{scoreUnit}</p>

                            {canControlDefender ? (
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 w-14"
                                        onClick={() => onDecrement('defender')}
                                        disabled={defenderScore <= 0}
                                    >
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="h-14 w-14"
                                        style={{
                                            backgroundColor: defenderColor,
                                            color: getContrastColor(defenderColor)
                                        }}
                                        onClick={() => onIncrement('defender')}
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
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
