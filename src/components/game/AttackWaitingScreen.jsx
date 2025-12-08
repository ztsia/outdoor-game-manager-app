import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChallengeStatus } from '@/hooks/useChallengeResponse'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, X } from 'lucide-react'
import { toast } from 'sonner'

/**
 * AttackWaitingScreen - Shows while waiting for defender to respond
 * Listens for challenge_status changes and redirects accordingly
 * 
 * @param {Object} props
 * @param {string} props.territoryId - Territory being challenged
 * @param {string} props.defenderName - Name of defending team
 * @param {Function} props.onCancel - Callback when user cancels (optional)
 */
export function AttackWaitingScreen({ territoryId, defenderName, onCancel }) {
    const navigate = useNavigate()
    const { status, territory } = useChallengeStatus(territoryId)

    // Guard: Only treat 'idle' as decline if we've seen 'requesting' first
    const hasSeenRequesting = useRef(false)

    useEffect(() => {
        // Debug logging
        console.log('[AttackWaitingScreen] Status update:', {
            status,
            territoryId,
            hasSeenRequesting: hasSeenRequesting.current
        })

        if (!status) return

        // Mark when we've seen the requesting status
        if (status === 'requesting') {
            hasSeenRequesting.current = true
            console.log('[AttackWaitingScreen] Confirmed requesting status')
        }

        // Only react to status changes if we've confirmed the request was made
        if (!hasSeenRequesting.current) {
            console.log('[AttackWaitingScreen] Ignoring status - waiting for requesting confirmation')
            return
        }

        if (status === 'accepted') {
            console.log('[AttackWaitingScreen] Challenge accepted! Navigating...')
            toast.success('Challenge accepted! Starting game...')
            navigate(`/game/${territoryId}`)
        } else if (status === 'idle') {
            console.log('[AttackWaitingScreen] Challenge declined. Navigating to dashboard...')
            toast.error('Challenge was declined. Your followers have been refunded.')
            navigate('/dashboard')
        }
    }, [status, territoryId, navigate])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 animate-in fade-in zoom-in">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <CardTitle className="text-xl">Awaiting Response</CardTitle>
                    <CardDescription>
                        Waiting for <span className="font-semibold text-foreground">{defenderName || 'Defender'}</span> to accept your challenge...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {territory && (
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <p className="text-sm text-muted-foreground">Territory</p>
                            <p className="text-lg font-semibold">{territory.name}</p>
                            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>They have 2 minutes to respond</span>
                            </div>
                        </div>
                    )}

                    {onCancel && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onCancel}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Challenge
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
