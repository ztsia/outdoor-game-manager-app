import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Frown, Star, Users, MapPin } from 'lucide-react'

/**
 * GameResultModal - Shows victory/defeat summary after game ends
 * 
 * @param {Object} props
 * @param {Object} props.result - Game result data from navigation state
 * @param {Function} props.onClose - Called when modal is dismissed
 */
export function GameResultModal({ result, onClose }) {
    if (!result) return null

    const {
        isWinner,
        outcome,
        territoryName,
        stars,
        betAmount,
        attackerName,
        defenderName,
        winner
    } = result

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${isWinner ? 'bg-yellow-500/20' : 'bg-muted'
                        }`}>
                        {isWinner ? (
                            <Trophy className="h-10 w-10 text-yellow-500" />
                        ) : (
                            <Frown className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                    <DialogTitle className={`text-2xl ${isWinner ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {isWinner ? '🎉 VICTORY!' : '😞 DEFEAT'}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {winner === 'attacker' ? attackerName : defenderName} won the battle!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Territory Info */}
                    <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{territoryName}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-yellow-500">
                            {Array.from({ length: stars }).map((_, i) => (
                                <Star key={i} className="h-5 w-5 fill-current" />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +1 star added
                        </p>
                    </div>

                    {/* Outcome Details */}
                    <div className="space-y-2">
                        {isWinner ? (
                            <>
                                {winner === 'attacker' ? (
                                    // Attacker won
                                    <>
                                        <p className="text-green-500 font-semibold flex items-center justify-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            You gained {territoryName}!
                                        </p>
                                        {betAmount > 0 && (
                                            <p className="text-green-500 flex items-center justify-center gap-2">
                                                <Users className="h-4 w-4" />
                                                +{betAmount.toLocaleString()} followers (refund)
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    // Defender won
                                    <>
                                        <p className="text-green-500 font-semibold flex items-center justify-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            You kept {territoryName}!
                                        </p>
                                        {betAmount > 0 && (
                                            <p className="text-green-500 flex items-center justify-center gap-2">
                                                <Users className="h-4 w-4" />
                                                +{betAmount.toLocaleString()} followers (winnings)
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {winner === 'attacker' ? (
                                    // Defender lost
                                    <p className="text-destructive font-semibold flex items-center justify-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        You lost {territoryName}
                                    </p>
                                ) : (
                                    // Attacker lost
                                    <>
                                        <p className="text-muted-foreground flex items-center justify-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Attack failed
                                        </p>
                                        {betAmount > 0 && (
                                            <p className="text-destructive flex items-center justify-center gap-2">
                                                <Users className="h-4 w-4" />
                                                -{betAmount.toLocaleString()} followers (lost bet)
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full">
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
