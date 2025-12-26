import { Star, MapPin, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TeamChip } from '@/components/ui/TeamChip'
import { TerritoryStatusBadge } from '@/components/game/TerritoryStatusBadge'

/**
 * GameCard - A clickable card displaying a game/territory listing
 * Supports both Territory mode and World Tour mode
 * 
 * @param {object} props
 * @param {object} props.territory - The territory/game object
 * @param {object} props.status - Status object { disabled, reason, badge }
 * @param {object} props.ownerTeam - The team object of the owner (Territory) or high score holder (World Tour)
 * @param {function} props.onAction - Callback when the card is clicked (if not disabled)
 * @param {boolean} [props.isWorldTour=false] - Whether this is a World Tour game
 * @param {string} [props.title] - Location name to display as card title (overrides territory.name in header)
 * @param {string} [props.locationImage] - Image URL from location collection
 */
export function GameCard({ territory, status, ownerTeam, onAction, isWorldTour = false, title, locationImage }) {
    // Title (header) = Location Name, fallback to territory.name if not provided
    const displayTitle = title || territory.name
    // Game Name = territory.name (which is now the game name after schema change)
    const gameName = territory.name

    return (
        <Card
            className={`overflow-hidden p-0 gap-0 transition-all ${status.disabled
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
                {locationImage ? (
                    <img
                        src={locationImage}
                        alt={displayTitle}
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

            <CardContent className="p-5">
                {/* Header: Location Name + Stars (Territory) or Location Name only (World Tour) */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xl line-clamp-1">{displayTitle}</h3>
                    {!isWorldTour && (
                        <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                            <Star className="h-5 w-5 fill-current" />
                            <span className="text-base font-bold">{territory.stars}</span>
                        </div>
                    )}
                </div>

                {/* Owner (Territory) or Fan Favourite (World Tour) */}
                <div className="mt-3">
                    {isWorldTour ? (
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">Fan Favourite:</span>
                            {ownerTeam ? (
                                <TeamChip name={ownerTeam.name} color={ownerTeam.color} />
                            ) : (
                                <span className="text-sm text-muted-foreground italic">None yet</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Owner:</span>
                            <TeamChip name={ownerTeam?.name} color={ownerTeam?.color} />
                        </div>
                    )}
                </div>

                {/* Game Name (smaller, below owner) */}
                <div className="mt-4 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground text-base">
                        {gameName}
                    </div>
                    {isWorldTour && territory.high_score > 0 && (
                        <div className="mt-1">
                            High Score: <span className="font-semibold text-foreground">{territory.high_score}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
