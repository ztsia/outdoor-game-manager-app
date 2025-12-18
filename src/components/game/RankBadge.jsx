import { Badge } from '@/components/ui/badge'
import { Sprout, Star, Crown, Gem } from 'lucide-react'
import { RANKS } from '@/services/rankService'
import { cn } from '@/lib/utils'

/**
 * Rank configuration - colors and icons for each rank
 */
const RANK_CONFIG = {
    [RANKS.ROOKIE]: {
        icon: Sprout,
        label: 'Rookie',
        className: 'bg-zinc-500 text-white border-zinc-600'
    },
    [RANKS.RISING_STAR]: {
        icon: Star,
        label: 'Rising Star',
        className: 'bg-blue-500 text-white border-blue-600'
    },
    [RANKS.LEGEND]: {
        icon: Crown,
        label: 'Legend',
        className: 'bg-amber-500 text-white border-amber-600'
    }
}

const LIVING_ICON_CONFIG = {
    icon: Gem,
    label: 'Living Icon',
    className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-600 animate-pulse'
}

/**
 * RankBadge - Displays a team's rank with appropriate styling
 * @param {Object} props
 * @param {string} props.rank - The rank (ROOKIE, RISING_STAR, LEGEND)
 * @param {boolean} props.isLivingIcon - Whether the team is the Living Icon
 * @param {boolean} props.showIcon - Whether to show the icon (default: true)
 * @param {string} props.className - Additional classes
 */
export function RankBadge({ rank, isLivingIcon = false, showIcon = true, className }) {
    // Don't render if no rank
    if (!rank) return null

    const config = RANK_CONFIG[rank]
    if (!config) return null

    const Icon = config.icon

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <Badge className={cn('text-xs font-semibold', config.className)}>
                {showIcon && <Icon className="h-3 w-3" />}
                {config.label}
            </Badge>

            {isLivingIcon && (
                <Badge className={cn('text-xs font-semibold', LIVING_ICON_CONFIG.className)}>
                    {showIcon && <Gem className="h-3 w-3" />}
                    {LIVING_ICON_CONFIG.label}
                </Badge>
            )}
        </div>
    )
}

/**
 * LivingIconBadge - Standalone Living Icon badge
 */
export function LivingIconBadge({ showIcon = true, className }) {
    return (
        <Badge className={cn('text-xs font-semibold', LIVING_ICON_CONFIG.className, className)}>
            {showIcon && <Gem className="h-3 w-3" />}
            {LIVING_ICON_CONFIG.label}
        </Badge>
    )
}
