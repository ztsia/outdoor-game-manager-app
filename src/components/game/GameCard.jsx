import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'

/**
 * GameCard - A clickable card displaying a game/territory listing
 * @param {object} props
 * @param {object} props.territory - The territory/game object
 * @param {object} props.status - Status object { disabled, reason, badge }
 * @param {object} props.ownerTeam - The team object of the owner
 * @param {function} props.onAction - Callback when the card is clicked (if not disabled)
 */
export function GameCard({ territory, status, ownerTeam, onAction }) {
    return (
        <Card
            className={`overflow-hidden transition-opacity ${status.disabled ? 'opacity-50' : 'cursor-pointer hover:shadow-md'
                }`}
            onClick={() => {
                if (!status.disabled && onAction) {
                    onAction()
                }
            }}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    {/* Territory Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{territory.name}</h3>
                            <div className="flex items-center gap-0.5 text-yellow-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-bold">{territory.stars}</span>
                            </div>
                        </div>

                        {/* Owner Badge */}
                        <div className="mt-1">
                            <TeamChip
                                name={ownerTeam?.name}
                                color={ownerTeam?.color}
                            />
                        </div>

                        {/* Game Title */}
                        <p className="mt-2 text-sm text-muted-foreground">
                            {territory.game_info?.title || 'Unknown Game'}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                        {status.badge && (
                            <Badge variant={status.badge.variant} className="gap-1">
                                <status.badge.icon className="h-3 w-3" />
                                <span className="text-xs">{status.badge.text}</span>
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
