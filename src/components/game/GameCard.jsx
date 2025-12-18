import { Star, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TeamChip } from '@/components/ui/TeamChip'
import { TerritoryStatusBadge } from '@/components/game/TerritoryStatusBadge'

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
            className={`overflow-hidden transition-all ${status.disabled
                    ? 'opacity-60'
                    : 'cursor-pointer hover:shadow-lg hover:scale-[1.01]'
                }`}
            onClick={() => {
                if (!status.disabled && onAction) {
                    onAction()
                }
            }}
        >
            {/* Cover Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {territory.location_image_url ? (
                    <img
                        src={territory.location_image_url}
                        alt={territory.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}

                {/* Status Badge Overlay */}
                <div className="absolute right-2 top-2">
                    <TerritoryStatusBadge status={status} />
                </div>
            </div>

            <CardContent className="p-4">
                {/* Header: Name + Stars */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base line-clamp-1">{territory.name}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">{territory.stars}</span>
                    </div>
                </div>

                {/* Owner */}
                <div className="mt-2">
                    <TeamChip name={ownerTeam?.name} color={ownerTeam?.color} />
                </div>

                {/* Game Info */}
                <div className="mt-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">
                        {territory.game_info?.title || 'Unknown Game'}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

