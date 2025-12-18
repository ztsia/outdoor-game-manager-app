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
        // Bronze styling
        className: 'bg-[#CD7F32] text-white border border-white/40 shadow-sm'
    },
    [RANKS.RISING_STAR]: {
        icon: Star,
        label: 'Rising Star',
        // Silver styling with dark text for contrast
        className: 'bg-[#C0C0C0] text-slate-900 border border-white/40 shadow-sm'
    },
    [RANKS.LEGEND]: {
        icon: Crown,
        label: 'Legend',
        // Gold styling with dark text for contrast
        className: 'bg-[#FFD700] text-yellow-900 border border-white/40 shadow-sm'
    }
}

const LIVING_ICON_CONFIG = {
    icon: Gem,
    label: 'Living Icon',
    className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-white/40 shadow-sm animate-pulse'
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
