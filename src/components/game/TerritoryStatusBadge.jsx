import { Badge } from '@/components/ui/badge'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * TerritoryStatusBadge - Displays the status of a territory
 * @param {object} props
 * @param {object} props.status - Status object { disabled, reason, badge }
 */
export function TerritoryStatusBadge({ status }) {
    // Disabled state - show the specific status badge
    if (status?.badge) {
        const IconComponent = status.badge.icon
        return (
            <Badge
                variant={status.badge.variant}
                className={cn("gap-1", status.badge.className)}
            >
                <IconComponent className="h-3 w-3" />
                <span className="text-xs">{status.badge.text}</span>
            </Badge>
        )
    }

    // Available for action
    return (
        <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-500/90">
            <CircleCheck className="h-3 w-3" />
            <span className="text-xs">AVAILABLE</span>
        </Badge>
    )
}
