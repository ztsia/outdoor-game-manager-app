import { useState } from 'react'
import { Swords, AlertCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeamChip } from '@/components/ui/TeamChip'
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
 * AttackChallengeModal - Modal for confirming an attack/challenge
 * @param {object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onOpenChange - Callback to change visibility
 * @param {object} props.territory - The selected territory object
 * @param {object} props.ownerTeam - The team object of the owner
 * @param {object} props.team - The current user's team object (for balance check)
 * @param {number} props.attackCost - Calculated cost
 * @param {object} props.starCosts - Object of costs by star level
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onConfirm - Callback when "CONFIRM & LOCK" is clicked
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
    const [showCostTooltip, setShowCostTooltip] = useState(false)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5" />
                        Challenge {territory?.name}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        Owned by <TeamChip
                            name={ownerTeam?.name}
                            color={ownerTeam?.color}
                        />
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Cost Display with Tooltip */}
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-1">
                                <span>Battle Cost:</span>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="cursor-help focus:outline-none p-2 -m-2 opacity-70 hover:opacity-100 transition-opacity"
                                        onClick={() => setShowCostTooltip(!showCostTooltip)}
                                        onMouseEnter={() => setShowCostTooltip(true)}
                                        onMouseLeave={() => setShowCostTooltip(false)}
                                    >
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </button>

                                    {showCostTooltip && (
                                        <div className="absolute left-0 bottom-full mb-2 z-50 w-48 p-3 rounded-lg bg-popover border shadow-lg text-xs animate-in fade-in zoom-in-95 duration-200">
                                            <p className="font-semibold mb-2">Cost by Star Level:</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between"><span>0 ⭐</span><span>{formatNumber(starCosts[0] || 10000)}</span></div>
                                                <div className="flex justify-between"><span>1 ⭐</span><span>{formatNumber(starCosts[1] || 50000)}</span></div>
                                                <div className="flex justify-between"><span>2 ⭐</span><span>{formatNumber(starCosts[2] || 100000)}</span></div>
                                                <div className="flex justify-between"><span>3 ⭐</span><span>{formatNumber(starCosts[3] || 500000)}</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="font-mono font-bold text-lg">
                                {formatNumber(attackCost)} followers
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Your Balance:</span>
                            <span className={`font-mono font-bold ${hasEnoughFunds ? 'text-green-500' : 'text-red-500'}`}>
                                {team ? formatNumber(team.followers) : '...'} followers
                            </span>
                        </div>
                        <hr className="border-border" />
                        <div className="flex justify-between text-sm">
                            <span>Remaining (if you lose):</span>
                            <span className={`font-mono font-bold ${hasEnoughFunds ? '' : 'text-red-500'}`}>
                                {team ? formatNumber(Math.max(0, team.followers - attackCost)) : '...'} followers
                            </span>
                        </div>
                    </div>

                    {/* Bet Return Note */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                        <span className="text-lg">ℹ️</span>
                        <p className="text-sm">
                            This cost is placed as a <strong>bet</strong>. If you <strong>win</strong> the battle, it will be fully refunded!
                        </p>
                    </div>

                    {/* Insufficient Funds Warning */}
                    {!hasEnoughFunds && (
                        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">Insufficient Followers</p>
                                <p className="text-destructive/80">
                                    You need {formatNumber(attackCost - (team?.followers || 0))} more followers.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Game Info */}
                    <div className="text-sm text-muted-foreground">
                        <p><strong>Game:</strong> {territory?.game_info?.title}</p>
                        <p><strong>Win Condition:</strong> {territory?.game_info?.win_condition}</p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!hasEnoughFunds || loading}
                        className="gap-1"
                    >
                        {loading ? 'Processing...' : 'CONFIRM & LOCK'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
