import { Trophy, Flag } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'

const DIFFICULTY_CONFIG = {
    normal: { emoji: '🌱', label: 'NORMAL', color: 'bg-green-500' },
    hard: { emoji: '🔥', label: 'HARD', color: 'bg-orange-500' },
    extreme: { emoji: '💀', label: 'EXTREME', color: 'bg-red-500' }
}

/**
 * LeaderboardModal - Displays global charts for World Tour games
 * @param {object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onOpenChange - Callback to change visibility
 * @param {Array} props.attempts - Array of { team_id, score, difficulty, timestamp }
 * @param {string} props.gameName - Name of the game
 * @param {Object} props.teamsMap - Map of team_id to team object { name, color }
 */
export function LeaderboardModal({ open, onOpenChange, attempts = [], gameName, teamsMap = {} }) {
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
                                <div className="col-span-8">Team</div>
                                <div className="col-span-3 text-right">Score</div>
                            </div>

                            {/* Entries */}
                            <div className="space-y-1 max-h-80 overflow-y-auto">
                                {sortedAttempts.map((attempt, index) => {
                                    const team = teamsMap[attempt.team_id] || {}
                                    const isTopRank = index === 0

                                    return (
                                        <div
                                            key={`${attempt.team_id}-${attempt.timestamp?.seconds || index}`}
                                            className={`p-2 rounded-lg text-sm ${isTopRank ? 'bg-yellow-500/10 border border-yellow-500/30' :
                                                index === 1 ? 'bg-slate-500/10' :
                                                    index === 2 ? 'bg-amber-700/10' : 'bg-muted/50'
                                                }`}
                                        >
                                            {/* Fan Favourite Badge Row (only for #1) */}
                                            {isTopRank && (
                                                <div className="mb-2 flex justify-start">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
                                                        <Trophy className="h-3 w-3" />
                                                        Fan Favourite
                                                    </div>
                                                </div>
                                            )}

                                            {/* Team Info Row */}
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-1 font-bold">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                                </div>
                                                <div className="col-span-8 flex items-center gap-2 flex-wrap">
                                                    <TeamChip name={team.name || 'Unknown'} color={team.color} />
                                                    {attempt.difficulty && DIFFICULTY_CONFIG[attempt.difficulty] && (
                                                        <Badge className={`${DIFFICULTY_CONFIG[attempt.difficulty].color} text-white text-xs`}>
                                                            {DIFFICULTY_CONFIG[attempt.difficulty].emoji} {DIFFICULTY_CONFIG[attempt.difficulty].label}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="col-span-3 text-right font-mono font-bold">
                                                    {attempt.score}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
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

