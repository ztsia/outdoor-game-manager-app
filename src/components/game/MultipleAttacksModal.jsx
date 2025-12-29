import { useState, useEffect, useRef } from 'react'
import { useTeamData } from '@/hooks/useTeamData'
import { getGameRules } from '@/services/challengeService'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { TeamChip } from '@/components/ui/TeamChip'
import { Badge } from '@/components/ui/badge'
import { Swords, Clock, AlertTriangle } from 'lucide-react'

/**
 * MultipleAttacksModal - Shows a list of incoming challenges when multiple attacks arrive
 * @param {Object} props
 * @param {Array} props.challenges - Array of challenge objects
 * @param {Function} props.onSelect - Callback when a challenge is selected
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onOpenChange - Callback to change open state
 */
export function MultipleAttacksModal({ challenges, onSelect, open, onOpenChange }) {
    const [timeoutSeconds, setTimeoutSeconds] = useState(120)
    const [now, setNow] = useState(() => Date.now())

    // Fetch game rules for timeout duration
    useEffect(() => {
        getGameRules().then(rules => {
            setTimeoutSeconds(rules.challengeTimeoutSeconds || 120)
        })
    }, [])

    // Update timer every second
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getTimeRemaining = (challenge) => {
        if (!challenge.challenged_at) return null
        const challengedAt = challenge.challenged_at.toDate?.() || new Date(challenge.challenged_at)
        const expiresAt = new Date(challengedAt.getTime() + timeoutSeconds * 1000)
        return Math.max(0, Math.floor((expiresAt - now) / 1000))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <Swords className="h-8 w-8 text-destructive" />
                    </div>
                    <DialogTitle className="text-xl">
                        ⚔️ MULTIPLE ATTACKS!
                    </DialogTitle>
                    <DialogDescription>
                        {challenges.length} territories are under attack. Choose one to respond to.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {challenges.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            timeRemaining={getTimeRemaining(challenge)}
                            onClick={() => onSelect(challenge)}
                        />
                    ))}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-2">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    Accepting one will decline all others
                </p>
            </DialogContent>
        </Dialog>
    )
}

/**
 * ChallengeCard - Individual challenge item in the list
 */
function ChallengeCard({ challenge, timeRemaining, onClick }) {
    const { team: attackerTeam } = useTeamData(challenge.current_attacker_id)
    const isLowTime = timeRemaining !== null && timeRemaining <= 30

    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card
            className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{challenge.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <TeamChip
                                name={attackerTeam?.name}
                                color={attackerTeam?.color}
                            />
                            <Badge variant="outline" className="text-xs">
                                {challenge.stars} ⭐
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className={`flex items-center gap-1 text-sm font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-muted-foreground'
                            }`}>
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(timeRemaining)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {(challenge.bet_amount || 0).toLocaleString()} followers
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
