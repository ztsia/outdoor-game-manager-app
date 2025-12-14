import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChallengeStatus } from '@/hooks/useChallengeResponse'
import { getGameRules, cancelChallenge } from '@/services/challengeService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * WaitingPage - Dedicated page for attacker waiting for defender response
 * Includes countdown timer and auto-cancel on timeout
 */
export default function WaitingPage() {
    const navigate = useNavigate()
    const { territoryId } = useParams()
    const { status, territory } = useChallengeStatus(territoryId)

    const [timeRemaining, setTimeRemaining] = useState(null)
    const [timeoutSeconds, setTimeoutSeconds] = useState(120)

    // Guard: Only treat 'idle' as decline if we've seen 'requesting' first
    const hasSeenRequesting = useRef(false)
    const hasNavigated = useRef(false)
    const timerRef = useRef(null)

    console.log('[WaitingPage] Mounted with territoryId:', territoryId)
    console.log('[WaitingPage] Current status:', status)

    // Fetch game rules for timeout duration
    useEffect(() => {
        getGameRules().then(rules => {
            setTimeoutSeconds(rules.challengeTimeoutSeconds || 120)
        })
    }, [])

    // Calculate and update countdown
    useEffect(() => {
        if (!territory?.challenged_at) {
            setTimeRemaining(timeoutSeconds)
            return
        }

        const challengedAt = territory.challenged_at.toDate?.() || new Date(territory.challenged_at)
        const expiresAt = new Date(challengedAt.getTime() + timeoutSeconds * 1000)

        const updateTimer = () => {
            const now = new Date()
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
            setTimeRemaining(remaining)

            if (remaining <= 0 && !hasNavigated.current) {
                // Time expired - cancel the challenge
                hasNavigated.current = true
                console.log('[WaitingPage] Timeout! Canceling challenge...')
                cancelChallenge(territoryId).then(() => {
                    toast.error('Challenge expired. Your followers have been refunded.')
                    navigate('/dashboard', { replace: true })
                })
            }
        }

        updateTimer()
        timerRef.current = setInterval(updateTimer, 1000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [territory?.challenged_at, timeoutSeconds, territoryId, navigate])

    // Handle status changes
    useEffect(() => {
        if (hasNavigated.current) return
        if (!status) return

        if (status === 'requesting') {
            hasSeenRequesting.current = true
        }

        if (!hasSeenRequesting.current) return

        if (status === 'accepted') {
            hasNavigated.current = true
            if (timerRef.current) clearInterval(timerRef.current)
            toast.success('Challenge accepted! Starting game...')
            navigate(`/game/${territoryId}`, { replace: true })
        } else if (status === 'idle') {
            hasNavigated.current = true
            if (timerRef.current) clearInterval(timerRef.current)
            toast.error('Challenge was declined. Your followers have been refunded.')
            navigate('/dashboard', { replace: true })
        }
    }, [status, territoryId, navigate])

    const defenderName = territory?.owner_id?.replace('team_', '').toUpperCase() || 'Defender'

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isLowTime = timeRemaining !== null && timeRemaining <= 30

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 animate-in fade-in zoom-in">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <CardTitle className="text-xl">Awaiting Response</CardTitle>
                    <CardDescription>
                        Waiting for <span className="font-semibold text-foreground">{defenderName}</span> to accept your challenge...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {territory && (
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <p className="text-sm text-muted-foreground">Territory</p>
                            <p className="text-lg font-semibold">{territory.name}</p>

                            {/* Countdown Timer */}
                            <div className={`mt-3 flex items-center justify-center gap-2 text-2xl font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'
                                }`}>
                                {isLowTime ? (
                                    <AlertTriangle className="h-6 w-6" />
                                ) : (
                                    <Clock className="h-6 w-6" />
                                )}
                                <span>{formatTime(timeRemaining)}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Time remaining for response
                            </p>
                        </div>
                    )}

                    <p className="text-center text-xs text-muted-foreground">
                        You cannot leave until the defender responds or time expires.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
