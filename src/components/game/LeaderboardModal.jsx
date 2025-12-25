import { Trophy } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

/**
 * LeaderboardModal - Displays global charts for World Tour games
 * @param {object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onOpenChange - Callback to change visibility
 * @param {Array} props.attempts - Array of { team_id, team_name, score, timestamp }
 * @param {string} props.gameName - Name of the game
 */
export function LeaderboardModal({ open, onOpenChange, attempts = [], gameName }) {
    // Sort attempts by score (highest first)
    const sortedAttempts = [...attempts].sort((a, b) => b.score - a.score)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Global Charts: {gameName}
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {sortedAttempts.length > 0 ? (
                        <div className="space-y-2">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
                                <div className="col-span-1">#</div>
                                <div className="col-span-6">Team</div>
                                <div className="col-span-3 text-right">Score</div>
                                <div className="col-span-2 text-right">Date</div>
                            </div>

                            {/* Entries */}
                            <div className="space-y-1 max-h-80 overflow-y-auto">
                                {sortedAttempts.map((attempt, index) => (
                                    <div
                                        key={`${attempt.team_id}-${attempt.timestamp?.seconds || index}`}
                                        className={`grid grid-cols-12 gap-2 p-2 rounded-lg text-sm ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                index === 1 ? 'bg-slate-500/10' :
                                                    index === 2 ? 'bg-amber-700/10' : 'bg-muted/50'
                                            }`}
                                    >
                                        <div className="col-span-1 font-bold">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                        </div>
                                        <div className="col-span-6 truncate font-medium">
                                            {attempt.team_name}
                                        </div>
                                        <div className="col-span-3 text-right font-mono font-bold">
                                            {attempt.score}
                                        </div>
                                        <div className="col-span-2 text-right text-xs text-muted-foreground">
                                            {attempt.timestamp?.toDate?.()
                                                ? new Date(attempt.timestamp.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No attempts yet.</p>
                            <p className="text-sm">Be the first to set a score!</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
