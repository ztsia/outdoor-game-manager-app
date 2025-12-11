import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus } from 'lucide-react'

/**
 * ScoreboardTab - Real-time scoreboard with role-based controls
 * 
 * @param {Object} props
 * @param {Object} props.territory - Territory data with live_state
 * @param {'attacker' | 'defender' | 'spectator'} props.role - Current user's role
 * @param {Function} props.onIncrement - Called when + button pressed
 * @param {Function} props.onDecrement - Called when - button pressed
 */
export function ScoreboardTab({ territory, role, onIncrement, onDecrement }) {
    const attackerScore = territory?.live_state?.attacker_score || 0
    const defenderScore = territory?.live_state?.defender_score || 0
    const scoreUnit = territory?.game_info?.score_unit || 'Points'

    const attackerName = territory?.current_attacker_id?.replace('team_', '').toUpperCase() || 'ATTACKER'
    const defenderName = territory?.owner_id?.replace('team_', '').toUpperCase() || 'DEFENDER'

    const canControlAttacker = role === 'attacker'
    const canControlDefender = role === 'defender'

    return (
        <div className="p-4">
            <Card>
                <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x">
                        {/* Attacker Side (Left) */}
                        <div className="p-4 text-center bg-red-500/10">
                            <p className="text-sm font-medium text-red-500 mb-2">⚔️ {attackerName}</p>
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
                                        className="h-14 w-14 bg-red-500 hover:bg-red-600"
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
                        <div className="p-4 text-center bg-blue-500/10">
                            <p className="text-sm font-medium text-blue-500 mb-2">🛡️ {defenderName}</p>
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
                                        className="h-14 w-14 bg-blue-500 hover:bg-blue-600"
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
