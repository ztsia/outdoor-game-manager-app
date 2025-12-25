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
import { Trophy, Star, Users } from 'lucide-react'
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
        difficulty = 'normal',
        multiplier = 1,
        finalScore = 0,
        followersGained = 0,
        isNewHighScore = false,
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
                    <DialogDescription>
                        {gameName}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Score Breakdown */}
                    <div className="space-y-3 text-left bg-muted rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Base Score</span>
                            <span className="font-mono font-bold">{baseScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Difficulty</span>
                            <Badge className={`${difficultyColors[difficulty]} text-white`}>
                                {difficultyEmojis[difficulty]} {difficulty.toUpperCase()} ({multiplier}x)
                            </Badge>
                        </div>
                        <hr className="border-border" />
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold">Final Score</span>
                            <span className="font-mono font-bold text-primary">{finalScore}</span>
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
