import { useEffect } from 'react'
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

    useEffect(() => {
        if (!status) return

        if (status === 'accepted') {
            toast.success('Challenge accepted! Starting game...')
            // Navigate to game host screen
            navigate(`/game/${territoryId}`)
        } else if (status === 'idle') {
            // Challenge was declined - territory reset to idle means declined
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
