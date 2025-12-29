import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { useChallengeResponse } from '@/hooks/useChallengeResponse'
import { useActiveWorldTourGame } from '@/hooks/useActiveWorldTourGame'
import { useTeamData } from '@/hooks/useTeamData'
import { getGameRules } from '@/services/challengeService'
import { MultipleAttacksModal } from '@/components/game/MultipleAttacksModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TeamChip } from '@/components/ui/TeamChip'
import { AlertTriangle, Shield, Swords, Eye, Clock, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

/**
 * DefenderNotification - Global component that listens for incoming challenges
 * Shows Modal when idle, Banner when playing
 * Supports multiple simultaneous challenges with auto-decline on accept
 */
export function DefenderNotification() {
    const { teamId, role } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const { incomingChallenges, acceptChallenge, declineChallenge, loading } = useChallengeResponse(teamId)
    const { activeGame: activeWorldTourGame } = useActiveWorldTourGame(teamId)

    // State for which challenge is selected (when viewing single challenge from list)
    const [selectedChallenge, setSelectedChallenge] = useState(null)
    // State for dismissing banner temporarily
    const [bannerDismissed, setBannerDismissed] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(null)
    const [timeoutSeconds, setTimeoutSeconds] = useState(120)

    const timerRef = useRef(null)
    const hasDeclined = useRef(false)

    // Current challenge to display (selected or first/only one)
    const currentChallenge = selectedChallenge || (incomingChallenges.length === 1 ? incomingChallenges[0] : null)

    // Fetch attacker team data for the chip
    const { team: attackerTeam } = useTeamData(currentChallenge?.current_attacker_id)

    // Fetch game rules for timeout duration
    useEffect(() => {
        getGameRules().then(rules => {
            setTimeoutSeconds(rules.challengeTimeoutSeconds || 120)
        })
    }, [])

    // Calculate and update countdown for current challenge
    useEffect(() => {
        if (!currentChallenge?.challenged_at) {
            setTimeRemaining(null)
            return
        }

        const challengedAt = currentChallenge.challenged_at.toDate?.()
            || new Date(currentChallenge.challenged_at)
        const expiresAt = new Date(challengedAt.getTime() + timeoutSeconds * 1000)

        const updateTimer = () => {
            const now = new Date()
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
            setTimeRemaining(remaining)

            if (remaining <= 0) {
                // Time expired - auto close (attacker's cancel will reset state)
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                }
                toast.info('Challenge expired')
                setBannerDismissed(true)
                setShowModal(false)
                setSelectedChallenge(null)
            }
        }

        updateTimer()
        timerRef.current = setInterval(updateTimer, 1000)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [currentChallenge?.challenged_at, currentChallenge?.id, timeoutSeconds])

    // Reset states when challenges change
    useEffect(() => {
        hasDeclined.current = false
        // If selected challenge is no longer in the list, clear selection
        if (selectedChallenge && !incomingChallenges.find(c => c.id === selectedChallenge.id)) {
            setSelectedChallenge(null)
        }
    }, [incomingChallenges, selectedChallenge])

    // Only show for managers with incoming challenges
    if (role !== 'MANAGER' || incomingChallenges.length === 0) {
        return null
    }

    // Determine if user is currently playing (territory game or ACTIVE World Tour)
    const isInTerritoryGame = location.pathname.includes('/game/')
    const isWorldTourInProgress = !!activeWorldTourGame
    const isPlaying = isInTerritoryGame || isWorldTourInProgress

    // Handle accept - also decline all other challenges
    const handleAccept = async () => {
        if (!currentChallenge) return
        if (timerRef.current) clearInterval(timerRef.current)

        const result = await acceptChallenge(currentChallenge.id)
        if (result.success) {
            // Race condition mitigation: fetch latest challenges before declining
            const otherChallenges = incomingChallenges.filter(c => c.id !== currentChallenge.id)

            // Decline all other challenges
            if (otherChallenges.length > 0) {
                for (const other of otherChallenges) {
                    await declineChallenge(other.id)
                }
                toast.success(`Challenge accepted! ${otherChallenges.length} other challenge(s) declined.`)
            } else {
                toast.success('Challenge accepted!')
            }

            setShowModal(false)
            setSelectedChallenge(null)
            navigate(`/game/${currentChallenge.id}`)
        } else {
            toast.error(result.error || 'Failed to accept challenge')
        }
    }

    const handleDecline = async () => {
        if (!currentChallenge) return
        if (hasDeclined.current) return
        hasDeclined.current = true
        if (timerRef.current) clearInterval(timerRef.current)

        const result = await declineChallenge(currentChallenge.id)
        if (result.success) {
            toast.success('Challenge declined. Attacker refunded.')
            setShowModal(false)
            setSelectedChallenge(null)
        } else {
            toast.error(result.error || 'Failed to decline challenge')
            hasDeclined.current = false
        }
    }

    // Handle modal close = implicit decline (only for single challenge view)
    const handleModalClose = (open) => {
        if (!open && currentChallenge) {
            handleDecline()
        }
    }

    // Handle back to list (for multiple challenges)
    const handleBack = () => {
        setSelectedChallenge(null)
    }

    const handleWait = () => {
        setBannerDismissed(true)
        setShowModal(false)
        setSelectedChallenge(null)
    }

    const handleSelectChallenge = (challenge) => {
        setSelectedChallenge(challenge)
        hasDeclined.current = false
    }

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isLowTime = timeRemaining !== null && timeRemaining <= 30

    // Multiple challenges - show list modal first
    if (incomingChallenges.length > 1 && !selectedChallenge && (!isPlaying || showModal)) {
        return (
            <MultipleAttacksModal
                challenges={incomingChallenges}
                onSelect={handleSelectChallenge}
                open={true}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowModal(false)
                    }
                }}
            />
        )
    }

    // Show single challenge modal when idle/dashboard OR when user clicks VIEW OR selected from list
    if (currentChallenge && (!isPlaying || showModal)) {
        const territoryName = currentChallenge.name || 'Unknown Territory'
        const showBackButton = incomingChallenges.length > 1

        return (
            <Dialog open={true} onOpenChange={handleModalClose}>
                <DialogContent className="sm:max-w-md">
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
                                {currentChallenge.stars} ⭐
                            </Badge>
                            <Badge variant="secondary">
                                {currentChallenge.bet_amount?.toLocaleString() || 0} Followers at stake
                            </Badge>
                        </div>

                        {/* Countdown Timer */}
                        <div className={`mt-3 flex items-center justify-center gap-2 text-xl font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'
                            }`}>
                            {isLowTime ? (
                                <AlertTriangle className="h-5 w-5" />
                            ) : (
                                <Clock className="h-5 w-5" />
                            )}
                            <span>{formatTime(timeRemaining)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Time to respond
                        </p>
                    </div>

                    {/* Warning about other challenges being declined */}
                    {incomingChallenges.length > 1 && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>
                                Accepting this will decline {incomingChallenges.length - 1} other challenge(s).
                            </span>
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            className="w-full"
                            onClick={handleAccept}
                            disabled={loading}
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            {isWorldTourInProgress ? 'ACCEPT (Ask to Wait)' : 'ACCEPT CHALLENGE'}
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleDecline}
                            disabled={loading}
                        >
                            DECLINE
                        </Button>
                        {showBackButton && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        )}
                        {isPlaying && !isWorldTourInProgress && !showBackButton && (
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

    // Show Banner when playing World Tour (and not dismissed)
    if (isWorldTourInProgress && !bannerDismissed) {
        const territoryName = currentChallenge?.name || `${incomingChallenges.length} territories`
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-destructive p-3 text-destructive-foreground shadow-lg animate-[pop-shrink_2s_ease-in-out_infinite]">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-semibold">
                            ⚔️ Attack on {territoryName}!
                            {timeRemaining !== null && (
                                <span className="ml-2">({formatTime(timeRemaining)})</span>
                            )}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowModal(true)}
                    >
                        <Eye className="mr-1 h-4 w-4" />
                        Respond
                    </Button>
                </div>
            </div>
        )
    }

    return null
}
