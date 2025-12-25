import { useState } from 'react'
import { Swords, HelpCircle, ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { formatNumber } from '@/lib/formatters'

/**
 * AttackChallengeModal - Payment-style confirmation modal for attacks
 */
export function AttackChallengeModal({
    open,
    onOpenChange,
    territory,
    ownerTeam,
    team,
    attackCost,
    starCosts,
    loading,
    onConfirm
}) {
    const hasEnoughFunds = team ? team.followers >= attackCost : false
    const remaining = team ? Math.max(0, team.followers - attackCost) : 0
    const [showCostTooltip, setShowCostTooltip] = useState(false)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md gap-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* Header */}
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-center flex items-center justify-center gap-2">
                        <Swords className="h-5 w-5" />
                        Confirm Challenge
                    </DialogTitle>
                    <DialogDescription className="text-center flex flex-col items-center gap-2">
                        <span>
                            Attacking <span className="font-semibold text-foreground">{territory?.name}</span>
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="gap-1 font-normal">
                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                {territory?.stars} Stars
                            </Badge>
                            <TeamChip name={ownerTeam?.name} color={ownerTeam?.color} />
                        </div>
                    </DialogDescription>
                </DialogHeader>

                {/* Hero Section */}
                <div className="flex flex-col items-center justify-center py-6 px-6 space-y-6">
                    {/* Wager Amount */}
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-medium">
                            Wager Amount
                            {/* Mobile-friendly tooltip */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="cursor-help focus:outline-none p-2 -m-2 opacity-70 hover:opacity-100 transition-opacity"
                                    onClick={() => setShowCostTooltip(!showCostTooltip)}
                                    onMouseEnter={() => setShowCostTooltip(true)}
                                    onMouseLeave={() => setShowCostTooltip(false)}
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </button>

                                {showCostTooltip && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-52 p-3 rounded-lg bg-popover border shadow-lg text-xs animate-in fade-in zoom-in-95 duration-200">
                                        <p className="font-semibold mb-2">Cost by Territory Stars:</p>
                                        <div className="space-y-1 mb-3">
                                            <div className="flex justify-between"><span>0 ⭐</span><span>{formatNumber(starCosts?.[0] || 10000)}</span></div>
                                            <div className="flex justify-between"><span>1 ⭐</span><span>{formatNumber(starCosts?.[1] || 50000)}</span></div>
                                            <div className="flex justify-between"><span>2 ⭐</span><span>{formatNumber(starCosts?.[2] || 100000)}</span></div>
                                            <div className="flex justify-between"><span>3 ⭐</span><span>{formatNumber(starCosts?.[3] || 500000)}</span></div>
                                        </div>
                                        <Separator className="my-2" />
                                        <p className="text-muted-foreground">
                                            💡 <strong>Refunded</strong> if you win!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Big Number */}
                        <div className="text-5xl font-black tracking-tighter tabular-nums">
                            {formatNumber(attackCost)}
                        </div>
                    </div>

                    {/* Balance Flow */}
                    <div className="flex flex-col items-center gap-2 w-full">
                        <div className="flex items-center gap-3 text-sm px-4 py-2 rounded-full bg-secondary/50">
                            <span className="text-muted-foreground text-xs mr-1">Balance:</span>
                            <span className={hasEnoughFunds ? "text-muted-foreground" : "text-destructive"}>
                                {formatNumber(team?.followers || 0)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                            <span className={hasEnoughFunds ? "font-bold" : "text-destructive font-bold"}>
                                {formatNumber(remaining)}
                            </span>
                        </div>

                        {!hasEnoughFunds && (
                            <Badge variant="destructive" className="animate-pulse">
                                Insufficient Funds
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 space-y-4">
                    {/* Game Info Card */}
                    <Card className="bg-muted/30 border-none shadow-none">
                        <CardContent className="p-3 text-center text-xs">
                            <div className="space-y-1">
                                <div className="font-medium text-foreground text-sm">{territory?.game_info?.title}</div>
                                <div className="text-muted-foreground">
                                    Win Condition: <span className="text-foreground">{territory?.game_info?.win_condition}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={!hasEnoughFunds || loading}
                            className="w-full sm:w-auto"
                        >
                            {loading ? 'Processing...' : 'PAY & BATTLE'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
