import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { useChallengeResponse } from '@/hooks/useChallengeResponse'
import { useTeamData } from '@/hooks/useTeamData'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import { AlertTriangle, Shield, Swords, X, Eye } from 'lucide-react'
import { toast } from 'sonner'

/**
 * DefenderNotification - Global component that listens for incoming challenges
 * Shows Modal when idle, Banner when playing
 * Mount this in App.jsx or Layout
 */
export function DefenderNotification() {
    const { teamId, role } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { incomingChallenge, acceptChallenge, declineChallenge, loading } = useChallengeResponse(teamId)

    // Fetch attacker team data for the chip
    const { team: attackerTeam } = useTeamData(incomingChallenge?.current_attacker_id)

    // State for dismissing banner temporarily
    const [bannerDismissed, setBannerDismissed] = useState(false)
    const [showModal, setShowModal] = useState(false)

    // Only show for managers
    if (role !== 'MANAGER' || !incomingChallenge) {
        return null
    }

    // Determine if user is currently playing (e.g., on world tour page)
    const isPlaying = location.pathname.includes('/world-tour') || location.pathname.includes('/game/')

    const handleAccept = async () => {
        const result = await acceptChallenge(incomingChallenge.id)
        if (result.success) {
            toast.success('Challenge accepted!')
            setShowModal(false)
            navigate(`/game/${incomingChallenge.id}`)
        } else {
            toast.error(result.error || 'Failed to accept challenge')
        }
    }

    const handleDecline = async () => {
        const result = await declineChallenge(incomingChallenge.id)
        if (result.success) {
            toast.success('Challenge declined. Attacker refunded.')
            setShowModal(false)
        } else {
            toast.error(result.error || 'Failed to decline challenge')
        }
    }

    const handleWait = () => {
        setBannerDismissed(true)
        setShowModal(false)
    }

    const territoryName = incomingChallenge.name || 'Unknown Territory'

    // Show Modal when idle/dashboard OR when user clicks VIEW
    if (!isPlaying || showModal) {
        return (
            <Dialog open={true} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md" hideClose>
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <Swords className="h-8 w-8 text-destructive" />
                        </div>
                        <DialogTitle className="text-xl">
                            ⚔️ INCOMING ATTACK!
                        </DialogTitle>
                        <DialogDescription className="text-base flex items-center justify-center gap-2">
                            <TeamChip
                                name={attackerTeam?.name}
                                color={attackerTeam?.color}
                            /> is challenging your territory!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-lg bg-muted p-4 text-center">
                        <p className="text-sm text-muted-foreground">Territory Under Attack</p>
                        <p className="text-lg font-bold">{territoryName}</p>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <Badge variant="outline">
                                {incomingChallenge.stars} ⭐
                            </Badge>
                            <Badge variant="secondary">
                                {incomingChallenge.bet_amount?.toLocaleString() || 0} Followers at stake
                            </Badge>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            className="w-full"
                            onClick={handleAccept}
                            disabled={loading}
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            ACCEPT CHALLENGE
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleDecline}
                            disabled={loading}
                        >
                            <X className="mr-2 h-4 w-4" />
                            DECLINE
                        </Button>
                        {isPlaying && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleWait}
                            >
                                Wait (Continue Playing)
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    // Show Banner when playing (and not dismissed)
    if (isPlaying && !bannerDismissed) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 animate-pulse bg-destructive p-3 text-destructive-foreground shadow-lg">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-semibold">
                            ⚠️ Attack on {territoryName}! Finish current game to respond.
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowModal(true)}
                        >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleWait}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}
