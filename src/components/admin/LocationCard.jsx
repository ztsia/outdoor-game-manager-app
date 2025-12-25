import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

/**
 * LocationCard - Displays a location in the admin panel
 * @param {Object} props
 * @param {Object} props.location - Location object (id, name, type, emoji, image_url)
 * @param {Function} props.onClick - Callback when card is clicked
 */
export function LocationCard({ location, onClick }) {
    const isWorldTour = location.type === 'world_tour'

    return (
        <Card
            className="overflow-hidden p-0 gap-0 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all"
            onClick={onClick}
        >
            {/* Cover Image */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {location.image_url ? (
                    <img
                        src={location.image_url}
                        alt={location.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <MapPin className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute right-2 top-2">
                    <Badge variant={isWorldTour ? 'default' : 'secondary'}>
                        {isWorldTour ? '🌍 World Tour' : '🏰 Territory'}
                    </Badge>
                </div>
            </div>

            <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">
                    {isWorldTour && location.emoji && `${location.emoji} `}
                    {location.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    ID: {location.id}
                </p>
            </CardContent>
        </Card>
    )
}
