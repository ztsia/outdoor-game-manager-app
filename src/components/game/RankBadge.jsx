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
        // Bronze metallic gradient
        className: 'bg-gradient-to-br from-orange-400 via-[#CD7F32] to-orange-700 text-white border border-white/20 shadow-sm'
    },
    [RANKS.RISING_STAR]: {
        icon: Star,
        label: 'Rising Star',
        // Silver metallic gradient
        className: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-600 text-slate-900 border border-white/20 shadow-sm'
    },
    [RANKS.LEGEND]: {
        icon: Crown,
        label: 'Legend',
        // Gold metallic gradient
        className: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-yellow-900 border border-white/20 shadow-sm'
    }
}

const LIVING_ICON_CONFIG = {
    icon: Gem,
    label: 'Living Icon',
    // Enhanced with inner glow, crystalline border, and holographic shine
    className: 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-400 bg-[length:200%_200%] text-white border border-cyan-100/50 shadow-[0_0_15px_rgba(34,211,238,0.6),inset_0_0_10px_rgba(255,255,255,0.4)] [animation:galaxy-shimmer_4s_ease-in-out_infinite,pulse-glow_3s_ease-in-out_infinite] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:[animation:shine-sweep_3s_ease-in-out_infinite]'
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
