import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RankBadge, LivingIconBadge } from '@/components/game/RankBadge'
import { RANKS } from '@/services/rankService'
import { ArrowRight, X, Gem, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Rank order for comparison
const RANK_ORDER = {
    [null]: 0,
    [RANKS.ROOKIE]: 1,
    [RANKS.RISING_STAR]: 2,
    [RANKS.LEGEND]: 3
}

// Notification types
const NOTIFICATION_TYPES = {
    PROMOTION: 'promotion',
    DEMOTION: 'demotion',
    RANK_LOST: 'rank_lost',
    LIVING_ICON_GAINED: 'living_icon_gained',
    LIVING_ICON_LOST: 'living_icon_lost'
}

// Configuration for each notification type
const NOTIFICATION_CONFIG = {
    [NOTIFICATION_TYPES.PROMOTION]: {
        title: 'Congratulations!',
        getMessage: (newRank) => `You've been promoted to ${newRank}!`,
        icon: TrendingUp,
        bannerClass: 'bg-green-600 text-white',
        modalHeaderClass: 'text-green-600',
        showConfetti: true
    },
    [NOTIFICATION_TYPES.DEMOTION]: {
        title: 'Rank Update',
        getMessage: (newRank) => `You've been demoted to ${newRank}.`,
        icon: TrendingDown,
        bannerClass: 'bg-orange-500 text-white',
        modalHeaderClass: 'text-orange-600',
        showConfetti: false
    },
    [NOTIFICATION_TYPES.RANK_LOST]: {
        title: 'Rank Update',
        getMessage: () => 'You have lost your rank.',
        icon: AlertCircle,
        bannerClass: 'bg-slate-700 text-white',
        modalHeaderClass: 'text-slate-600',
        showConfetti: false
    },
    [NOTIFICATION_TYPES.LIVING_ICON_GAINED]: {
        title: 'LEGENDARY STATUS!',
        getMessage: () => 'You are now the LIVING ICON!',
        icon: Gem,
        bannerClass: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-400 text-white [animation:galaxy-shimmer_4s_ease-in-out_infinite]',
        modalHeaderClass: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-400',
        showConfetti: true,
        isSpecial: true
    },
    [NOTIFICATION_TYPES.LIVING_ICON_LOST]: {
        title: 'Title Lost',
        getMessage: () => 'You are no longer the Living Icon.',
        icon: Gem,
        bannerClass: 'bg-slate-600 text-white',
        modalHeaderClass: 'text-slate-600',
        showConfetti: false
    }
}

/**
 * RankNotification - Displays rank change notifications
 * @param {Object} props
 * @param {'banner' | 'modal'} props.mode - Display mode
 * @param {string} props.rank - Current rank
 * @param {boolean} props.isLivingIcon - Living Icon status
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isGameActive - Whether game is actively in progress (for banner mode)
 */
export function RankNotification({ mode = 'modal', rank, isLivingIcon, loading, isGameActive }) {
    const [notification, setNotification] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const prevRank = useRef(null)
    const prevIsLivingIcon = useRef(null)
    const isInitialized = useRef(false)
    const autoDismissTimer = useRef(null)

    // Check for pending notification from sessionStorage (modal mode only)
    useEffect(() => {
        if (mode === 'modal' && !isInitialized.current) {
            const pending = sessionStorage.getItem('pendingRankNotification')
            if (pending) {
                try {
                    const pendingNotification = JSON.parse(pending)
                    setNotification(pendingNotification)
                    setShowModal(true)
                    sessionStorage.removeItem('pendingRankNotification')
                } catch (e) {
                    console.error('[RankNotification] Failed to parse pending notification:', e)
                    sessionStorage.removeItem('pendingRankNotification')
                }
            }
        }
    }, [mode])

    useEffect(() => {
        // Skip if still loading
        if (loading) return

        // Initialize refs on first load (don't trigger notification)
        if (!isInitialized.current) {
            prevRank.current = rank
            prevIsLivingIcon.current = isLivingIcon
            isInitialized.current = true
            return
        }

        const oldRank = prevRank.current
        const newRank = rank
        const oldIcon = prevIsLivingIcon.current
        const newIcon = isLivingIcon

        let notificationType = null
        let oldRankForDisplay = oldRank

        // Check Living Icon changes first (priority)
        if (!oldIcon && newIcon) {
            notificationType = NOTIFICATION_TYPES.LIVING_ICON_GAINED
        } else if (oldIcon && !newIcon && newRank === RANKS.LEGEND) {
            notificationType = NOTIFICATION_TYPES.LIVING_ICON_LOST
        }
        // Check rank changes
        else if (newRank !== oldRank) {
            const newOrder = RANK_ORDER[newRank] ?? 0
            const oldOrder = RANK_ORDER[oldRank] ?? 0

            if (newRank === null && oldRank !== null) {
                notificationType = NOTIFICATION_TYPES.RANK_LOST
            } else if (newOrder > oldOrder) {
                notificationType = NOTIFICATION_TYPES.PROMOTION
            } else if (newOrder < oldOrder && newRank !== null) {
                notificationType = NOTIFICATION_TYPES.DEMOTION
            }
        }

        // Update refs
        prevRank.current = newRank
        prevIsLivingIcon.current = newIcon

        // Trigger notification if type was determined
        if (notificationType) {
            const notificationData = {
                type: notificationType,
                oldRank: oldRankForDisplay,
                newRank,
                newIcon
            }

            // Determine if we should show the notification now
            const shouldShowNow = mode === 'modal' || (mode === 'banner' && isGameActive !== false)

            if (shouldShowNow) {
                setNotification(notificationData)

                if (mode === 'banner') {
                    setShowBanner(true)
                    // Auto-dismiss after 5 seconds
                    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current)
                    autoDismissTimer.current = setTimeout(() => {
                        setShowBanner(false)
                        setNotification(null)
                    }, 5000)
                } else {
                    setShowModal(true)
                }
            } else {
                // Banner mode but game not active - queue for later (modal on Dashboard)
                sessionStorage.setItem('pendingRankNotification', JSON.stringify(notificationData))
            }
        }

        return () => {
            if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current)
        }
    }, [rank, isLivingIcon, loading, mode, isGameActive])

    const handleClose = () => {
        setShowBanner(false)
        setShowModal(false)
        setNotification(null)
        if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current)
    }

    if (!notification) return null

    const config = NOTIFICATION_CONFIG[notification.type]
    const Icon = config.icon

    // Banner Mode
    if (mode === 'banner' && showBanner) {
        return (
            <div className={cn(
                'fixed top-0 left-0 right-0 z-50 p-3 shadow-lg',
                config.bannerClass,
                config.isSpecial && 'animate-pulse'
            )}>
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Icon className={cn('h-5 w-5 flex-shrink-0', config.isSpecial && 'animate-bounce')} />
                        <span className="font-semibold">
                            {config.getMessage(notification.newRank)}
                        </span>
                        {notification.type !== NOTIFICATION_TYPES.RANK_LOST && notification.type !== NOTIFICATION_TYPES.LIVING_ICON_LOST && (
                            <RankBadge rank={notification.newRank} isLivingIcon={notification.newIcon} />
                        )}
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-inherit hover:bg-white/20"
                        onClick={handleClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    // Modal Mode
    if (mode === 'modal' && showModal) {
        return (
            <Dialog open={showModal} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className={cn(
                            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
                            config.isSpecial
                                ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-400 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.6)]'
                                : notification.type === NOTIFICATION_TYPES.PROMOTION
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-muted'
                        )}>
                            <Icon className={cn(
                                'h-8 w-8',
                                config.isSpecial ? 'text-white animate-bounce' : config.modalHeaderClass
                            )} />
                        </div>
                        <DialogTitle className={cn('text-xl', config.modalHeaderClass)}>
                            {config.title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="rounded-lg bg-muted p-4 text-center space-y-3">
                        <p className="text-base">{config.getMessage(notification.newRank)}</p>

                        {/* Rank comparison for rank changes */}
                        {(notification.type === NOTIFICATION_TYPES.PROMOTION ||
                            notification.type === NOTIFICATION_TYPES.DEMOTION) && (
                                <div className="flex items-center justify-center gap-3">
                                    {notification.oldRank && <RankBadge rank={notification.oldRank} />}
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                    <RankBadge rank={notification.newRank} />
                                </div>
                            )}

                        {/* Living Icon badge for Living Icon notifications */}
                        {notification.type === NOTIFICATION_TYPES.LIVING_ICON_GAINED && (
                            <div className="flex justify-center pt-2">
                                <LivingIconBadge className="text-sm px-4 py-1" />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button className="w-full" onClick={handleClose}>
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return null
}
