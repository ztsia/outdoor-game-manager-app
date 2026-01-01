import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Users, Award, Hash } from 'lucide-react'
import { formatNumber } from '@/lib/formatters'

/**
 * WorldTourResultModal - Shows final score and rewards after game ends
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onOpenChange - Callback to change visibility
 * @param {Object} props.result - Game result data
 * @param {function} props.onClose - Callback when closing (navigates to dashboard)
 */
export function WorldTourResultModal({
    open,
    onOpenChange,
    result,
    onClose
}) {
    if (!result) return null

    const {
        baseScore = 0,
        preprocessedScore = 0,
        hasFormula = false,
        difficulty = 'normal',
        multiplier = 1,
        finalScore = 0,
        followersGained = 0,
        isNewHighScore = false,
        isFanFavourite = false,
        rank = 1,
        locationName = '',
        locationEmoji = '',
        gameName = 'Game'
    } = result

    const difficultyColors = {
        normal: 'bg-green-500',
        hard: 'bg-orange-500',
        extreme: 'bg-red-500'
    }

    const difficultyEmojis = {
        normal: '🌱',
        hard: '🔥',
        extreme: '💀'
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-center gap-2">
                        {isNewHighScore ? (
                            <>
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                NEW HIGH SCORE!
                            </>
                        ) : (
                            <>
                                <Star className="h-8 w-8 text-primary" />
                                Game Complete!
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="space-y-1">
                        <div className="text-base">
                            {locationEmoji && `${locationEmoji} `}{locationName || gameName}
                        </div>
                        {locationName && gameName && locationName !== gameName && (
                            <div className="text-sm text-muted-foreground">{gameName}</div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Fan Favourite Banner */}
                {isFanFavourite && (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-yellow-400/20 via-amber-500/20 to-yellow-400/20 border border-yellow-500/30">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                            You are now the Fan Favourite!
                        </span>
                    </div>
                )}

                <div className="py-4 space-y-6">
                    {/* Score Breakdown */}
                    <div className="space-y-3 text-left bg-muted rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Raw Score</span>
                            <span className="font-mono font-bold">{baseScore}</span>
                        </div>

                        {hasFormula && (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">After Formula</span>
                                <span className="font-mono font-bold">{preprocessedScore}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Difficulty</span>
                            <Badge className={`${difficultyColors[difficulty]} text-white`}>
                                {difficultyEmojis[difficulty]} {difficulty.toUpperCase()} (×{multiplier})
                            </Badge>
                        </div>

                        <hr className="border-border" />

                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold">Final Score</span>
                            <span className="font-mono font-bold text-primary">{finalScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Hash className="h-4 w-4" /> Rank
                            </span>
                            <Badge variant="outline" className="font-mono font-bold">
                                #{rank}
                            </Badge>
                        </div>
                    </div>

                    {/* Followers Gained */}
                    <div className="flex items-center justify-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-green-500">
                            +{formatNumber(followersGained)} Followers
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full">
                        Back to Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

